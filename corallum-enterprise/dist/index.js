"use strict";
// Единая точка входа - Corallum Enterprise
// Production-ready Multi-tenant AI Platform
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const Application_1 = require("./core/Application");
const config_1 = require("./config");
// Создаем и запускаем приложение
async function bootstrap() {
    try {
        const app = new Application_1.Application(config_1.config);
        await app.start();
        console.log('🚀 Corallum Enterprise started successfully');
        console.log(`📍 Server: http://localhost:${config_1.config.port}`);
        console.log(`🏥 Health: http://localhost:${config_1.config.port}/health`);
    }
    catch (error) {
        console.error('❌ Failed to start Corallum Enterprise:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
});
// Запускаем приложение
bootstrap();
//# sourceMappingURL=index.js.map