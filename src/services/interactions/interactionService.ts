import { Op } from "sequelize";
import DrugInteraction from "../../schemas/interactions/drugInteractionSchema.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";
import { InteractionCheckRequest, InteractionResponse, InteractionResult, SelectedDrug } from "../../types/interactions/interaction.js";
import { explainVerifiedInteraction } from "../ai/geminiService.js";

const generateDrugPairs = (drugs: SelectedDrug[]) => {
  const pairs: Array<[SelectedDrug, SelectedDrug]> = [];

  for (let i = 0; i < drugs.length; i += 1) {
    for (let j = i + 1; j < drugs.length; j += 1) {
      pairs.push([drugs[i], drugs[j]]);
    }
  }

  return pairs;
};

const findInteraction = async (drugA: SelectedDrug, drugB: SelectedDrug) => {
  return DrugInteraction.findOne({
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

export const checkInteractionsService = async (
  data: InteractionCheckRequest,
  callback: (data: InteractionResponse) => void
) => {
  try {
    const drugs = data.drugs || [];

    if (drugs.length < 2 || drugs.length > 5) {
      return callback(messageHandler("Please provide between 2 and 5 drugs", false, BAD_REQUEST, {}));
    }

    const pairs = generateDrugPairs(drugs);
    const results: InteractionResult[] = [];

    for (const [drugA, drugB] of pairs) {
      const interaction = await findInteraction(drugA, drugB);

      if (!interaction) {
        results.push({
          drugA,
          drugB,
          verified: false,
          severity: null,
          effect: "No verified interaction found in the local interaction database.",
          recommendation: "Consult a qualified healthcare professional before combining medications.",
          source: "Local interaction database",
          aiExplanation: null,
        });
        continue;
      }

      const aiExplanation = await explainVerifiedInteraction(drugA, drugB, interaction);

      results.push({
        drugA,
        drugB,
        verified: true,
        severity: interaction.severity,
        effect: interaction.effect,
        recommendation: interaction.recommendation,
        source: interaction.source,
        aiExplanation,
      });
    }

    return callback(messageHandler("Interaction check completed successfully", true, SUCCESS, {
      selectedDrugs: drugs,
      results,
    }));
  } catch (error) {
    return callback(messageHandler("An error occured while checking drug interactions.", false, INTERNAL_SERVER_ERROR, error));
  }
};
