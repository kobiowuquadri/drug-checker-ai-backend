import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database/db.js";

export interface MedicationAttributes {
  id: number;
  rxcui: string;
  genericName: string;
  aliases: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationCreationAttributes
  extends Optional<MedicationAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Medication
  extends Model<MedicationAttributes, MedicationCreationAttributes>
  implements MedicationAttributes
{
  declare id: number;
  declare rxcui: string;
  declare genericName: string;
  declare aliases: string[];
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const MedicationSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rxcui: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  genericName: {
    type: DataTypes.STRING(512),
    allowNull: false,
  },
  aliases: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
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

Medication.init(MedicationSchema, {
  sequelize,
  modelName: "Medication",
  tableName: "medications",
});

export default Medication;
