// Централизованная конфигурация Corallum Enterprise
import dotenv from 'dotenv';
import { cleanEnv, port, str } from 'envalid';

dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: 'development' }),
  PORT: port({ default: 8003 }),

  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: port({ default: 5432 }),
  DB_NAME: str({ default: 'corallum_enterprise' }),
  DB_USER: str({ default: 'corallum' }),
  DB_PASSWORD: str({ default: 'corallum123' }),
  DB_MIN_CONNECTIONS: str({ default: '2' }),
  DB_MAX_CONNECTIONS: str({ default: '20' }),

  JWT_SECRET: str({ default: 'corallum-secret-key' }),
  JWT_EXPIRES_IN: str({ default: '24h' }),

  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }),

  OPENAI_API_KEY: str({ default: '' }),
  OLLAMA_URL: str({ default: 'http://localhost:11434' }),
  AI_DEFAULT_MODEL: str({ default: 'gpt-3.5-turbo' }),

  // Jarilo Configuration
  JARILO_URL: str({ default: 'http://localhost:8004' }),

  INNGEST_API_KEY: str({ default: '' }),
  INNGEST_BASE_URL: str({ default: 'https://api.inngest.com' }),
  INNGEST_EVENT_KEY: str({ default: '' }),
  INNGEST_SIGNING_KEY: str({ default: '' }),

  ALLOWED_ORIGINS: str({ default: 'http://localhost:3002' })
});

if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET === 'corallum-secret-key') {
    throw new Error('JWT_SECRET must be set in production');
  }
  if (env.DB_PASSWORD === 'corallum123') {
    throw new Error('DB_PASSWORD must be set in production');
  }
}

export const config = {
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
  
  // Jarilo Configuration
  jarilo: {
    url: env.JARILO_URL
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
