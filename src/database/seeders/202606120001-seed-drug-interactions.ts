import { QueryInterface } from "sequelize";
import { drugInteractionSeedData } from "./drugInteractionSeedData.js";

export const up = async (queryInterface: QueryInterface) => {
  const now = new Date();

  await queryInterface.bulkInsert(
    "drug_interactions",
    drugInteractionSeedData.map((interaction) => ({
      ...interaction,
      createdAt: now,
      updatedAt: now,
    }))
  );
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.bulkDelete("drug_interactions", {});
};
