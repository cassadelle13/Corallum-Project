import { PoolClient, QueryResult } from 'pg';
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}
export declare class DatabaseManager {
    private pool;
    private config;
    constructor(config: DatabaseConfig);
    query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
    connect(): Promise<void>;
    createTable(tableName: string, schema: any): Promise<void>;
    create(tableName: string, data: any): Promise<any>;
    findMany(tableName: string, options?: {
        where?: string;
        params?: any[];
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    findById(tableName: string, id: string): Promise<any>;
    update(tableName: string, id: string, data: any): Promise<any>;
    delete(tableName: string, id: string): Promise<boolean>;
    close(): Promise<void>;
    saveExecution(execution: any): Promise<any>;
    getExecution(executionId: string): Promise<any>;
    healthCheck(): Promise<{
        status: string;
        details: any;
    }>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
}
export default DatabaseManager;
//# sourceMappingURL=DatabaseManager.d.ts.map