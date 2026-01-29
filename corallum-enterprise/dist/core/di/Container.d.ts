export interface IDataManager {
    saveWorkflow(workflow: any): Promise<any>;
    getWorkflow(id: string): Promise<any>;
    listWorkflows(): Promise<any[]>;
    saveExecution(execution: any): Promise<any>;
    getExecution(id: string): Promise<any>;
}
export interface IAIManager {
    generateWorkflow(request: any): Promise<any>;
    healthCheck(): Promise<any>;
}
export interface IReliabilityManager {
    startExecution(workflowId: string, definition: any, input: any): Promise<string>;
    getExecutionStatus(id: string): Promise<any>;
    getMetrics(): Promise<any>;
}
export interface IEnterpriseManager {
    authenticateUser(email: string, password: string): Promise<any>;
    hasPermission(userId: string, permission: any): Promise<boolean>;
    getTenant(tenantId: string): Promise<any>;
}
export declare class DIContainer {
    private services;
    private singletons;
    register<T>(key: string, factory: () => T, singleton?: boolean): void;
    get<T>(key: string): T;
    private static instance;
    static getInstance(): DIContainer;
}
export declare const container: DIContainer;
//# sourceMappingURL=Container.d.ts.map