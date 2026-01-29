import { Workflow, IRun } from '../../types';
interface DatabaseConfig {
    postgres?: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl?: boolean;
        pool: {
            min: number;
            max: number;
            idle: number;
        };
    };
    redis?: {
        host: string;
        port: number;
        password?: string;
        db: number;
    };
    fallback?: {
        type: 'memory' | 'file';
        filePath?: string;
    };
}
interface IDataStorage {
    initialize(): Promise<void>;
    saveWorkflow(workflow: Workflow): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    listWorkflows(limit?: number, offset?: number): Promise<Workflow[]>;
    saveExecution(execution: IRun): Promise<IRun>;
    getExecution(id: string): Promise<IRun | null>;
    healthCheck(): Promise<{
        status: string;
        details: any;
    }>;
    close(): Promise<void>;
}
export declare class UniversalDataManager implements IDataStorage {
    private storage;
    private config;
    private initialized;
    constructor(config?: Partial<DatabaseConfig>);
    private buildConfig;
    initialize(): Promise<void>;
    saveWorkflow(workflow: Workflow): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    listWorkflows(limit?: number, offset?: number): Promise<Workflow[]>;
    saveExecution(execution: IRun): Promise<IRun>;
    getExecution(id: string): Promise<IRun | null>;
    healthCheck(): Promise<{
        status: string;
        details: any;
    }>;
    close(): Promise<void>;
    migrateData(from: IDataStorage, to: IDataStorage): Promise<void>;
}
export declare const universalDataManager: UniversalDataManager;
export {};
//# sourceMappingURL=UniversalDataManager.d.ts.map