// Упрощенный точка входа без внешних зависимостей
import { routes } from './api/simple-main';

// Простая HTTP сервер реализация
class SimpleHTTPServer {
    private routes: any;
    
    constructor() {
        this.routes = routes;
    }
    
    async handleRequest(req: any, res: any): Promise<void> {
        const url = new URL(req.url, `http://localhost:${8000}`);
        const path = url.pathname;
        const method = req.method;
        
        // Установка CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Обработка OPTIONS запросов
        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Поиск маршрута
        const routeKey = `${method} ${path}`;
        const routeHandler = this.routes[routeKey];
        
        if (routeHandler) {
            try {
                // Чтение тела запроса
                let body = '';
                req.on('data', (chunk: any) => {
                    body += chunk;
                });
                
                req.on('end', async () => {
                    try {
                        const parsedBody = body ? JSON.parse(body) : {};
                        const result = await routeHandler(parsedBody);
                        
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
            // Маршрут не найден
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Route not found'
            }));
        }
    }
    
    start(port: number): void {
        const http = require('http');
        
        const server = http.createServer((req: any, res: any) => {
            this.handleRequest(req, res);
        });
        
        server.listen(port, () => {
            // Используем process.stdout вместо console.log
            process.stdout.write(`🚀 Corallum Backend Server running on port ${port}\n`);
            process.stdout.write(`📖 API Documentation: http://localhost:${port}/api/v1/workflows/create-from-text\n`);
            process.stdout.write(`🏥 Health Check: http://localhost:${port}/health\n`);
        });
    }
}

// Запуск сервера
const PORT = 8000;
const server = new SimpleHTTPServer();

server.start(PORT);

// Graceful shutdown
process.on('SIGTERM', () => {
    process.stdout.write('👋 SIGTERM received, shutting down gracefully\n');
    process.exit(0);
});

process.on('SIGINT', () => {
    process.stdout.write('👋 SIGINT received, shutting down gracefully\n');
    process.exit(0);
});

export default SimpleHTTPServer;
