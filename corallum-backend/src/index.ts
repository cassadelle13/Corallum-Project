// Corallum Backend с универсальным менеджером данных
import { routes } from './api/simple-main';
import { universalDataManager } from './core/database/UniversalDataManager';

// HTTP сервер на Node.js
class CorallumServer {
    private routes: any;
    
    constructor() {
        this.routes = routes;
    }

    public getPort(): number {
        const args = process.argv.slice(2);
        const portArg = args.find(arg => arg.startsWith('--port='));
        if (portArg) {
            return parseInt(portArg.split('=')[1]);
        }
        return 8002; // Порт по умолчанию
    }
    
    async handleRequest(req: any, res: any): Promise<void> {
        const url = new URL(req.url, `http://localhost:8000`);
        let path = url.pathname;
        const method = req.method;
        
        // Заменяем динамические сегменты на pattern для роутинга
        // ВАЖНО: Сначала проверяем конкретные пути, потом динамические
        if (path === '/api/v1/workflows/create-from-text') {
            // Оставляем как есть - это конкретный путь
        } else if (path.match(/^\/api\/v1\/workflows\/[^\/]+\/execute$/)) {
            path = '/api/v1/workflows/:workflowId/execute';
        } else if (path.match(/^\/api\/v1\/workflows\/[^\/]+$/)) {
            path = '/api/v1/workflows/:workflowId';
        } else if (path.match(/^\/api\/v1\/executions\/[^\/]+$/)) {
            path = '/api/v1/executions/:executionId';
        }
        
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Debug logging
        process.stdout.write(`🔍 Request: ${method} ${path}\n`);
        
        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        const routeKey = `${method} ${path}`;
        const routeHandler = this.routes[routeKey];
        
        process.stdout.write(`🎯 Route key: ${routeKey}\n`);
        process.stdout.write(`📦 Available routes: ${Object.keys(this.routes).join(', ')}\n`);
        
        if (routeHandler) {
            try {
                let body = '';
                req.on('data', (chunk: any) => {
                    body += chunk;
                });
                
                req.on('end', async () => {
                    try {
                        const parsedBody = body ? JSON.parse(body) : {};
                        // Добавляем params для поддержки URL параметров
                        const reqObject = {
                            body: parsedBody,
                            params: this.parseParams(path, url.pathname)
                        };
                        const result = await routeHandler(reqObject);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } catch (error: any) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: error.message || String(error)
                        }));
                    }
                });
            } catch (error: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message || String(error)
                }));
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Route not found'
            }));
        }
    }
    
    private parseParams(routePath: string, fullPath: string): any {
        // Простая реализация парсинга path параметров
        const params: any = {};
        
        // Для /workflows/:workflowId
        if (routePath.includes(':workflowId')) {
            const urlParts = fullPath.split('/');
            const routeParts = routePath.split('/');
            const workflowIdIndex = routeParts.findIndex(part => part === ':workflowId');
            if (workflowIdIndex !== -1 && urlParts[workflowIdIndex]) {
                params.workflowId = urlParts[workflowIdIndex];
            }
        }
        
        // Для /executions/:executionId
        if (routePath.includes(':executionId')) {
            const urlParts = fullPath.split('/');
            const routeParts = routePath.split('/');
            const executionIdIndex = routeParts.findIndex(part => part === ':executionId');
            if (executionIdIndex !== -1 && urlParts[executionIdIndex]) {
                params.executionId = urlParts[executionIdIndex];
            }
        }
        
        return params;
    }
    
    async start(port: number = 8002): Promise<void> {
        try {
            // Инициализация универсального менеджера данных с fallback
            process.stdout.write('🔄 Initializing Universal Data Manager...\n');
            await universalDataManager.initialize();
            
            // Проверяем здоровье системы
            const health = await universalDataManager.healthCheck();
            process.stdout.write(`📊 Data Storage: ${health.details.type || 'memory'} (${health.status})\n`);
            
            const http = require('http');
            
            const server = http.createServer((req: any, res: any) => {
                this.handleRequest(req, res);
            });
            
            server.listen(port, () => {
                process.stdout.write(`🚀 Corallum Backend Server running on port ${port}\n`);
                process.stdout.write(`📖 API: http://localhost:${port}/api/v1/workflows/create-from-text\n`);
                process.stdout.write(`🏥 Health: http://localhost:${port}/health\n`);
                process.stdout.write(`💾 Storage: ${health.details.type}\n`);
                process.stdout.write(`🤖 AI Integration: Jarilo (http://localhost:8004)\n`);
                process.stdout.write(`✅ System ready with graceful fallback!\n`);
            });
            
            // Graceful shutdown
            process.on('SIGTERM', () => this.shutdown(server));
            process.on('SIGINT', () => this.shutdown(server));
            
        } catch (error: any) {
            process.stderr.write(`❌ Failed to start server: ${error.message}\n`);
            process.exit(1);
        }
    }

    private shutdown(server: any): void {
        process.stdout.write('👋 SIGTERM received, shutting down gracefully\n');
        server.close(() => {
            process.exit(0);
        });
    }
}

// Запуск
const server = new CorallumServer();
const PORT = server.getPort();
server.start(PORT);

export default CorallumServer;
