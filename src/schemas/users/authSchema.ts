import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database/db.js";

// This is the attributes for the Auth model
export interface UserAttributes {
    id: number;
    name: string;
    email: string;
    password: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

// This is the creation attributes for the Auth model
export interface UserCreationAttributes extends Optional<UserAttributes, "id" | "refreshToken" | "refreshTokenExpiresAt" | "createdAt" | "updatedAt"> {}

// This is the model for the User model
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare id: number;
    declare name: string;
    declare email: string;
    declare password: string;
    declare refreshToken: string;
    declare refreshTokenExpiresAt: Date;
    declare createdAt: Date;
    declare updatedAt: Date;
}

// This is the schema for the Auth model
export const UserSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    refreshToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
    },
    refreshTokenExpiresAt: {
        type: DataTypes.DATE,
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

// Initialize and export the Sequelize model instance
User.init(UserSchema, {
    sequelize,
    modelName: "User",
    tableName: "users",
});

export { User as Auth };
export { User as default };
