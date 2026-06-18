import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("reports", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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
      type: DataTypes.ENUM("GENERATED", "REVIEWED", "ARCHIVED"),
      allowNull: false,
      defaultValue: "GENERATED",
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
  });

  await queryInterface.addIndex("reports", ["userId"]);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable("reports");
};
