"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeRegistry = void 0;
const NodeTypes_1 = require("./NodeTypes");
class NodeRegistry {
    constructor() {
        this.nodes = new Map();
        this.registerBuiltinNodes();
    }
    registerNode(node) {
        this.nodes.set(node.type, node);
    }
    getNode(type) {
        return this.nodes.get(type);
    }
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
    getNodesByCategory(category) {
        return Array.from(this.nodes.values()).filter(node => node.category === category);
    }
    // Новый метод для получения типов узлов для фронтенда
    getNodeTypes() {
        return NodeTypes_1.CORALLUM_NODE_TYPES;
    }
    // Новый метод для проверки совместимости
    isNodeTypeSupported(type) {
        return this.nodes.has(type);
    }
    registerBuiltinNodes() {
        // Регистрация всех узлов из единой библиотеки
        NodeTypes_1.CORALLUM_NODE_TYPES.forEach(nodeDef => {
            this.registerNode({
                type: nodeDef.type,
                displayName: nodeDef.displayName,
                description: nodeDef.description,
                icon: nodeDef.icon,
                category: nodeDef.category,
                execute: this.createExecutor(nodeDef.type)
            });
        });
    }
    createExecutor(type) {
        return async (data) => {
            switch (type) {
                case 'trigger':
                case 'manual':
                    return { triggered: true, timestamp: new Date() };
                case 'webhook':
                    return {
                        status: "received",
                        method: data.parameters?.method || "POST",
                        body: data.parameters?.body || {}
                    };
                case 'schedule':
                    return {
                        scheduled: true,
                        timestamp: new Date(),
                        cron: data.parameters?.cron || "0 0 * * *"
                    };
                case 'action':
                case 'script':
                    return {
                        executed: true,
                        result: `Mock execution of ${type}`,
                        output: data.parameters?.input || "processed"
                    };
                case 'http':
                    return {
                        url: data.parameters?.url || "https://api.example.com",
                        method: data.parameters?.method || "GET",
                        status: 200,
                        body: "Mock HTTP response"
                    };
                case 'database':
                    return {
                        query: data.parameters?.query || "SELECT 1",
                        rows: [{ id: 1, name: "Mock data" }],
                        affected: 1
                    };
                case 'slack':
                    return {
                        channel: data.parameters?.channel || "#general",
                        message: data.parameters?.message || "Mock Slack message",
                        sent: true
                    };
                case 'email':
                    return {
                        to: data.parameters?.to || "test@example.com",
                        subject: data.parameters?.subject || "Mock email",
                        sent: true
                    };
                case 'aiagent':
                case 'nlp_trigger':
                    return {
                        input: data.parameters?.input || "Привет! Мне нужна помощь с заказом на 10 000 рублей",
                        intent: "order",
                        confidence: 0.95,
                        entities: {
                            money: "10 000 рублей",
                            quantity: "1",
                            priority: "обычный"
                        },
                        response: "Распознан заказ на сумму 10 000 рублей",
                        processed: true
                    };
                case 'branch':
                    return {
                        condition: data.parameters?.condition || true,
                        path: data.parameters?.condition ? "yes" : "no",
                        branched: true
                    };
                case 'forloop':
                    return {
                        iterations: data.parameters?.items?.length || 0,
                        results: data.parameters?.items || [],
                        completed: true
                    };
                case 'delay':
                    return {
                        delayed: true,
                        seconds: data.parameters?.seconds || 60,
                        timestamp: new Date()
                    };
                case 'error':
                    return {
                        error: data.parameters?.error || "Mock error",
                        handled: true,
                        recovered: true
                    };
                case 'transform':
                    return {
                        operation: data.parameters?.operation || "normalize_phone",
                        input: data.parameters?.input || "+7 (999) 123-45-67",
                        output: "+79991234567",
                        transformed: true
                    };
                case 'payment':
                    return {
                        provider: data.parameters?.provider || "yukassa",
                        amount: data.parameters?.amount || 10000,
                        payment_id: "yukassa_1234567890_1234",
                        payment_url: "https://payment.yookassa.ru/pay/yukassa_1234567890_1234",
                        commission: 280,
                        total_amount: 10280,
                        status: "pending",
                        created: true
                    };
                case 'telegram':
                    return {
                        chat_id: data.parameters?.chat_id || "123456789",
                        message: data.parameters?.message || "Тестовое сообщение",
                        message_id: 98765,
                        sent: true
                    };
                case 'amocrm':
                    return {
                        lead_id: 54321,
                        status: "new",
                        responsible_user_id: 12345,
                        created: true
                    };
                case 'vk':
                    return {
                        post_id: 98765,
                        owner_id: -123456789,
                        from_group: 1,
                        posted: true
                    };
                default:
                    return {
                        type: type,
                        executed: true,
                        data: data,
                        mock: true
                    };
            }
        };
    }
}
exports.NodeRegistry = NodeRegistry;
//# sourceMappingURL=NodeRegistry.js.map