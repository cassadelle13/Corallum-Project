"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorallumWorkflowEngine = void 0;
const SimpleEventEmitter_1 = require("../events/SimpleEventEmitter");
const DatabaseManager_1 = require("../database/DatabaseManager");
const uuid_1 = require("uuid");
class CorallumWorkflowEngine extends SimpleEventEmitter_1.SimpleEventEmitter {
    constructor(aiAgent, nodeRegistry) {
        super();
        this.aiAgent = aiAgent;
        this.nodeRegistry = nodeRegistry;
        this.executions = new Map();
    }
    async executeWorkflow(workflow, triggerData = {}, options = {}) {
        const executionId = (0, uuid_1.v4)();
        // 1. AI-анализ workflow перед выполнением
        this.emit('workflowAnalysisStarted', { workflowId: workflow.id, executionId });
        const analysis = await this.aiAgent.analyzeWorkflow(workflow);
        this.emit('workflowAnalysisCompleted', { workflowId: workflow.id, executionId, analysis });
        // 2. Оптимизация если нужно
        if (analysis.needsOptimization) {
            this.emit('workflowOptimizationStarted', { workflowId: workflow.id, executionId });
            const optimizedWorkflow = await this.aiAgent.optimizeWorkflow(workflow, analysis);
            this.emit('workflowOptimizationCompleted', { workflowId: workflow.id, executionId, workflow: optimizedWorkflow });
        }
        // 3. Создание выполнения
        const execution = {
            id: executionId,
            workflowId: workflow.id,
            status: 'running',
            startedAt: new Date(),
            triggerData,
            context: options.context || {},
            nodes: []
        };
        // Сохраняем в БД и кэш
        await DatabaseManager_1.database.saveExecution(execution);
        await DatabaseManager_1.database.cacheExecution(execution);
        this.executions.set(executionId, execution);
        this.emit('executionStarted', { workflowId: workflow.id, executionId, execution });
        // Публикуем событие в реальном времени
        await DatabaseManager_1.database.publishEvent('execution:started', {
            workflowId: workflow.id,
            executionId,
            execution
        });
        try {
            // 4. Выполнение узлов
            const results = await this.processExecution(workflow, execution);
            // 5. Завершение выполнения
            execution.status = 'success';
            execution.completedAt = new Date();
            execution.result = results;
            execution.nodes = results.nodes;
            // Обновляем в БД и кэше
            await DatabaseManager_1.database.saveExecution(execution);
            await DatabaseManager_1.database.cacheExecution(execution);
            this.emit('executionCompleted', { workflowId: workflow.id, executionId, execution, results });
            // Публикуем событие завершения
            await DatabaseManager_1.database.publishEvent('execution:completed', {
                workflowId: workflow.id,
                executionId,
                execution,
                results
            });
        }
        catch (error) {
            execution.status = 'error';
            execution.completedAt = new Date();
            execution.error = error.message || String(error);
            // Обновляем в БД и кэше
            await DatabaseManager_1.database.saveExecution(execution);
            await DatabaseManager_1.database.cacheExecution(execution);
            this.emit('executionFailed', { workflowId: workflow.id, executionId, execution, error });
            // Публикуем событие ошибки
            await DatabaseManager_1.database.publishEvent('execution:failed', {
                workflowId: workflow.id,
                executionId,
                execution,
                error: error.message || String(error)
            });
        }
        return execution;
    }
    async processExecution(workflow, execution) {
        // Базовая логика выполнения из n8n
        const nodeExecutionStack = this.buildExecutionStack(workflow);
        for (const nodeData of nodeExecutionStack) {
            const node = workflow.nodes.find(n => n.id === nodeData.node.id);
            if (!node) {
                throw new Error(`Node ${nodeData.node.id} not found in workflow`);
            }
            try {
                // Выполняем узел
                this.emit('nodeExecutionStarted', {
                    workflowId: workflow.id,
                    executionId: execution.id,
                    nodeId: node.id,
                    nodeType: node.type
                });
                const result = await this.executeNode(node, nodeData.data);
                // Обновляем execution
                execution.nodes.push({
                    nodeId: node.id,
                    status: 'success',
                    startedAt: new Date(),
                    result
                });
                // Real-time обновления
                this.emit('nodeCompleted', {
                    workflowId: workflow.id,
                    executionId: execution.id,
                    nodeId: node.id,
                    result
                });
            }
            catch (error) {
                execution.nodes.push({
                    nodeId: node.id,
                    status: 'error',
                    startedAt: new Date(),
                    error: error.message || String(error)
                });
                // AI-помощь в реальном времени
                this.emit('nodeError', {
                    workflowId: workflow.id,
                    executionId: execution.id,
                    nodeId: node.id,
                    error: error.message || String(error)
                });
                const help = await this.aiAgent.helpWithError(node, error);
                this.emit('nodeErrorHelp', {
                    workflowId: workflow.id,
                    executionId: execution.id,
                    nodeId: node.id,
                    error: error.message || String(error),
                    help
                });
                throw error;
            }
        }
        return execution.nodes.map(n => n.result);
    }
    buildExecutionStack(workflow) {
        // Упрощенная логика построения стека выполнения
        // В реальной реализации здесь будет полная логика из n8n
        const startNodes = workflow.nodes.filter(node => node.type === 'trigger' ||
            !workflow.edges.some(edge => edge.target === node.id));
        return startNodes.map(node => ({
            node,
            data: { main: [{ json: {} }] }
        }));
    }
    async executeNode(node, data) {
        const nodeInstance = this.nodeRegistry.getNode(node.type);
        if (!nodeInstance) {
            throw new Error(`Node type ${node.type} not found in registry`);
        }
        return await nodeInstance.execute({
            node,
            data: data || {},
            workflowId: node.id,
            executionId: this.generateExecutionId()
        });
    }
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getExecution(executionId) {
        return this.executions.get(executionId);
    }
    getAllExecutions() {
        return Array.from(this.executions.values());
    }
    cancelExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (execution && execution.status === 'running') {
            execution.status = 'cancelled';
            execution.completedAt = new Date();
            this.emit('executionCancelled', { workflowId: execution.workflowId, executionId });
            return true;
        }
        return false;
    }
}
exports.CorallumWorkflowEngine = CorallumWorkflowEngine;
//# sourceMappingURL=CorallumWorkflowEngine.js.map