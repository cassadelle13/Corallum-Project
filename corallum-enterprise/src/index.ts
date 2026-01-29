// Единая точка входа - Corallum Enterprise
// Production-ready Multi-tenant AI Platform

import 'reflect-metadata';

import { Application } from './core/Application';
import { config } from './config';

// Создаем и запускаем приложение
async function bootstrap() {
  try {
    const app = new Application(config);
    await app.start();
    
    console.log('🚀 Corallum Enterprise started successfully');
    console.log(`📍 Server: http://localhost:${config.port}`);
    console.log(`🏥 Health: http://localhost:${config.port}/health`);
    
  } catch (error) {
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
