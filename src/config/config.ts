import dotenv from 'dotenv';

dotenv.config();

export const config = {
    server: {
        port: process.env.PORT || 5000
    },
    database: {
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306
    },
    integrations: {
        rxnavBaseUrl: process.env.RXNAV_BASE_URL || 'https://rxnav.nlm.nih.gov/REST',
        geminiApiKey: process.env.GEMINI_API_KEY,
        geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        googleCloudVisionApiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_CLOUD_VISON_API_KEY
    },
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306
    },
    test: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306
    }
};
