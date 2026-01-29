"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// Централизованная конфигурация Corallum Enterprise
const dotenv_1 = __importDefault(require("dotenv"));
const envalid_1 = require("envalid");
dotenv_1.default.config();
const env = (0, envalid_1.cleanEnv)(process.env, {
    NODE_ENV: (0, envalid_1.str)({ default: 'development' }),
    PORT: (0, envalid_1.port)({ default: 8003 }),
    DB_HOST: (0, envalid_1.str)({ default: 'localhost' }),
    DB_PORT: (0, envalid_1.port)({ default: 5432 }),
    DB_NAME: (0, envalid_1.str)({ default: 'corallum_enterprise' }),
    DB_USER: (0, envalid_1.str)({ default: 'corallum' }),
    DB_PASSWORD: (0, envalid_1.str)({ default: 'corallum123' }),
    DB_MIN_CONNECTIONS: (0, envalid_1.str)({ default: '2' }),
    DB_MAX_CONNECTIONS: (0, envalid_1.str)({ default: '20' }),
    JWT_SECRET: (0, envalid_1.str)({ default: 'corallum-secret-key' }),
    JWT_EXPIRES_IN: (0, envalid_1.str)({ default: '24h' }),
    REDIS_HOST: (0, envalid_1.str)({ default: 'localhost' }),
    REDIS_PORT: (0, envalid_1.port)({ default: 6379 }),
    REDIS_PASSWORD: (0, envalid_1.str)({ default: '' }),
    OPENAI_API_KEY: (0, envalid_1.str)({ default: '' }),
    OLLAMA_URL: (0, envalid_1.str)({ default: 'http://localhost:11434' }),
    AI_DEFAULT_MODEL: (0, envalid_1.str)({ default: 'gpt-3.5-turbo' }),
    INNGEST_API_KEY: (0, envalid_1.str)({ default: '' }),
    INNGEST_BASE_URL: (0, envalid_1.str)({ default: 'https://api.inngest.com' }),
    INNGEST_EVENT_KEY: (0, envalid_1.str)({ default: '' }),
    INNGEST_SIGNING_KEY: (0, envalid_1.str)({ default: '' }),
    ALLOWED_ORIGINS: (0, envalid_1.str)({ default: 'http://localhost:3002' })
});
if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET === 'corallum-secret-key') {
        throw new Error('JWT_SECRET must be set in production');
    }
    if (env.DB_PASSWORD === 'corallum123') {
        throw new Error('DB_PASSWORD must be set in production');
    }
}
exports.config = {
    // Server
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    // Database
    database: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        min: parseInt(env.DB_MIN_CONNECTIONS),
        max: parseInt(env.DB_MAX_CONNECTIONS)
    },
    // JWT
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN
    },
    // Redis
    redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined
    },
    // AI Configuration
    ai: {
        openaiApiKey: env.OPENAI_API_KEY || undefined,
        ollamaUrl: env.OLLAMA_URL,
        defaultModel: env.AI_DEFAULT_MODEL
    },
    // Inngest
    inngest: {
        apiKey: env.INNGEST_API_KEY || undefined,
        baseUrl: env.INNGEST_BASE_URL,
        eventKey: env.INNGEST_EVENT_KEY || undefined,
        signingKey: env.INNGEST_SIGNING_KEY || undefined
    },
    // CORS
    cors: {
        origins: env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
        credentials: true
    },
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 минут
        max: 100 // лимит запросов
    }
};
//# sourceMappingURL=config.js.map