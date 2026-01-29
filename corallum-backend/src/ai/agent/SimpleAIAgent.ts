import { Workflow, Node, ExecutionInsights, IRun, ErrorHelp, FixSuggestion, RequestAnalysis } from '../../types';

// Простая реализация AI Agent без OpenAI
export class SimpleAIAgent {
    constructor() {
        // Без зависимостей от внешних API
    }
    
    // Главная фича: создание workflow по текстовому запросу
    async createWorkflowFromRequest(userRequest: string): Promise<Workflow> {
        console.log(`Creating workflow from request: ${userRequest}`);
        
        // Простая логика анализа запроса
        const analysis = this.analyzeRequest(userRequest);
        
        return {
            id: this.generateId(),
            name: analysis.title,
            description: analysis.description,
            nodes: this.generateNodes(analysis),
            edges: this.generateEdges(analysis),
            settings: {
                executionOrder: 'v2',
                timeout: 30000,
                retryPolicy: 'exponential',
                maxRetries: 3
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    
    // Оптимизация workflow
    async optimizeWorkflow(workflow: Workflow, analysis: any): Promise<Workflow> {
        console.log(`Optimizing workflow: ${workflow.id}`);
        
        // Простая оптимизация - убираем дубликаты узлов
        const optimizedNodes = workflow.nodes.filter((node, index, self) =>
            index === self.findIndex((n) => n.type === node.type)
        );
        
        return {
            ...workflow,
            nodes: optimizedNodes
        };
    }
    
    // Real-time помощь с ошибками
    async helpWithError(node: Node, error: any): Promise<ErrorHelp> {
        return {
            cause: `Node ${node.displayName || node.type} failed: ${error.message || String(error)}`,
            solution: 'Check node configuration and parameters',
            alternative: 'Try using a different node type',
            codeExample: `// Example fix for ${node.type}\n// Check parameters and retry`
        };
    }
    
    // Анализ workflow
    async analyzeWorkflow(workflow: Workflow): Promise<any> {
        const nodeCount = workflow.nodes.length;
        const edgeCount = workflow.edges.length;
        
        return {
            needsOptimization: nodeCount > 10, // Оптимизация если много узлов
            issues: nodeCount === 0 ? ['No nodes found'] : [],
            suggestions: nodeCount > 10 ? ['Consider reducing node count'] : []
        };
    }
    
    // Анализ выполнения
    async analyzeExecution(execution: IRun): Promise<ExecutionInsights> {
        const duration = execution.completedAt 
            ? execution.completedAt.getTime() - execution.startedAt.getTime()
            : 0;
            
        const nodeCount = execution.nodes.length;
        const successNodes = execution.nodes.filter(n => n.status === 'success').length;
        const errorNodes = execution.nodes.filter(n => n.status === 'error').length;
        
        return {
            performance: {
                totalDuration: duration,
                averageNodeDuration: nodeCount > 0 ? duration / nodeCount : 0,
                slowestNode: this.findSlowestNode(execution.nodes),
                fastestNode: this.findFastestNode(execution.nodes),
                memoryUsage: 50, // Mock значение
                cpuUsage: 25 // Mock значение
            },
            bottlenecks: errorNodes > 0 ? ['Failed nodes detected'] : [],
            optimizations: successNodes === nodeCount ? ['All nodes executed successfully'] : ['Fix failed nodes'],
            duration,
            nodeCount
        };
    }
    
    // Рекомендации по исправлению
    async suggestFixes(workflow: Workflow, error: any): Promise<FixSuggestion[]> {
        return [
            {
                nodeId: 'unknown',
                issue: `Execution failed: ${error.message || String(error)}`,
                suggestion: 'Check workflow configuration and retry',
                priority: 'high',
                estimatedTime: 5
            }
        ];
    }
    
    private analyzeRequest(request: string): RequestAnalysis {
        // Простая логика анализа
        const lowerRequest = request.toLowerCase();
        
        let intent = 'General automation';
        let services: string[] = [];
        let triggers: string[] = ['manual'];
        
        if (lowerRequest.includes('email') || lowerRequest.includes('gmail')) {
            services.push('gmail');
            triggers.push('email_received');
        }
        
        if (lowerRequest.includes('slack')) {
            services.push('slack');
        }
        
        if (lowerRequest.includes('trello')) {
            services.push('trello');
        }
        
        if (lowerRequest.includes('http') || lowerRequest.includes('api')) {
            services.push('http');
        }
        
        return {
            intent,
            services,
            logic: 'Process data and send notifications',
            triggers,
            title: `Workflow: ${request.substring(0, 50)}...`,
            description: `Generated workflow for: ${request}`,
            complexity: services.length > 2 ? 'complex' : services.length > 1 ? 'medium' : 'simple'
        };
    }
    
    private generateNodes(analysis: RequestAnalysis): Node[] {
        const nodes: Node[] = [];
        
        // Триггер
        nodes.push({
            id: 'trigger_1',
            type: 'trigger',
            displayName: 'Manual Trigger',
            description: 'Starts the workflow',
            icon: 'play',
            category: 'triggers',
            data: {},
            position: { x: 100, y: 100 }
        });
        
        // Узлы для сервисов
        analysis.services.forEach((service, index) => {
            nodes.push({
                id: `node_${index + 1}`,
                type: service,
                displayName: service.charAt(0).toUpperCase() + service.slice(1),
                description: `Integration with ${service}`,
                icon: 'integration',
                category: 'integration',
                data: {},
                position: { x: 300 + (index * 200), y: 100 }
            });
        });
        
        return nodes;
    }
    
    private generateEdges(analysis: RequestAnalysis): any[] {
        const edges: any[] = [];
        const nodes = this.generateNodes(analysis);
        
        // Связываем триггер с первым узлом
        if (nodes.length > 1) {
            edges.push({
                id: 'edge_1',
                source: nodes[0].id,
                target: nodes[1].id,
                type: 'success'
            });
        }
        
        // Связываем узлы между собой
        for (let i = 1; i < nodes.length - 1; i++) {
            edges.push({
                id: `edge_${i + 1}`,
                source: nodes[i].id,
                target: nodes[i + 1].id,
                type: 'success'
            });
        }
        
        return edges;
    }
    
    private findSlowestNode(nodes: any[]): string {
        // Mock логика
        return nodes.length > 0 ? nodes[0].nodeId : 'none';
    }
    
    private findFastestNode(nodes: any[]): string {
        // Mock логика
        return nodes.length > 0 ? nodes[0].nodeId : 'none';
    }
    
    private generateId(): string {
        return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
