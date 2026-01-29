import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { CorallumWorkflowEngine } from '../core/workflow/CorallumWorkflowEngine';
import { CorallumAIAgent } from '../ai/agent/CorallumAIAgent';
import { NodeRegistry } from '../core/nodes/NodeRegistry';
import { Workflow, IRun } from '../types';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Middleware
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["*"],
    allowedHeaders: ["*"]
}));

app.use(express.json());

// Инициализация
const workflowEngine = new CorallumWorkflowEngine(
    new CorallumAIAgent(),
    new NodeRegistry()
);

// WebSocket для real-time обновлений
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            // Подписка на события workflow
            if (data.type === 'subscribe' && data.workflowId) {
                const eventName = `workflow.${data.workflowId}.*`;
                console.log(`Client subscribed to ${eventName}`);
                
                // В реальной реализации здесь будет подписка на события
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    workflowId: data.workflowId,
                    message: `Subscribed to ${eventName}`
                }));
            }
        } catch (error) {
            console.error('WebSocket error:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// API Routes
app.post('/api/v1/workflows/create-from-text', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text parameter is required'
            });
        }
        
        const workflow = await workflowEngine.aiAgent.createWorkflowFromRequest(text);
        
        res.json({
            success: true,
            workflow,
            message: 'Workflow created successfully'
        });
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/v1/workflows/:workflowId/execute', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const triggerData = req.body;
        
        // В реальной реализации здесь будет загрузка workflow из БД
        const workflow: Workflow = {
            id: workflowId,
            name: 'Test Workflow',
            description: 'Test workflow for execution',
            nodes: [],
            edges: [],
            settings: {},
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const execution = await workflowEngine.executeWorkflow(workflow, triggerData);
        
        res.json({
            success: true,
            execution
        });
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/v1/workflows/:workflowId/optimize', async (req, res) => {
    try {
        const { workflowId } = req.params;
        
        // В реальной реализации здесь будет загрузка workflow из БД
        const workflow: Workflow = {
            id: workflowId,
            name: 'Test Workflow',
            description: 'Test workflow for optimization',
            nodes: [],
            edges: [],
            settings: {},
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const analysis = await workflowEngine.aiAgent.analyzeWorkflow(workflow);
        const optimized = await workflowEngine.aiAgent.optimizeWorkflow(workflow, analysis);
        
        res.json({
            success: true,
            original: workflow,
            optimized,
            improvements: analysis.suggestions || []
        });
    } catch (error) {
        console.error('Error optimizing workflow:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/v1/workflows/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        
        // В реальной реализации здесь будет загрузка workflow из БД
        const workflow: Workflow = {
            id: workflowId,
            name: 'Test Workflow',
            description: 'Test workflow',
            nodes: [],
            edges: [],
            settings: {},
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        res.json({
            success: true,
            workflow
        });
    } catch (error) {
        console.error('Error getting workflow:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/v1/executions/:executionId', async (req, res) => {
    try {
        const { executionId } = req.params;
        const execution = workflowEngine.getExecution(executionId);
        
        if (!execution) {
            return res.status(404).json({
                success: false,
                error: 'Execution not found'
            });
        }
        
        res.json({
            success: true,
            execution
        });
    } catch (error) {
        console.error('Error getting execution:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Запуск сервера
const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Corallum Backend Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);
});

// Интеграция WebSocket с HTTP сервером
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head);
});

export default app;
