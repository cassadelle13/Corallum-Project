import { Workflow, IRun } from '../../types';
interface DatabaseConfig {
    postgres: {
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
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
    };
}
export declare class DatabaseManager {
    private postgres;
    private redis;
    private config;
    constructor(config?: Partial<DatabaseConfig>);
    private initializePostgres;
    private initializeRedis;
    initialize(): Promise<void>;
    private createTables;
    saveWorkflow(workflow: Workflow): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    listWorkflows(limit?: number, offset?: number): Promise<Workflow[]>;
    saveExecution(execution: IRun): Promise<IRun>;
    getExecution(id: string): Promise<IRun | null>;
    cacheExecution(execution: IRun, ttl?: number): Promise<void>;
    getCachedExecution(id: string): Promise<IRun | null>;
    deleteCachedExecution(id: string): Promise<void>;
    publishEvent(channel: string, data: any): Promise<void>;
    healthCheck(): Promise<{
        postgres: boolean;
        redis: boolean;
    }>;
    close(): Promise<void>;
}
export declare const database: DatabaseManager;
export {};
//# sourceMappingURL=DatabaseManager.d.ts.map