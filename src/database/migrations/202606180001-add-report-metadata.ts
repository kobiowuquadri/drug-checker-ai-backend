import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.addColumn("reports", "status", {
    type: DataTypes.ENUM("GENERATED", "REVIEWED", "ARCHIVED"),
    allowNull: false,
    defaultValue: "GENERATED",
  });

  await queryInterface.addColumn("reports", "notes", {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  });

  await queryInterface.addColumn("reports", "pdfUrl", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.removeColumn("reports", "pdfUrl");
  await queryInterface.removeColumn("reports", "notes");
  await queryInterface.removeColumn("reports", "status");
};
