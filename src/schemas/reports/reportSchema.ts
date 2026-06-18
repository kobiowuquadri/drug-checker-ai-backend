import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database/db.js";
import { ReportStatus } from "../../constants/reportStatus.js";

export interface ReportAttributes {
  id: number;
  userId: number;
  title: string;
  selectedDrugs: any[];
  interactionResults: any[];
  severitySummary: Record<string, number>;
  status: ReportStatus;
  notes: string | null;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportCreationAttributes extends Optional<ReportAttributes, "id" | "status" | "notes" | "pdfUrl" | "createdAt" | "updatedAt"> {}

export class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  declare id: number;
  declare userId: number;
  declare title: string;
  declare selectedDrugs: any[];
  declare interactionResults: any[];
  declare severitySummary: Record<string, number>;
  declare status: ReportStatus;
  declare notes: string | null;
  declare pdfUrl: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const ReportSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  selectedDrugs: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  interactionResults: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  severitySummary: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ReportStatus)),
    allowNull: false,
    defaultValue: ReportStatus.GENERATED,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  pdfUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
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

Report.init(ReportSchema, {
  sequelize,
  modelName: "Report",
  tableName: "reports",
});

export default Report;
