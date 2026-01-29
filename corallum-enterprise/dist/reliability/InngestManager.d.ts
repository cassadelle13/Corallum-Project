import { Inngest } from 'inngest';
import DatabaseManager from '../core/database/DatabaseManager';
export interface InngestConfig {
    apiKey?: string;
    baseUrl?: string;
    eventKey?: string;
    signingKey?: string;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    tenantId: string;
    userId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
    startedAt?: Date;
    completedAt?: Date;
    input: any;
    output?: any;
    error?: string;
    retryCount: number;
    maxRetries: number;
    nextRetryAt?: Date;
    metadata: Record<string, any>;
}
export interface ExecutionEvent {
    name: string;
    data: any;
    user?: {
        id: string;
        tenantId: string;
    };
    v?: string;
}
export declare class InngestManager {
    private inngest;
    private config;
    private database;
    private executions;
    private retryQueue;
    private functions;
    private metrics;
    constructor(config: InngestConfig, database: DatabaseManager);
    listExecutions(tenantId: string, options?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    private initializeInngest;
    private setupRetryMechanism;
    createWorkflowFunction(workflowId: string, workflowDefinition: any): import("inngest").InngestFunction<Omit<import("inngest").InngestFunction.Options<Inngest<import("inngest").ClientOptions>, import("inngest").InngestMiddleware.Stack, [{
        event: string;
    }], import("inngest").Handler<Inngest<import("inngest").ClientOptions>, string, {
        event: import("inngest").FailureEventPayload<import("inngest").EventPayload<any>>;
        logger: import("inngest").Logger;
        error: Error;
    }>>, "triggers">, ({ event, step }: import("inngest").Context<Inngest<import("inngest").ClientOptions>, string, {
        logger: import("inngest").Logger;
    }>) => Promise<{
        success: boolean;
        executionId: any;
        result: any;
        completedAt: Date;
    }>, import("inngest").Handler<Inngest<import("inngest").ClientOptions>, string, {
        event: import("inngest").FailureEventPayload<import("inngest").EventPayload<any>>;
        logger: import("inngest").Logger;
        error: Error;
    }>, Inngest<import("inngest").ClientOptions>, import("inngest").InngestMiddleware.Stack, [{
        event: string;
    }]>;
    private executeWorkflowSteps;
    private executeNode;
    private executeApiCall;
    private executeTransform;
    private executeCondition;
    private executeDelay;
    private executeEmail;
    startWorkflowExecution(workflowId: string, workflowDefinition: any, input: any, tenantId: string, userId: string): Promise<string>;
    getExecutionStatus(executionId: string): Promise<WorkflowExecution | null>;
    updateExecutionStatus(executionId: string, status: WorkflowExecution['status'], updates?: Partial<WorkflowExecution>): Promise<void>;
    private processRetryQueue;
    retryExecution(executionId: string): Promise<void>;
    private updateMetrics;
    getMetrics(): any;
    healthCheck(): Promise<{
        status: string;
        details: any;
    }>;
    cleanup(): Promise<void>;
    getInngestMiddleware(): import("inngest/next").RequestHandler & {
        GET: import("inngest/next").RequestHandler;
        POST: import("inngest/next").RequestHandler;
        PUT: import("inngest/next").RequestHandler;
    };
}
//# sourceMappingURL=InngestManager.d.ts.map