import DrugInteraction from "../../schemas/interactions/drugInteractionSchema.js";
import { drugInteractionSeedData } from "./drugInteractionSeedData.js";

export const seedDrugInteractions = async () => {
  for (const interaction of drugInteractionSeedData) {
    const existingInteraction = await DrugInteraction.findOne({
      where: {
        drugARxcui: interaction.drugARxcui,
        drugBRxcui: interaction.drugBRxcui,
      },
    });

    if (!existingInteraction) {
      await DrugInteraction.create(interaction);
    }
  }
};
