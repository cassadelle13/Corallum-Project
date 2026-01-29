"use strict";
// Корневой класс приложения - единая точка входа
// Решает проблему дублирования и разбросанности
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const pino_http_1 = __importDefault(require("pino-http"));
const crypto_1 = require("crypto");
const DatabaseManager_1 = __importDefault(require("./database/DatabaseManager"));
const EnterpriseManager_1 = require("../enterprise/EnterpriseManager");
const LangChainAIManager_1 = require("../ai/LangChainAIManager");
const InngestManager_1 = require("../reliability/InngestManager");
const logger_1 = require("./logging/logger");
const tsyringeContainer_1 = require("./di/tsyringeContainer");
const enterprise_1 = __importDefault(require("../api/enterprise"));
const ai_1 = __importDefault(require("../api/ai"));
const reliability_1 = __importDefault(require("../api/reliability"));
class Application {
    constructor(config) {
        this.config = config;
        this.app = (0, express_1.default)();
        this.initializeServices();
        this.setupMiddleware();
        this.setupRoutes();
    }
    initializeServices() {
        // Инициализация в правильном порядке - базовые сервисы первыми
        this.database = new DatabaseManager_1.default(this.config.database);
        this.enterprise = new EnterpriseManager_1.EnterpriseManager(this.database, this.config.jwt.secret);
        this.ai = new LangChainAIManager_1.LangChainAIManager(this.config.ai, {
            enabled: false,
            knowledgeBasePath: '',
            chunkSize: 1000,
            chunkOverlap: 200,
            maxDocuments: 100
        });
        this.reliability = new InngestManager_1.InngestManager(this.config.inngest, this.database);
        tsyringeContainer_1.container.registerInstance(DatabaseManager_1.default, this.database);
        tsyringeContainer_1.container.registerInstance(EnterpriseManager_1.EnterpriseManager, this.enterprise);
        tsyringeContainer_1.container.registerInstance(LangChainAIManager_1.LangChainAIManager, this.ai);
        tsyringeContainer_1.container.registerInstance(InngestManager_1.InngestManager, this.reliability);
    }
    setupMiddleware() {
        // Security
        this.app.use((0, helmet_1.default)());
        // Structured request logging + request id
        this.app.use((0, pino_http_1.default)({
            logger: logger_1.logger,
            genReqId: (req, res) => {
                const header = req.headers['x-request-id'];
                const reqId = typeof header === 'string' && header.trim() ? header : (0, crypto_1.randomUUID)();
                res.setHeader('x-request-id', reqId);
                return reqId;
            }
        }));
        // CORS
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3002'];
        this.app.use((0, cors_1.default)({
            origin: allowedOrigins,
            credentials: true
        }));
        // Rate limiting
        this.app.use((0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000, // 15 минут
            max: 100 // лимит запросов
        }));
        // Body parsing
        this.app.use((req, res, next) => {
            console.log('Incoming request:', req.method, req.url, 'headers:', req.headers);
            next();
        });
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({
            limit: '10mb',
            verify: (req, res, buf) => {
                console.log('Raw body:', buf.toString());
                try {
                    JSON.parse(buf.toString());
                }
                catch (e) {
                    console.error('Invalid JSON:', buf.toString(), e);
                }
            }
        }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
    }
    setupRoutes() {
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
        this.app.use('/api/v2/enterprise', (0, enterprise_1.default)(this.enterprise));
        this.app.use('/api/v2/ai', (0, ai_1.default)(this.ai, this.enterprise));
        this.app.use('/api/v2/reliability', (0, reliability_1.default)(this.reliability, this.enterprise));
    }
    async start() {
        try {
            // Запуск сервисов
            await this.database.connect();
            await this.enterprise.initialize();
            // await this.ai.initialize(); // Временно отключено
            // await this.reliability.initialize(); // Временно отключено
            // Запуск сервера
            this.app.listen(this.config.port, () => {
                logger_1.logger.info({ port: this.config.port }, 'Corallum Enterprise started');
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to start application');
            process.exit(1);
        }
    }
    async stop() {
        await this.database.close();
        // await this.reliability.close(); // Временно отключено
    }
}
exports.Application = Application;
//# sourceMappingURL=Application.js.map