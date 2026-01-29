"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = exports.SimpleAIAgent = exports.SimpleWorkflowEngine = void 0;
const UniversalDataManager_1 = require("../core/database/UniversalDataManager");
// Простая реализация без внешних библиотек
class SimpleWorkflowEngine {
    constructor() {
        this.executions = new Map();
    }
    async executeWorkflow(workflow, triggerData = {}) {
        const executionId = this.generateExecutionId();
        const execution = {
            id: executionId,
            workflowId: workflow.id,
            status: 'running',
            startedAt: new Date(),
            result: undefined,
            error: undefined,
            nodes: []
        };
        this.executions.set(executionId, execution);
        try {
            // Простая симуляция выполнения
            for (const node of workflow.nodes) {
                console.log(`Executing node: ${node.id}`);
                // Симуляция работы узла
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            execution.status = 'success';
            execution.completedAt = new Date();
            execution.result = { message: 'Workflow completed successfully' };
        }
        catch (error) {
            execution.status = 'error';
            execution.error = error.message || String(error);
        }
        return execution;
    }
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getExecution(executionId) {
        return this.executions.get(executionId);
    }
}
exports.SimpleWorkflowEngine = SimpleWorkflowEngine;
// Импортируем обновленный CorallumAIAgent с OpenAI
const CorallumAIAgent_1 = require("../ai/agent/CorallumAIAgent");
// Используем CorallumAIAgent с OpenAI
const aiAgent = new CorallumAIAgent_1.CorallumAIAgent();
class SimpleAIAgent {
    async createWorkflowFromRequest(userRequest) {
        console.log(`🤖 Creating workflow from request with OpenAI: ${userRequest}`);
        try {
            // Используем OpenAI для создания workflow
            const workflow = await aiAgent.createWorkflowFromRequest(userRequest);
            console.log(`✅ OpenAI generated workflow: ${workflow.name}`);
            return workflow;
        }
        catch (error) {
            console.error(`❌ OpenAI error: ${error.message}`);
            // Fallback к простому workflow
            const workflow = {
                id: this.generateId(),
                name: `Fallback Workflow: ${userRequest.substring(0, 50)}...`,
                description: `Generated workflow for: ${userRequest}`,
                nodes: [
                    {
                        id: 'trigger_1',
                        type: 'trigger',
                        displayName: 'Trigger',
                        description: 'Workflow trigger',
                        icon: 'play',
                        category: 'triggers',
                        data: { trigger: true },
                        position: { x: 100, y: 100 }
                    },
                    {
                        id: 'action_1',
                        type: 'action',
                        displayName: 'Action',
                        description: 'Process action',
                        icon: 'gear',
                        category: 'actions',
                        data: { action: 'process' },
                        position: { x: 300, y: 100 }
                    }
                ],
                edges: [
                    {
                        id: 'edge_1',
                        source: 'trigger_1',
                        target: 'action_1'
                    }
                ],
                settings: {
                    executionOrder: 'v2',
                    timeout: 30000,
                    retryPolicy: 'exponential',
                    maxRetries: 3
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return workflow;
        }
    }
    async analyzeWorkflow(workflow) {
        return {
            needsOptimization: false,
            issues: [],
            suggestions: []
        };
    }
    async optimizeWorkflow(workflow, analysis) {
        return workflow; // Возвращаем оригинал
    }
    generateId() {
        return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.SimpleAIAgent = SimpleAIAgent;
// API Routes без Express
const routes = {
    'POST /api/v1/workflows/create-from-text': async (req) => {
        const { text } = req.body;
        if (!text) {
            return {
                success: false,
                error: 'Text parameter is required'
            };
        }
        const simpleAIAgent = new SimpleAIAgent();
        const workflow = await simpleAIAgent.createWorkflowFromRequest(text);
        return {
            success: true,
            workflow,
            message: 'Workflow created successfully'
        };
    },
    'POST /api/v1/workflows/:workflowId/execute': async (req) => {
        const { workflowId } = req.params;
        const triggerData = req.body;
        const workflow = {
            id: workflowId,
            name: 'Test Workflow',
            description: 'Test workflow for execution',
            nodes: [
                {
                    id: 'node1',
                    type: 'trigger',
                    displayName: 'Test Trigger',
                    description: 'Test trigger node',
                    icon: 'play',
                    category: 'triggers',
                    data: {},
                    position: { x: 100, y: 100 }
                },
                {
                    id: 'node2',
                    type: 'action',
                    displayName: 'Test Action',
                    description: 'Test action node',
                    icon: 'gear',
                    category: 'actions',
                    data: {},
                    position: { x: 300, y: 100 }
                }
            ],
            edges: [
                { id: 'edge1', source: 'node1', target: 'node2' }
            ],
            settings: {
                executionOrder: 'v2',
                timeout: 30000,
                retryPolicy: 'exponential',
                maxRetries: 3
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const engine = new SimpleWorkflowEngine();
        const execution = await engine.executeWorkflow(workflow, triggerData);
        return {
            success: true,
            execution
        };
    },
    'GET /api/v1/workflows/:workflowId': async (req) => {
        const { workflowId } = req.params;
        const workflow = {
            id: workflowId,
            name: 'Test Workflow',
            description: 'Test workflow',
            nodes: [],
            edges: [],
            settings: {
                executionOrder: 'v2',
                timeout: 30000,
                retryPolicy: 'exponential',
                maxRetries: 3
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return {
            success: true,
            workflow
        };
    },
    'GET /api/v1/executions/:executionId': async (req) => {
        const { executionId } = req.params;
        const engine = new SimpleWorkflowEngine();
        const execution = engine.getExecution(executionId);
        if (!execution) {
            return {
                success: false,
                error: 'Execution not found'
            };
        }
        return {
            success: true,
            execution
        };
    },
    'GET /api/v1/nodes': async () => {
        // Импортируем NodeRegistry для получения типов узлов
        const { NodeRegistry } = require('../core/nodes/NodeRegistry');
        const nodeRegistry = new NodeRegistry();
        return {
            success: true,
            nodes: nodeRegistry.getNodeTypes(),
            categories: ['triggers', 'operators', 'integrations', 'resources', 'aiagents'],
            total_nodes: nodeRegistry.getNodeTypes().length,
            rf_specific: true,
            enhanced_features: ['nlp_entities', 'ru_data_transform', 'multi_payment']
        };
    },
    'POST /api/v1/test/nodes': async () => {
        // Тестирование улучшенных узлов
        const { testEnhancedNodes } = require('./node-test');
        try {
            await testEnhancedNodes();
            return {
                success: true,
                message: 'All enhanced nodes tested successfully!',
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },
    'POST /api/v1/nodes/:nodeType/execute': async (req) => {
        const { nodeType } = req.params;
        const { parameters } = req.body;
        const { NodeRegistry } = require('../core/nodes/NodeRegistry');
        const nodeRegistry = new NodeRegistry();
        const node = nodeRegistry.getNode(nodeType);
        if (!node) {
            return {
                success: false,
                error: `Node type ${nodeType} not found`
            };
        }
        try {
            const result = await node.execute({ parameters });
            return {
                success: true,
                nodeType,
                result,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                nodeType,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },
    'GET /api/v1/workflows': async () => {
        try {
            const workflows = await UniversalDataManager_1.universalDataManager.listWorkflows();
            return {
                success: true,
                data: workflows,
                count: workflows.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    'POST /api/v1/workflows': async (req) => {
        try {
            const workflow = req.body;
            const savedWorkflow = await UniversalDataManager_1.universalDataManager.saveWorkflow(workflow);
            return {
                success: true,
                data: savedWorkflow
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    'GET /api/v1/workflows/:id': async (req) => {
        try {
            const { id } = req.params;
            const workflow = await UniversalDataManager_1.universalDataManager.getWorkflow(id);
            if (!workflow) {
                return {
                    success: false,
                    error: 'Workflow not found'
                };
            }
            return {
                success: true,
                data: workflow
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    'GET /api/v1/executions': async () => {
        try {
            // Для простоты возвращаем пустой список
            return {
                success: true,
                data: []
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    'GET /health': async () => {
        try {
            const dataHealth = await UniversalDataManager_1.universalDataManager.healthCheck();
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                service: 'corallum-backend',
                data: dataHealth
            };
        }
        catch (error) {
            return {
                status: 'degraded',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                service: 'corallum-backend',
                error: error.message
            };
        }
    }
};
exports.routes = routes;
//# sourceMappingURL=simple-main.js.map