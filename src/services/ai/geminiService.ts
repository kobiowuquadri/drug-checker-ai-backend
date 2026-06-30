import axios from "axios";
import { DrugInteraction } from "../../schemas/interactions/drugInteractionSchema.js";
import { DuplicateTherapyWarning, InteractionResult, SafetySummary, SelectedDrug } from "../../types/interactions/interaction.js";

const getGeminiEndpoint = () => {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
};

// ── Medication image scan ─────────────────────────────────────────────────────

const SCAN_PROMPT = `You are a medication label scanner. Look at this image and identify the medication.

Return your answer in EXACTLY this format — two lines, nothing else:
BRAND: [brand or product name printed on the label, or UNKNOWN]
GENERIC: [active ingredient INN/generic name(s), or UNKNOWN]

Rules:
- BRAND is the product/trade name (e.g. Synriam, Tylenol, Brufen)
- GENERIC is the International Nonproprietary Name of the active ingredient(s). If multiple, separate with " + " (e.g. Artesunate + Piperaquine)
- If no medication is visible or the image is too unclear, return UNKNOWN for both
- Return ONLY the two lines above — no extra text, no explanations`;

function parseScanResponse(raw: string): { medicationName: string; genericName: string } {
  let medicationName = "UNKNOWN";
  let genericName = "UNKNOWN";

  for (const line of raw.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const upper = line.toUpperCase();
    if (upper.startsWith("BRAND:")) {
      const val = line.slice(line.indexOf(":") + 1).trim();
      if (val && val.toUpperCase() !== "UNKNOWN") medicationName = val;
    } else if (upper.startsWith("GENERIC:")) {
      const val = line.slice(line.indexOf(":") + 1).trim();
      if (val && val.toUpperCase() !== "UNKNOWN") genericName = val;
    }
  }

  // Fallback: if Gemini ignored the format and returned a plain name
  if (medicationName === "UNKNOWN" && genericName === "UNKNOWN") {
    const plain = raw.trim().split("\n")[0].trim();
    if (plain && !plain.includes(":")) medicationName = plain;
  }

  return { medicationName, genericName };
}

export const identifyMedicationFromImage = async (
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<{ medicationName: string; genericName: string }> => {
  if (!process.env.GEMINI_API_KEY) return { medicationName: "UNKNOWN", genericName: "UNKNOWN" };

  try {
    const response = await axios.post(
      getGeminiEndpoint(),
      {
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: imageBase64 } },
              { text: SCAN_PROMPT },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, topP: 0.7, maxOutputTokens: 80 },
      },
      { params: { key: process.env.GEMINI_API_KEY } }
    );

    return parseScanResponse(extractGeminiText(response.data));
  } catch {
    return { medicationName: "UNKNOWN", genericName: "UNKNOWN" };
  }
};

// ── AI interaction assessment for pairs not in local DB ──────────────────────

const AI_ASSESS_PROMPT = (drugA: SelectedDrug, drugB: SelectedDrug) => `You are a clinical pharmacologist. Assess the known pharmacological interaction between these two medications.

Drug A: ${drugA.name}
Drug B: ${drugB.name}

Based on established pharmacology, known mechanisms, and medical literature, provide your assessment.

Respond in EXACTLY this format — 4 lines, nothing else:
SEVERITY: [NONE | LOW | MODERATE | HIGH]
EFFECT: [one clear sentence describing the interaction, or "No clinically significant interaction identified."]
RECOMMENDATION: [one clear sentence for the patient or clinician]
EXPLANATION: [2-3 sentences explaining the mechanism, clinical relevance, and what to monitor]

Severity definitions:
NONE = no known clinically significant interaction
LOW = minor interaction, generally safe with routine monitoring
MODERATE = clinically relevant, may require dose adjustment or closer monitoring
HIGH = significant risk, avoid concurrent use or requires specialist management`;

type AiAssessment = {
  severity: "NONE" | "LOW" | "MODERATE" | "HIGH";
  effect: string;
  recommendation: string;
  explanation: string;
};

function parseAssessmentResponse(raw: string): AiAssessment | null {
  let severity: AiAssessment["severity"] = "NONE";
  let effect = "";
  let recommendation = "";
  let explanation = "";

  for (const line of raw.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim().toUpperCase();
    const val = line.slice(colon + 1).trim();

    if (key === "SEVERITY") {
      const s = val.toUpperCase() as AiAssessment["severity"];
      if (["NONE", "LOW", "MODERATE", "HIGH"].includes(s)) severity = s;
    } else if (key === "EFFECT") {
      effect = val;
    } else if (key === "RECOMMENDATION") {
      recommendation = val;
    } else if (key === "EXPLANATION") {
      explanation = val;
    }
  }

  if (!effect || !recommendation) return null;
  return { severity, effect, recommendation, explanation };
}

export const assessUnverifiedInteraction = async (
  drugA: SelectedDrug,
  drugB: SelectedDrug
): Promise<AiAssessment | null> => {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const response = await axios.post(
      getGeminiEndpoint(),
      {
        systemInstruction: {
          parts: [{ text: "You are a clinical pharmacologist providing accurate pharmacological interaction assessments based on established medical literature." }],
        },
        contents: [{ parts: [{ text: AI_ASSESS_PROMPT(drugA, drugB) }] }],
        generationConfig: { temperature: 0.1, topP: 0.75, maxOutputTokens: 400 },
      },
      { params: { key: process.env.GEMINI_API_KEY } }
    );

    return parseAssessmentResponse(extractGeminiText(response.data));
  } catch {
    return null;
  }
};

// ── Interaction pair explanation ──────────────────────────────────────────────

const buildPairPrompt = (drugA: SelectedDrug, drugB: SelectedDrug, interaction: DrugInteraction) => {
  return [
    "Explain this verified drug interaction in clear, practical language for a patient or clinician.",
    "Use ONLY the verified data below. Do not add new medical facts, new symptoms, new mechanisms, or new recommendations.",
    "Return exactly 3 short paragraphs:",
    "1. What this interaction means in plain language.",
    "2. Why the severity level matters for patient safety.",
    "3. What the patient should do next, based only on the verified recommendation below.",
    "",
    `Drug A: ${drugA.name} (RxCUI: ${drugA.rxcui})`,
    `Drug B: ${drugB.name} (RxCUI: ${drugB.rxcui})`,
    `Verified severity: ${interaction.severity}`,
    `Verified clinical effect: ${interaction.effect}`,
    `Verified recommendation: ${interaction.recommendation}`,
    `Source: ${interaction.source}`,
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

const hasCompleteEnding = (text: string) => /[.!?)]$/.test(text.trim());

const isUsableExplanation = (text: string) => text.length >= 180 && hasCompleteEnding(text);

const buildFallbackPairExplanation = (
  drugA: SelectedDrug,
  drugB: SelectedDrug,
  interaction: DrugInteraction
) => {
  return [
    `${drugA.name} and ${drugB.name} have a verified ${interaction.severity.toLowerCase()} severity interaction.`,
    `Clinical effect: ${interaction.effect}`,
    `Recommended action: ${interaction.recommendation}`,
    `Source: ${interaction.source}.`,
  ].join("\n\n");
};

const requestPairExplanation = async (drugA: SelectedDrug, drugB: SelectedDrug, interaction: DrugInteraction) => {
  const response = await axios.post(
    getGeminiEndpoint(),
    {
      systemInstruction: {
        parts: [{ text: "You explain verified drug interaction records in clear patient-friendly language. You must not invent or add any medical data beyond what is provided." }],
      },
      contents: [{ parts: [{ text: buildPairPrompt(drugA, drugB, interaction) }] }],
      generationConfig: { temperature: 0.2, topP: 0.8, maxOutputTokens: 700 },
    },
    { params: { key: process.env.GEMINI_API_KEY } }
  );
  return extractGeminiText(response.data);
};

export const explainVerifiedInteraction = async (
  drugA: SelectedDrug,
  drugB: SelectedDrug,
  interaction: DrugInteraction
) => {
  if (!process.env.GEMINI_API_KEY) {
    return buildFallbackPairExplanation(drugA, drugB, interaction);
  }

  try {
    const explanation = await requestPairExplanation(drugA, drugB, interaction);
    if (isUsableExplanation(explanation)) return explanation;

    const retry = await requestPairExplanation(drugA, drugB, interaction);
    if (isUsableExplanation(retry)) return retry;

    return buildFallbackPairExplanation(drugA, drugB, interaction);
  } catch {
    return buildFallbackPairExplanation(drugA, drugB, interaction);
  }
};

// ── Medication safety summary ─────────────────────────────────────────────────

const buildSummaryPrompt = (
  selectedDrugs: SelectedDrug[],
  results: InteractionResult[],
  duplicateTherapies: DuplicateTherapyWarning[],
  safetySummary: SafetySummary
) => {
  const verifiedResults = results
    .filter((r) => r.verified)
    .map((r) => ({
      drugA: r.drugA.name,
      drugB: r.drugB.name,
      severity: r.severity,
      effect: r.effect,
      recommendation: r.recommendation,
    }));

  const unverifiedPairs = results
    .filter((r) => !r.verified)
    .map((r) => `${r.drugA.name} + ${r.drugB.name}`);

  const drugNames = selectedDrugs.map((d) => d.name).join(", ");

  const lines = [
    "You are a clinical medication safety assistant. Write a concise safety summary for the medication combination below.",
    "Rules:",
    "- Base your summary on the verified interaction data provided. For unverified pairs, you may draw on general pharmacological knowledge to note any clinically important considerations, but clearly distinguish these from verified findings.",
    "- Do NOT invent symptoms, mechanisms, or recommendations not supported by the data or established pharmacology.",
    "- Keep language clear and actionable for both patients and clinicians.",
    "- Structure your response in exactly 3 sections using these exact headers: Overall risk, Key findings, Next steps.",
    "- Under Key findings, write each point as a bullet starting with '-'.",
    "- Under Next steps, write each action as a bullet starting with '-'.",
    "",
    `Selected drugs: ${drugNames}`,
    `Total pairs checked: ${safetySummary.totalPairsChecked}`,
    `Verified interactions found: ${safetySummary.verifiedInteractions}`,
    `Highest severity: ${safetySummary.highestSeverity || "none"}`,
    `Duplicate therapies: ${safetySummary.duplicateTherapies}`,
  ];

  if (verifiedResults.length > 0) {
    lines.push("", "Verified interactions:");
    verifiedResults.forEach((r) => {
      lines.push(`- ${r.drugA} + ${r.drugB} [${r.severity}]: ${r.effect} | Recommendation: ${r.recommendation}`);
    });
  }

  if (duplicateTherapies.length > 0) {
    lines.push("", "Duplicate therapy warnings:");
    duplicateTherapies.forEach((d) => {
      lines.push(`- ${d.ingredient.name}: found in ${d.drugs.map((x) => x.name).join(", ")}. ${d.recommendation}`);
    });
  }

  if (unverifiedPairs.length > 0) {
    lines.push("", `Pairs with no local interaction record (apply general pharmacological knowledge if relevant): ${unverifiedPairs.join(", ")}`);
  }

  return lines.join("\n");
};

const buildFallbackSummary = (
  selectedDrugs: SelectedDrug[],
  results: InteractionResult[],
  duplicateTherapies: DuplicateTherapyWarning[],
  safetySummary: SafetySummary
) => {
  const drugNames = selectedDrugs.map((d) => d.name).join(", ");
  const verifiedResults = results.filter((r) => r.verified);

  const keyFindings = verifiedResults.length > 0
    ? verifiedResults.map((r) => `- ${r.drugA.name} + ${r.drugB.name} (${r.severity}): ${r.effect}`)
    : ["- No verified interaction records were found for the checked pairs in the local database."];

  const duplicateFindings = duplicateTherapies.map(
    (w) => `- Duplicate therapy: ${w.ingredient.name} found in ${w.drugs.map((d) => d.name).join(" and ")}. ${w.recommendation}`
  );

  const nextSteps = safetySummary.highestSeverity
    ? [
        "- Review the findings above with a qualified healthcare professional before combining these medications.",
        "- Follow the specific recommendations listed for each verified interaction.",
      ]
    : [
        "- No verified local interactions were found, but this does not mean no interactions exist.",
        "- Always consult a qualified healthcare professional or pharmacist before combining medications.",
      ];

  return [
    "Overall risk",
    `Selected drugs: ${drugNames}. ${safetySummary.actionMessage}`,
    "",
    "Key findings",
    ...keyFindings,
    ...duplicateFindings,
    "",
    "Next steps",
    ...nextSteps,
  ].join("\n");
};

const requestSummary = async (prompt: string) => {
  const response = await axios.post(
    getGeminiEndpoint(),
    {
      systemInstruction: {
        parts: [{ text: "You are a clinical medication safety assistant. Summarize verified drug interaction data clearly and accurately. Do not invent medical information. Distinguish clearly between verified database findings and general pharmacological knowledge." }],
      },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.15, topP: 0.75, maxOutputTokens: 1800 },
    },
    { params: { key: process.env.GEMINI_API_KEY } }
  );
  return extractGeminiText(response.data);
};

export const explainMedicationSafetySummary = async (
  selectedDrugs: SelectedDrug[],
  results: InteractionResult[],
  duplicateTherapies: DuplicateTherapyWarning[],
  safetySummary: SafetySummary
) => {
  if (!process.env.GEMINI_API_KEY) {
    return buildFallbackSummary(selectedDrugs, results, duplicateTherapies, safetySummary);
  }

  try {
    const prompt = buildSummaryPrompt(selectedDrugs, results, duplicateTherapies, safetySummary);

    const summary = await requestSummary(prompt);
    if (summary.length >= 200 && hasCompleteEnding(summary)) return summary;

    const retry = await requestSummary(prompt);
    if (retry.length >= 200 && hasCompleteEnding(retry)) return retry;

    return buildFallbackSummary(selectedDrugs, results, duplicateTherapies, safetySummary);
  } catch {
    return buildFallbackSummary(selectedDrugs, results, duplicateTherapies, safetySummary);
  }
};
