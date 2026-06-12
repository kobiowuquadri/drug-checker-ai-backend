import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database/db.js";

export interface InteractionHistoryAttributes {
  id: number;
  userId: number;
  selectedDrugs: any[];
  results: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InteractionHistoryCreationAttributes extends Optional<InteractionHistoryAttributes, "id" | "createdAt" | "updatedAt"> {}

export class InteractionHistory extends Model<InteractionHistoryAttributes, InteractionHistoryCreationAttributes> implements InteractionHistoryAttributes {
  declare id: number;
  declare userId: number;
  declare selectedDrugs: any[];
  declare results: any[];
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const InteractionHistorySchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  selectedDrugs: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  results: {
    type: DataTypes.JSON,
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

InteractionHistory.init(InteractionHistorySchema, {
  sequelize,
  modelName: "InteractionHistory",
  tableName: "interaction_histories",
});

export default InteractionHistory;
