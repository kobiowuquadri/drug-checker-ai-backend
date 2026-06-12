import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("drug_interactions", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    drugAName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    drugBName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    drugARxcui: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    drugBRxcui: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM("LOW", "MODERATE", "HIGH"),
      allowNull: false,
    },
    effect: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    recommendation: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex("drug_interactions", ["drugARxcui", "drugBRxcui"]);
  await queryInterface.addIndex("drug_interactions", ["drugAName", "drugBName"]);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable("drug_interactions");
};
