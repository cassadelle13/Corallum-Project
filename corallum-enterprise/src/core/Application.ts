// Корневой класс приложения - единая точка входа
// Решает проблему дублирования и разбросанности

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import axios from 'axios';

import DatabaseManager from './database/DatabaseManager';
import { EnterpriseManager } from '../enterprise/EnterpriseManager';
import { LangChainAIManager } from '../ai/LangChainAIManager';
import { InngestManager } from '../reliability/InngestManager';
import { logger } from './logging/logger';
import { container } from './di/tsyringeContainer';

import createEnterpriseRouter from '../api/enterprise';
import createAIRouter from '../api/ai';
import createReliabilityRouter from '../api/reliability';

export interface ApplicationConfig {
  port: number;
  database: any;
  jwt: { secret: string };
  redis?: any;
  ai?: any;
  inngest?: any;
}

export class Application {
  private app: express.Application;
  private config: ApplicationConfig;
  private database: DatabaseManager;
  private enterprise: EnterpriseManager;
  private ai: LangChainAIManager;
  private reliability: InngestManager;

  constructor(config: ApplicationConfig) {
    this.config = config;
    this.app = express();
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private initializeServices(): void {
    // Инициализация в правильном порядке - базовые сервисы первыми
    this.database = new DatabaseManager(this.config.database);
    this.enterprise = new EnterpriseManager(this.database, this.config.jwt.secret);
    this.ai = new LangChainAIManager(this.config.ai, {
  enabled: false,
  knowledgeBasePath: '',
  chunkSize: 1000,
  chunkOverlap: 200,
  maxDocuments: 100
});
    this.reliability = new InngestManager(this.config.inngest, this.database);

    container.registerInstance(DatabaseManager, this.database);
    container.registerInstance(EnterpriseManager, this.enterprise);
    container.registerInstance(LangChainAIManager, this.ai);
    container.registerInstance(InngestManager, this.reliability);
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());

    // Structured request logging + request id
    this.app.use(
      pinoHttp({
        logger,
        genReqId: (req, res) => {
          const header = req.headers['x-request-id'];
          const reqId = typeof header === 'string' && header.trim() ? header : randomUUID();
          res.setHeader('x-request-id', reqId);
          return reqId;
        }
      })
    );
    
    // CORS
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3002'];
    this.app.use(cors({
      origin: allowedOrigins,
      credentials: true
    }));

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 минут
      max: 100 // лимит запросов
    }));

    // Body parsing
    this.app.use((req, res, next) => {
      console.log('Incoming request:', req.method, req.url, 'headers:', req.headers);
      next();
    });
    this.app.use(compression());
    this.app.use(express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        console.log('Raw body:', buf.toString());
        try {
          JSON.parse(buf.toString());
        } catch (e) {
          console.error('Invalid JSON:', buf.toString(), e);
        }
      }
    }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
          database: 'connected',
          enterprise: 'active',
          ai: 'active',
          reliability: 'active'
        }
      });
    });

    // API routes
    this.app.use('/api/v2/enterprise', createEnterpriseRouter(this.enterprise));
    this.app.use('/api/v2/ai', createAIRouter(this.ai, this.enterprise));
    this.app.use('/api/v2/reliability', createReliabilityRouter(this.reliability, this.enterprise));

    // Jarilo API Proxy
    this.app.post('/api/v1/tasks', async (req, res) => {
      try {
        const jariloUrl = 'http://localhost:8004/api/v1/tasks';
        console.log('🔗 Proxying request to Jarilo:', jariloUrl);
        
        const response = await axios({
          method: req.method,
          url: jariloUrl,
          data: req.body,
          headers: {
            'Content-Type': 'application/json',
            ...req.headers
          },
          timeout: 30000
        });
        
        console.log('✅ Jarilo response:', response.status);
        res.json(response.data);
      } catch (error: any) {
        console.error('❌ Jarilo proxy error:', error.message);
        res.status(500).json({ 
          error: 'Jarilo AI сервис недоступен. Убедитесь что Jarilo запущен на порту 8004',
          details: error.message 
        });
      }
    });
  }

  public async start(): Promise<void> {
    try {
      // Запуск сервисов
      await this.database.connect();
      await this.enterprise.initialize();
      // await this.ai.initialize(); // Временно отключено
      // await this.reliability.initialize(); // Временно отключено

      // Запуск сервера
      this.app.listen(this.config.port, () => {
        logger.info({ port: this.config.port }, 'Corallum Enterprise started');
      });
    } catch (error) {
      logger.error({ error }, 'Failed to start application');
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    await this.database.close();
    // await this.reliability.close(); // Временно отключено
  }
}
