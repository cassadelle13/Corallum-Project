import { SimpleEventEmitter } from '../events/SimpleEventEmitter';
import { Workflow, Node, Edge, IRun, ExecutionOptions, NodeExecution, Event } from '../../types';
import { CorallumAIAgent } from '../../ai/agent/CorallumAIAgent';
import { NodeRegistry } from '../nodes/NodeRegistry';
import { database } from '../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

export class CorallumWorkflowEngine extends SimpleEventEmitter {
    private executions: Map<string, IRun> = new Map();
    
    constructor(
        private aiAgent: CorallumAIAgent,
        private nodeRegistry: NodeRegistry
    ) {
        super();
    }
    
    async executeWorkflow(
        workflow: Workflow,
        triggerData: any = {},
        options: ExecutionOptions = {}
    ): Promise<IRun> {
        const executionId = uuidv4();
        
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
        const execution: IRun = {
            id: executionId,
            workflowId: workflow.id,
            status: 'running',
            startedAt: new Date(),
            triggerData,
            context: options.context || {},
            nodes: []
        };
        
        // Сохраняем в БД и кэш
        await database.saveExecution(execution);
        await database.cacheExecution(execution);
        this.executions.set(executionId, execution);
        
        this.emit('executionStarted', { workflowId: workflow.id, executionId, execution });
        
        // Публикуем событие в реальном времени
        await database.publishEvent('execution:started', {
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
            await database.saveExecution(execution);
            await database.cacheExecution(execution);
            
            this.emit('executionCompleted', { workflowId: workflow.id, executionId, execution, results });
            
            // Публикуем событие завершения
            await database.publishEvent('execution:completed', {
                workflowId: workflow.id,
                executionId,
                execution,
                results
            });
            
        } catch (error: any) {
            execution.status = 'error';
            execution.completedAt = new Date();
            execution.error = error.message || String(error);
            
            // Обновляем в БД и кэше
            await database.saveExecution(execution);
            await database.cacheExecution(execution);
            
            this.emit('executionFailed', { workflowId: workflow.id, executionId, execution, error });
            
            // Публикуем событие ошибки
            await database.publishEvent('execution:failed', {
                workflowId: workflow.id,
                executionId,
                execution,
                error: error.message || String(error)
            });
        }
        
        return execution;
    }
    
    private async processExecution(workflow: Workflow, execution: IRun): Promise<any> {
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
                
            } catch (error: any) {
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
    
    private buildExecutionStack(workflow: Workflow): any[] {
        // Упрощенная логика построения стека выполнения
        // В реальной реализации здесь будет полная логика из n8n
        const startNodes = workflow.nodes.filter(node => 
            node.type === 'trigger' || 
            !workflow.edges.some(edge => edge.target === node.id)
        );
        
        return startNodes.map(node => ({
            node,
            data: { main: [{ json: {} }] }
        }));
    }
    
    private async executeNode(node: Node, data: any): Promise<any> {
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
    
    private generateExecutionId(): string {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getExecution(executionId: string): IRun | undefined {
        return this.executions.get(executionId);
    }
    
    getAllExecutions(): IRun[] {
        return Array.from(this.executions.values());
    }
    
    cancelExecution(executionId: string): boolean {
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
