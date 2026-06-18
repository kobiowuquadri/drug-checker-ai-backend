import axios from "axios";
import { DrugInteraction } from "../../schemas/interactions/drugInteractionSchema.js";
import { DuplicateTherapyWarning, InteractionResult, SafetySummary, SelectedDrug } from "../../types/interactions/interaction.js";

const getGeminiEndpoint = () => {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
};

const buildPrompt = (drugA: SelectedDrug, drugB: SelectedDrug, interaction: DrugInteraction) => {
  return [
    "Explain this verified drug interaction in clear patient-friendly language.",
    "Use only the verified data below. Do not add new medical facts, new symptoms, new mechanisms, or new recommendations.",
    "Return 3 short paragraphs:",
    "1. What this interaction means.",
    "2. Why the severity matters.",
    "3. What the patient should do next based only on the verified recommendation.",
    "",
    `Drug A: ${drugA.name} (${drugA.rxcui})`,
    `Drug B: ${drugB.name} (${drugB.rxcui})`,
    `Verified severity: ${interaction.severity}`,
    `Verified effect: ${interaction.effect}`,
    `Verified recommendation: ${interaction.recommendation}`,
    `Verified source: ${interaction.source}`,
  ].join("\n");
};

const extractGeminiText = (data: any) => {
  const parts = data?.candidates?.[0]?.content?.parts || [];

  return parts
    .map((part: any) => part?.text)
    .filter(Boolean)
    .join("\n")
    .trim();
};

const hasCompleteEnding = (text: string) => {
  return /[.!?)]$/.test(text.trim());
};

const isUsableExplanation = (text: string) => {
  return text.length >= 180 && hasCompleteEnding(text);
};

const useGeminiPairExplanations = () => process.env.USE_GEMINI_PAIR_EXPLANATIONS === "true";

const buildFallbackInteractionExplanation = (
  drugA: SelectedDrug,
  drugB: SelectedDrug,
  interaction: DrugInteraction
) => {
  return [
    `${drugA.name} and ${drugB.name} have a verified ${interaction.severity} interaction in the local interaction database.`,
    `Verified effect: ${interaction.effect}`,
    `Recommended next step: ${interaction.recommendation}`,
    `Source: ${interaction.source}.`,
  ].join("\n\n");
};

const requestExplanation = async (drugA: SelectedDrug, drugB: SelectedDrug, interaction: DrugInteraction) => {
  const response = await axios.post(
    getGeminiEndpoint(),
    {
      systemInstruction: {
        parts: [
          {
            text: "You explain verified drug interaction records. You must not invent medical data. Keep the answer complete, practical, and easy to understand.",
          },
        ],
      },
      contents: [
        {
          parts: [
            {
              text: buildPrompt(drugA, drugB, interaction),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 700,
      },
    },
    {
      params: { key: process.env.GEMINI_API_KEY },
    }
  );

  return extractGeminiText(response.data);
};

export const explainVerifiedInteraction = async (
  drugA: SelectedDrug,
  drugB: SelectedDrug,
  interaction: DrugInteraction
) => {
  try {
    if (!process.env.GEMINI_API_KEY || !useGeminiPairExplanations()) {
      return buildFallbackInteractionExplanation(drugA, drugB, interaction);
    }

    const explanation = await requestExplanation(drugA, drugB, interaction);

    if (isUsableExplanation(explanation)) {
      return explanation;
    }

    const retryExplanation = await requestExplanation(drugA, drugB, interaction);

    if (isUsableExplanation(retryExplanation)) {
      return retryExplanation;
    }

    return buildFallbackInteractionExplanation(drugA, drugB, interaction);
  } catch (error) {
    return buildFallbackInteractionExplanation(drugA, drugB, interaction);
  }
};

const buildMedicationListPrompt = (
  selectedDrugs: SelectedDrug[],
  results: InteractionResult[],
  duplicateTherapies: DuplicateTherapyWarning[],
  safetySummary: SafetySummary
) => {
  const verifiedResults = results
    .filter((result) => result.verified)
    .map((result) => ({
      drugA: result.drugA.name,
      drugB: result.drugB.name,
      severity: result.severity,
      effect: result.effect,
      recommendation: result.recommendation,
      source: result.source,
    }));

  return [
    "Create a medication safety summary for the verified data below.",
    "Use only the JSON data in this prompt. Do not invent interactions, symptoms, mechanisms, or recommendations.",
    "Return 3 short sections: Overall risk, Key findings, Next steps.",
    "",
    `Selected drugs: ${JSON.stringify(selectedDrugs)}`,
    `Safety summary: ${JSON.stringify(safetySummary)}`,
    `Verified interactions: ${JSON.stringify(verifiedResults)}`,
    `Duplicate therapy warnings: ${JSON.stringify(duplicateTherapies)}`,
  ].join("\n");
};

const buildFallbackMedicationSafetySummary = (
  selectedDrugs: SelectedDrug[],
  results: InteractionResult[],
  duplicateTherapies: DuplicateTherapyWarning[],
  safetySummary: SafetySummary
) => {
  const verifiedResults = results.filter((result) => result.verified);
  const selectedDrugNames = selectedDrugs.map((drug) => drug.name).join(", ");
  const keyFindings = verifiedResults.length
    ? verifiedResults.map((result) => {
        return `- ${result.drugA.name} + ${result.drugB.name} (${result.severity}): ${result.effect} Recommendation: ${result.recommendation}`;
      })
    : ["- No verified local interaction records were found for the checked pairs."];
  const duplicateFindings = duplicateTherapies.map((warning) => {
    const drugNames = warning.drugs.map((drug) => drug.name).join(", ");
    return `- Duplicate therapy warning for ${warning.ingredient.name}: ${drugNames}. ${warning.recommendation}`;
  });

  return [
    "Overall risk",
    `Selected drugs: ${selectedDrugNames}. ${safetySummary.actionMessage}`,
    "",
    "Key findings",
    ...keyFindings,
    ...duplicateFindings,
    "",
    "Next steps",
    safetySummary.highestSeverity
      ? "Follow the listed recommendations and review this medication list with a qualified healthcare professional."
      : "No verified local interaction records were found, but this does not replace professional medical advice.",
  ].join("\n");
};

export const explainMedicationSafetySummary = async (
  selectedDrugs: SelectedDrug[],
  results: InteractionResult[],
  duplicateTherapies: DuplicateTherapyWarning[],
  safetySummary: SafetySummary
) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return buildFallbackMedicationSafetySummary(selectedDrugs, results, duplicateTherapies, safetySummary);
    }

    if (!results.some((result) => result.verified) && duplicateTherapies.length === 0) {
      return buildFallbackMedicationSafetySummary(selectedDrugs, results, duplicateTherapies, safetySummary);
    }

    const requestSummary = async () => {
      const response = await axios.post(
        getGeminiEndpoint(),
        {
          systemInstruction: {
            parts: [
              {
                text: "You summarize verified medication safety data. You must not invent medical data, mechanisms, symptoms, or recommendations. Only restate and organize the provided data.",
              },
            ],
          },
          contents: [
            {
              parts: [
                {
                  text: buildMedicationListPrompt(selectedDrugs, results, duplicateTherapies, safetySummary),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.7,
            maxOutputTokens: 1600,
          },
        },
        {
          params: { key: process.env.GEMINI_API_KEY },
        }
      );

      return extractGeminiText(response.data);
    };

    const summary = await requestSummary();
    if (summary.length >= 220 && hasCompleteEnding(summary)) {
      return summary;
    }

    const retrySummary = await requestSummary();
    if (retrySummary.length >= 220 && hasCompleteEnding(retrySummary)) {
      return retrySummary;
    }

    return buildFallbackMedicationSafetySummary(selectedDrugs, results, duplicateTherapies, safetySummary);
  } catch (error) {
    return buildFallbackMedicationSafetySummary(selectedDrugs, results, duplicateTherapies, safetySummary);
  }
};
