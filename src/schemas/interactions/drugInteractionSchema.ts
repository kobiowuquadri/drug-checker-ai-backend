import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database/db.js";
import { Severity } from "../../constants/severity.js";

export interface DrugInteractionAttributes {
  id: number;
  drugAName: string;
  drugBName: string;
  drugARxcui: string;
  drugBRxcui: string;
  severity: Severity;
  effect: string;
  recommendation: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DrugInteractionCreationAttributes extends Optional<DrugInteractionAttributes, "id" | "createdAt" | "updatedAt"> {}

export class DrugInteraction extends Model<DrugInteractionAttributes, DrugInteractionCreationAttributes> implements DrugInteractionAttributes {
  declare id: number;
  declare drugAName: string;
  declare drugBName: string;
  declare drugARxcui: string;
  declare drugBRxcui: string;
  declare severity: Severity;
  declare effect: string;
  declare recommendation: string;
  declare source: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const DrugInteractionSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
    type: DataTypes.ENUM(...Object.values(Severity)),
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
} as const;

DrugInteraction.init(DrugInteractionSchema, {
  sequelize,
  modelName: "DrugInteraction",
  tableName: "drug_interactions",
});

export default DrugInteraction;
