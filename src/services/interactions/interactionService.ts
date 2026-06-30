import axios from "axios";
import { Op } from "sequelize";
import DrugInteraction from "../../schemas/interactions/drugInteractionSchema.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";
import { DuplicateTherapyWarning, InteractionCheckRequest, InteractionResponse, InteractionResult, SafetySummary, SelectedDrug } from "../../types/interactions/interaction.js";
import { assessUnverifiedInteraction, explainMedicationSafetySummary, explainVerifiedInteraction } from "../ai/geminiService.js";
import { resolveDrugIngredients } from "../drugs/rxnavService.js";
import { Severity } from "../../constants/severity.js";
import InteractionHistory from "../../schemas/history/interactionHistorySchema.js";
import Auth from "../../schemas/users/authSchema.js";

const RXNAV_BASE = process.env.RXNAV_BASE_URL || "https://rxnav.nlm.nih.gov/REST";

const RXNAV_SEVERITY_MAP: Record<string, Severity> = {
  "major": Severity.HIGH,
  "contraindicated": Severity.HIGH,
  "severe": Severity.HIGH,
  "moderate": Severity.MODERATE,
  "minor": Severity.LOW,
  "low": Severity.LOW,
};

async function rxNavInteractionLookup(
  drugA: SelectedDrug,
  drugB: SelectedDrug
): Promise<{ severity: Severity; effect: string; recommendation: string; source: string } | null> {
  const rxcuis = `${drugA.rxcui}+${drugB.rxcui}`;
  try {
    const { data } = await axios.get(`${RXNAV_BASE}/interaction/list.json`, {
      params: { rxcuis },
      timeout: 7000,
    });

    const groups = data?.fullInteractionTypeGroup ?? [];
    for (const group of groups) {
      const sourceName = group.sourceName || "RxNav";
      for (const type of group.fullInteractionType ?? []) {
        for (const pair of type.interactionPair ?? []) {
          const rawSeverity = (pair.severity || "").toLowerCase();
          const severity = RXNAV_SEVERITY_MAP[rawSeverity] || Severity.LOW;
          const description: string = pair.description || "";
          if (!description) continue;

          const effect = description.length > 400 ? description.slice(0, 397) + "..." : description;
          const recommendation =
            severity === Severity.HIGH
              ? `Avoid concurrent use. Consult a clinician immediately.`
              : severity === Severity.MODERATE
              ? `Monitor closely. Consult a pharmacist or clinician before combining.`
              : `Generally manageable. Inform your prescriber about both medications.`;

          return { severity, effect, recommendation, source: `RxNav (${sourceName})` };
        }
      }
    }
  } catch {}
  return null;
}

const generateDrugPairs = (drugs: SelectedDrug[]) => {
  const pairs: Array<[SelectedDrug, SelectedDrug]> = [];

  for (let i = 0; i < drugs.length; i += 1) {
    for (let j = i + 1; j < drugs.length; j += 1) {
      pairs.push([drugs[i], drugs[j]]);
    }
  }

  return pairs;
};

const normalizeDrugCandidates = async (drug: SelectedDrug) => {
  const ingredients = await resolveDrugIngredients(drug);
  const candidates = new Map<string, SelectedDrug>();

  candidates.set(drug.rxcui, drug);
  ingredients.forEach((ingredient) => candidates.set(ingredient.rxcui, ingredient));

  return Array.from(candidates.values());
};

const normalizeAllSelectedDrugs = async (drugs: SelectedDrug[]) => {
  const normalizedEntries = await Promise.all(
    drugs.map(async (drug) => ({
      drug,
      candidates: await normalizeDrugCandidates(drug),
    }))
  );

  return normalizedEntries;
};

const findInteractionForCandidates = async (drugA: SelectedDrug, drugB: SelectedDrug) => {
  return await DrugInteraction.findOne({
    where: {
      [Op.or]: [
        {
          drugARxcui: drugA.rxcui,
          drugBRxcui: drugB.rxcui,
        },
        {
          drugARxcui: drugB.rxcui,
          drugBRxcui: drugA.rxcui,
        },
        {
          drugAName: drugA.name,
          drugBName: drugB.name,
        },
        {
          drugAName: drugB.name,
          drugBName: drugA.name,
        },
      ],
    },
  });
};

const findInteraction = async (
  drugA: SelectedDrug,
  drugB: SelectedDrug,
  normalizedDrugs: Array<{ drug: SelectedDrug; candidates: SelectedDrug[] }>
) => {
  const drugACandidates = normalizedDrugs.find((entry) => entry.drug.rxcui === drugA.rxcui)?.candidates || await normalizeDrugCandidates(drugA);
  const drugBCandidates = normalizedDrugs.find((entry) => entry.drug.rxcui === drugB.rxcui)?.candidates || await normalizeDrugCandidates(drugB);

  for (const drugACandidate of drugACandidates) {
    for (const drugBCandidate of drugBCandidates) {
      const interaction = await findInteractionForCandidates(drugACandidate, drugBCandidate);

      if (interaction) {
        return {
          interaction,
          matchedDrugA: drugACandidate,
          matchedDrugB: drugBCandidate,
        };
      }
    }
  }

  return null;
};

const detectDuplicateTherapies = (
  normalizedDrugs: Array<{ drug: SelectedDrug; candidates: SelectedDrug[] }>
): DuplicateTherapyWarning[] => {
  const ingredientMap = new Map<string, { ingredient: SelectedDrug; drugs: SelectedDrug[] }>();

  normalizedDrugs.forEach(({ drug, candidates }) => {
    candidates.forEach((candidate) => {
      const key = candidate.rxcui;
      const existing = ingredientMap.get(key) || { ingredient: candidate, drugs: [] };

      if (!existing.drugs.some((selectedDrug) => selectedDrug.rxcui === drug.rxcui)) {
        existing.drugs.push(drug);
      }

      ingredientMap.set(key, existing);
    });
  });

  return Array.from(ingredientMap.values())
    .filter((entry) => entry.drugs.length > 1)
    .map((entry) => ({
      ingredient: entry.ingredient,
      drugs: entry.drugs,
      severity: Severity.MODERATE,
      effect: `Multiple selected drugs contain or resolve to ${entry.ingredient.name}. This may represent duplicate therapy.`,
      recommendation: "Review the selected medication list with a clinician or pharmacist before taking these together.",
      source: "RxNav ingredient normalization",
    }));
};

const buildSafetySummary = (
  selectedDrugs: SelectedDrug[],
  results: InteractionResult[],
  duplicateTherapies: DuplicateTherapyWarning[]
): SafetySummary => {
  const severitySummary = {
    [Severity.LOW]: 0,
    [Severity.MODERATE]: 0,
    [Severity.HIGH]: 0,
  };
  const severityRank = {
    [Severity.LOW]: 1,
    [Severity.MODERATE]: 2,
    [Severity.HIGH]: 3,
  };
  let highestSeverity: SafetySummary["highestSeverity"] = null;

  results.forEach((result) => {
    const countable = (result.verified || result.isAiAssessed) && result.severity && result.severity in severitySummary;
    if (countable) {
      severitySummary[result.severity as Severity] += 1;

      if (!highestSeverity || severityRank[result.severity as Severity] > severityRank[highestSeverity]) {
        highestSeverity = result.severity as SafetySummary["highestSeverity"];
      }
    }
  });

  duplicateTherapies.forEach((warning) => {
    severitySummary[warning.severity] += 1;

    if (!highestSeverity || severityRank[warning.severity] > severityRank[highestSeverity]) {
      highestSeverity = warning.severity;
    }
  });

  const verifiedInteractions = results.filter((result) => result.verified || result.isAiAssessed).length;
  const unverifiedPairs = results.length - verifiedInteractions;
  const actionMessage = highestSeverity === Severity.HIGH
    ? "High severity findings were detected. Consult a clinician before combining these medications."
    : highestSeverity === Severity.MODERATE
      ? "Moderate safety findings were detected. Review this medication list with a clinician or pharmacist."
      : highestSeverity === Severity.LOW
        ? "Low severity findings were detected. Follow the listed recommendations."
        : "No verified local interactions or duplicate therapy warnings were found for this selection.";

  return {
    totalSelectedDrugs: selectedDrugs.length,
    totalPairsChecked: results.length,
    verifiedInteractions,
    unverifiedPairs,
    duplicateTherapies: duplicateTherapies.length,
    severitySummary,
    highestSeverity,
    actionMessage,
  };
};

const resolveHistoryUserId = async (userId: number | undefined, refreshToken: string | undefined) => {
  if (userId) {
    return userId;
  }

  if (!refreshToken) {
    return null;
  }

  const user = await Auth.findOne({ where: { refreshToken } });

  if (!user || (user.refreshTokenExpiresAt && new Date(user.refreshTokenExpiresAt) < new Date())) {
    return null;
  }

  return user.id;
};

const saveInteractionHistory = async (
  userId: number | undefined,
  refreshToken: string | undefined,
  selectedDrugs: SelectedDrug[],
  results: any
) => {
  const resolvedUserId = await resolveHistoryUserId(userId, refreshToken);

  if (!resolvedUserId) {
    return { history: null, error: null };
  }

  try {
    const history = await InteractionHistory.create({
      userId: resolvedUserId,
      selectedDrugs,
      results,
    });

    return { history, error: null };
  } catch (error) {
    return { history: null, error };
  }
};

const buildVerifiedInteractionResponse = (results: InteractionResult[]) => {
  return results
    .filter((result) => result.verified || result.isAiAssessed)
    .map((result) => ({
      drugA: result.drugA,
      drugB: result.drugB,
      severity: result.severity,
      effect: result.effect,
      recommendation: result.recommendation,
      source: result.source,
      aiExplanation: result.aiExplanation,
      isAiGenerated: result.isAiAssessed ?? false,
    }));
};

export const checkInteractionsService = async (
  data: InteractionCheckRequest,
  userId: number | undefined,
  refreshToken: string | undefined,
  callback: (data: InteractionResponse) => void
) => {
  try {
    const drugs = data.drugs || [];

    if (drugs.length < 2 || drugs.length > 5) {
      return callback(messageHandler("Please provide between 2 and 5 drugs", false, BAD_REQUEST, {}));
    }

    const normalizedDrugs = await normalizeAllSelectedDrugs(drugs);
    const duplicateTherapies = detectDuplicateTherapies(normalizedDrugs);
    const pairs = generateDrugPairs(drugs);
    const results: InteractionResult[] = [];

    for (const [drugA, drugB] of pairs) {
      const match = await findInteraction(drugA, drugB, normalizedDrugs);

      if (!match) {
        // 1️⃣ Try RxNav interaction API (free, no key, real clinical data)
        const rxNavInteraction = await rxNavInteractionLookup(drugA, drugB);
        if (rxNavInteraction) {
          results.push({
            drugA,
            drugB,
            verified: false,
            isAiAssessed: true,
            severity: rxNavInteraction.severity,
            effect: rxNavInteraction.effect,
            recommendation: rxNavInteraction.recommendation,
            source: rxNavInteraction.source,
            aiExplanation: null,
          });
          continue;
        }

        // 2️⃣ Fall back to Gemini AI assessment
        const aiAssessment = await assessUnverifiedInteraction(drugA, drugB);
        if (aiAssessment && aiAssessment.severity !== "NONE") {
          results.push({
            drugA,
            drugB,
            verified: false,
            isAiAssessed: true,
            severity: aiAssessment.severity,
            effect: aiAssessment.effect,
            recommendation: aiAssessment.recommendation,
            source: "AI Analysis (Gemini)",
            aiExplanation: aiAssessment.explanation,
          });
        } else {
          results.push({
            drugA,
            drugB,
            verified: false,
            isAiAssessed: false,
            severity: null,
            effect: "No significant interaction identified in clinical databases or AI analysis for this combination.",
            recommendation: "Always consult a qualified healthcare professional or pharmacist before combining medications.",
            source: "AI Analysis (Gemini)",
            aiExplanation: aiAssessment?.explanation ?? null,
          });
        }
        continue;
      }

      const { interaction, matchedDrugA, matchedDrugB } = match;
      const aiExplanation = await explainVerifiedInteraction(drugA, drugB, interaction);

      results.push({
        drugA,
        drugB,
        matchedDrugA,
        matchedDrugB,
        verified: true,
        severity: interaction.severity,
        effect: interaction.effect,
        recommendation: interaction.recommendation,
        source: interaction.source,
        aiExplanation,
      });
    }

    const safetySummary = buildSafetySummary(drugs, results, duplicateTherapies);
    const aiSummary = await explainMedicationSafetySummary(drugs, results, duplicateTherapies, safetySummary);
    const verifiedInteractions = buildVerifiedInteractionResponse(results);
    const responseData = {
      selectedDrugs: drugs,
      duplicateTherapies,
      safetySummary,
      aiSummary,
      interactions: verifiedInteractions,
    };
    const savedHistory = await saveInteractionHistory(userId, refreshToken, drugs, responseData);

    if (savedHistory.error) {
      return callback(messageHandler("Interaction check completed, but history could not be saved.", false, INTERNAL_SERVER_ERROR, savedHistory.error));
    }

    return callback(messageHandler("Interaction check completed successfully", true, SUCCESS, {
      ...responseData,
      historySaved: Boolean(savedHistory.history),
      historyId: savedHistory.history?.id || null,
    }));
  } catch (error) {
    return callback(messageHandler("An error occured while checking drug interactions.", false, INTERNAL_SERVER_ERROR, error));
  }
};
