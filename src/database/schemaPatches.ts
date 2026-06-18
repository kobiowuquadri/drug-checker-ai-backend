import { DataTypes } from "sequelize";
import sequelize from "./db.js";
import { ReportStatus } from "../constants/reportStatus.js";

export const ensureReportColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable("reports");

  if (!table.status) {
    await queryInterface.addColumn("reports", "status", {
      type: DataTypes.ENUM(...Object.values(ReportStatus)),
      allowNull: false,
      defaultValue: ReportStatus.GENERATED,
    });
  }

  if (!table.notes) {
    await queryInterface.addColumn("reports", "notes", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  }

  if (!table.pdfUrl) {
    await queryInterface.addColumn("reports", "pdfUrl", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    });
  }
};
