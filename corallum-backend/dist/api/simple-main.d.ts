import { Workflow, IRun } from '../types';
declare class SimpleWorkflowEngine {
    private executions;
    executeWorkflow(workflow: Workflow, triggerData?: any): Promise<IRun>;
    private generateExecutionId;
    getExecution(executionId: string): IRun | undefined;
}
declare class SimpleAIAgent {
    createWorkflowFromRequest(userRequest: string): Promise<Workflow>;
    analyzeWorkflow(workflow: Workflow): Promise<any>;
    optimizeWorkflow(workflow: Workflow, analysis: any): Promise<Workflow>;
    private generateId;
}
declare const routes: {
    'POST /api/v1/workflows/create-from-text': (req: any) => Promise<{
        success: boolean;
        error: string;
        workflow?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        workflow: Workflow;
        message: string;
        error?: undefined;
    }>;
    'POST /api/v1/workflows/:workflowId/execute': (req: any) => Promise<{
        success: boolean;
        execution: IRun;
    }>;
    'GET /api/v1/workflows/:workflowId': (req: any) => Promise<{
        success: boolean;
        workflow: Workflow;
    }>;
    'GET /api/v1/executions/:executionId': (req: any) => Promise<{
        success: boolean;
        error: string;
        execution?: undefined;
    } | {
        success: boolean;
        execution: IRun;
        error?: undefined;
    }>;
    'GET /api/v1/nodes': () => Promise<{
        success: boolean;
        nodes: any;
        categories: string[];
        total_nodes: any;
        rf_specific: boolean;
        enhanced_features: string[];
    }>;
    'POST /api/v1/test/nodes': () => Promise<{
        success: boolean;
        message: string;
        timestamp: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        timestamp: string;
        message?: undefined;
    }>;
    'POST /api/v1/nodes/:nodeType/execute': (req: any) => Promise<{
        success: boolean;
        error: string;
        nodeType?: undefined;
        result?: undefined;
        timestamp?: undefined;
    } | {
        success: boolean;
        nodeType: any;
        result: any;
        timestamp: string;
        error?: undefined;
    } | {
        success: boolean;
        nodeType: any;
        error: any;
        timestamp: string;
        result?: undefined;
    }>;
    'GET /api/v1/workflows': () => Promise<{
        success: boolean;
        data: Workflow[];
        count: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        count?: undefined;
    }>;
    'POST /api/v1/workflows': (req: any) => Promise<{
        success: boolean;
        data: Workflow;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    'GET /api/v1/workflows/:id': (req: any) => Promise<{
        success: boolean;
        data: Workflow;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    'GET /api/v1/executions': () => Promise<{
        success: boolean;
        data: never[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    'GET /health': () => Promise<{
        status: string;
        timestamp: string;
        version: string;
        service: string;
        data: {
            status: string;
            details: any;
        };
        error?: undefined;
    } | {
        status: string;
        timestamp: string;
        version: string;
        service: string;
        error: any;
        data?: undefined;
    }>;
};
export { SimpleWorkflowEngine, SimpleAIAgent, routes };
//# sourceMappingURL=simple-main.d.ts.map