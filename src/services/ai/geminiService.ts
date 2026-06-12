import axios from "axios";
import { DrugInteraction } from "../../schemas/interactions/drugInteractionSchema.js";
import { SelectedDrug } from "../../types/interactions/interaction.js";

const getGeminiEndpoint = () => {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
};

const buildPrompt = (drugA: SelectedDrug, drugB: SelectedDrug, interaction: DrugInteraction) => {
  return [
    "Explain the verified drug interaction below in clear patient-friendly language.",
    "Do not add new medical facts. Do not infer severity, effects, or recommendations beyond the verified data.",
    "",
    `Drug A: ${drugA.name} (${drugA.rxcui})`,
    `Drug B: ${drugB.name} (${drugB.rxcui})`,
    `Verified severity: ${interaction.severity}`,
    `Verified effect: ${interaction.effect}`,
    `Verified recommendation: ${interaction.recommendation}`,
    `Verified source: ${interaction.source}`,
  ].join("\n");
};

export const explainVerifiedInteraction = async (
  drugA: SelectedDrug,
  drugB: SelectedDrug,
  interaction: DrugInteraction
) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }

    const response = await axios.post(
      getGeminiEndpoint(),
      {
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
          maxOutputTokens: 220,
        },
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    return null;
  }
};
