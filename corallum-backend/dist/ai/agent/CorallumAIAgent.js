"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorallumAIAgent = void 0;
const openai_1 = require("openai");
// Полнофункциональная версия с OpenAI
class CorallumAIAgent {
    constructor() {
        this.openai = new openai_1.OpenAI({
            apiKey: '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'
        });
    }
    // Главная фича: создание workflow по текстовому запросу
    async createWorkflowFromRequest(userRequest) {
        try {
            const prompt = `
            Проанализируй запрос пользователя и создай JSON workflow.
            
            Запрос: "${userRequest}"
            
            Создай workflow в формате JSON:
            {
                "name": "Название workflow",
                "description": "Описание workflow",
                "nodes": [
                    {
                        "id": "trigger_1",
                        "type": "trigger",
                        "displayName": "Триггер",
                        "description": "Описание триггера",
                        "icon": "play",
                        "category": "triggers",
                        "data": {},
                        "position": {"x": 100, "y": 100}
                    },
                    {
                        "id": "action_1", 
                        "type": "action_type",
                        "displayName": "Название действия",
                        "description": "Описание действия",
                        "icon": "integration",
                        "category": "integration",
                        "data": {},
                        "position": {"x": 300, "y": 100}
                    }
                ],
                "edges": [
                    {
                        "id": "edge_1",
                        "source": "trigger_1",
                        "target": "action_1",
                        "type": "success"
                    }
                ]
            }
            
            Используй типы узлов: trigger, email, slack, http, api, database, webhook.
            Создай реалистичный workflow для решения задачи пользователя.
            `;
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7
            });
            const workflowData = JSON.parse(response.choices[0].message.content || '{}');
            return {
                id: this.generateId(),
                name: workflowData.name || `Workflow: ${userRequest.substring(0, 50)}...`,
                description: workflowData.description || `Generated workflow for: ${userRequest}`,
                nodes: workflowData.nodes || [],
                edges: workflowData.edges || [],
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
        catch (error) {
            // Fallback to simple logic if OpenAI fails
            console.error('OpenAI error, using fallback:', error.message);
            return this.createFallbackWorkflow(userRequest);
        }
    }
    createFallbackWorkflow(userRequest) {
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
    // Оптимизация workflow с OpenAI
    async optimizeWorkflow(workflow, analysis) {
        try {
            const prompt = `
            Проанализируй и оптимизируй этот workflow:
            
            ${JSON.stringify(workflow, null, 2)}
            
            Проблемы: ${JSON.stringify(analysis.issues || [], null, 2)}
            
            Предложи оптимизации:
            1. Удали ненужные узлы
            2. Объедини похожие действия
            3. Улучши последовательность
            4. Добавь обработку ошибок
            
            Верни оптимизированный workflow в том же JSON формате.
            `;
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.3
            });
            const optimizedData = JSON.parse(response.choices[0].message.content || '{}');
            return {
                ...workflow,
                ...optimizedData,
                updatedAt: new Date()
            };
        }
        catch (error) {
            console.error('OpenAI optimization error, using fallback:', error.message);
            // Fallback: простая оптимизация
            const optimizedNodes = workflow.nodes.filter((node, index, self) => index === self.findIndex((n) => n.type === node.type));
            return {
                ...workflow,
                nodes: optimizedNodes,
                updatedAt: new Date()
            };
        }
    }
    // Real-time помощь с ошибками через OpenAI
    async helpWithError(node, error) {
        try {
            const prompt = `
            Узел workflow вызвал ошибку. Помоги пользователю исправить её.
            
            Информация об узле:
            - ID: ${node.id}
            - Тип: ${node.type}
            - Название: ${node.displayName}
            - Описание: ${node.description}
            - Данные: ${JSON.stringify(node.data, null, 2)}
            
            Ошибка: ${error.message || String(error)}
            
            Предоставь помощь в формате JSON:
            {
                "cause": "Причина ошибки простым языком",
                "solution": "Пошаговая инструкция по исправлению",
                "alternative": "Альтернативное решение проблемы",
                "codeExample": "Пример кода для исправления"
            }
            `;
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.5
            });
            return JSON.parse(response.choices[0].message.content || '{}');
        }
        catch (aiError) {
            console.error('OpenAI help error, using fallback:', aiError.message);
            return {
                cause: `Node ${node.displayName || node.type} failed: ${error.message || String(error)}`,
                solution: 'Check node configuration and parameters',
                alternative: 'Try using a different node type',
                codeExample: `// Example fix for ${node.type}\n// Check parameters and retry`
            };
        }
    }
    // Анализ workflow через OpenAI
    async analyzeWorkflow(workflow) {
        try {
            const prompt = `
            Проанализируй этот workflow на предмет проблем и оптимизаций:
            
            ${JSON.stringify(workflow, null, 2)}
            
            Проверь:
            1. Циклические зависимости
            2. Неиспользуемые узлы
            3. Узкие места в производительности
            4. Отсутствие обработки ошибок
            5. Возможные проблемы с безопасностью
            6. Оптимизации структуры
            
            Верни анализ в формате JSON:
            {
                "needsOptimization": true/false,
                "issues": ["проблема1", "проблема2"],
                "suggestions": ["предложение1", "предложение2"],
                "complexity": "simple|medium|complex",
                "estimatedTime": 5
            }
            `;
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.3
            });
            return JSON.parse(response.choices[0].message.content || '{}');
        }
        catch (error) {
            console.error('OpenAI analysis error, using fallback:', error.message);
            const nodeCount = workflow.nodes.length;
            const edgeCount = workflow.edges.length;
            return {
                needsOptimization: nodeCount > 10,
                issues: nodeCount === 0 ? ['No nodes found'] : [],
                suggestions: nodeCount > 10 ? ['Consider reducing node count'] : []
            };
        }
    }
    // Анализ выполнения
    async analyzeExecution(execution) {
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
                memoryUsage: 50,
                cpuUsage: 25
            },
            bottlenecks: errorNodes > 0 ? ['Failed nodes detected'] : [],
            optimizations: successNodes === nodeCount ? ['All nodes executed successfully'] : ['Fix failed nodes'],
            duration,
            nodeCount
        };
    }
    // Рекомендации по исправлению
    async suggestFixes(workflow, error) {
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
    analyzeRequest(request) {
        const lowerRequest = request.toLowerCase();
        let intent = 'General automation';
        let services = [];
        let triggers = ['manual'];
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
    generateNodes(analysis) {
        const nodes = [];
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
    generateEdges(analysis) {
        const edges = [];
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
    findSlowestNode(nodes) {
        return nodes.length > 0 ? nodes[0].nodeId : 'none';
    }
    findFastestNode(nodes) {
        return nodes.length > 0 ? nodes[0].nodeId : 'none';
    }
    generateId() {
        return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.CorallumAIAgent = CorallumAIAgent;
//# sourceMappingURL=CorallumAIAgent.js.map