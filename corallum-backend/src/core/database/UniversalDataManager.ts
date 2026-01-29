import { Pool, PoolClient } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { Workflow, IRun, NodeExecution } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

// Универсальная конфигурация с fallback
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

// Интерфейс для универсального хранилища
interface IDataStorage {
    initialize(): Promise<void>;
    saveWorkflow(workflow: Workflow): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    listWorkflows(limit?: number, offset?: number): Promise<Workflow[]>;
    saveExecution(execution: IRun): Promise<IRun>;
    getExecution(id: string): Promise<IRun | null>;
    healthCheck(): Promise<{ status: string; details: any }>;
    close(): Promise<void>;
}

// In-memory хранилище (fallback)
class MemoryStorage implements IDataStorage {
    private workflows = new Map<string, Workflow>();
    private executions = new Map<string, IRun>();
    private initialized = false;

    async initialize(): Promise<void> {
        console.log('🧠 Initializing Memory Storage (fallback mode)');
        this.initialized = true;
        console.log('✅ Memory Storage initialized successfully');
    }

    async saveWorkflow(workflow: Workflow): Promise<Workflow> {
        if (!this.initialized) await this.initialize();
        
        const savedWorkflow = {
            ...workflow,
            id: workflow.id || uuidv4(),
            createdAt: workflow.createdAt || new Date(),
            updatedAt: new Date()
        };
        
        this.workflows.set(savedWorkflow.id, savedWorkflow);
        return savedWorkflow;
    }

    async getWorkflow(id: string): Promise<Workflow | null> {
        if (!this.initialized) await this.initialize();
        return this.workflows.get(id) || null;
    }

    async listWorkflows(limit: number = 50, offset: number = 0): Promise<Workflow[]> {
        if (!this.initialized) await this.initialize();
        
        const workflows = Array.from(this.workflows.values())
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        return workflows.slice(offset, offset + limit);
    }

    async saveExecution(execution: IRun): Promise<IRun> {
        if (!this.initialized) await this.initialize();
        
        const savedExecution = {
            ...execution,
            id: execution.id || uuidv4(),
            startedAt: execution.startedAt || new Date()
        };
        
        this.executions.set(savedExecution.id, savedExecution);
        return savedExecution;
    }

    async getExecution(id: string): Promise<IRun | null> {
        if (!this.initialized) await this.initialize();
        return this.executions.get(id) || null;
    }

    async healthCheck(): Promise<{ status: string; details: any }> {
        return {
            status: 'healthy',
            details: {
                type: 'memory',
                workflows: this.workflows.size,
                executions: this.executions.size,
                initialized: this.initialized
            }
        };
    }

    async close(): Promise<void> {
        this.workflows.clear();
        this.executions.clear();
        this.initialized = false;
    }
}

// File-based хранилище (persistent fallback)
class FileStorage implements IDataStorage {
    private filePath: string;
    private data: {
        workflows: Record<string, Workflow>;
        executions: Record<string, IRun>;
    };
    private initialized = false;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.data = { workflows: {}, executions: {} };
    }

    async initialize(): Promise<void> {
        try {
            console.log(`📁 Initializing File Storage: ${this.filePath}`);
            
            // Создаем директорию если не существует
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Загружаем существующие данные
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf8');
                this.data = JSON.parse(fileContent);
            }

            this.initialized = true;
            console.log('✅ File Storage initialized successfully');
        } catch (error) {
            console.error('❌ File Storage initialization failed:', error);
            throw error;
        }
    }

    private async saveToFile(): Promise<void> {
        if (!this.initialized) return;
        
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save to file:', error);
        }
    }

    async saveWorkflow(workflow: Workflow): Promise<Workflow> {
        if (!this.initialized) await this.initialize();
        
        const savedWorkflow = {
            ...workflow,
            id: workflow.id || uuidv4(),
            createdAt: workflow.createdAt || new Date(),
            updatedAt: new Date()
        };
        
        this.data.workflows[savedWorkflow.id] = savedWorkflow;
        await this.saveToFile();
        
        return savedWorkflow;
    }

    async getWorkflow(id: string): Promise<Workflow | null> {
        if (!this.initialized) await this.initialize();
        return this.data.workflows[id] || null;
    }

    async listWorkflows(limit: number = 50, offset: number = 0): Promise<Workflow[]> {
        if (!this.initialized) await this.initialize();
        
        const workflows = Object.values(this.data.workflows)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        return workflows.slice(offset, offset + limit);
    }

    async saveExecution(execution: IRun): Promise<IRun> {
        if (!this.initialized) await this.initialize();
        
        const savedExecution = {
            ...execution,
            id: execution.id || uuidv4(),
            startedAt: execution.startedAt || new Date()
        };
        
        this.data.executions[savedExecution.id] = savedExecution;
        await this.saveToFile();
        
        return savedExecution;
    }

    async getExecution(id: string): Promise<IRun | null> {
        if (!this.initialized) await this.initialize();
        return this.data.executions[id] || null;
    }

    async healthCheck(): Promise<{ status: string; details: any }> {
        return {
            status: 'healthy',
            details: {
                type: 'file',
                filePath: this.filePath,
                workflows: Object.keys(this.data.workflows).length,
                executions: Object.keys(this.data.executions).length,
                initialized: this.initialized
            }
        };
    }

    async close(): Promise<void> {
        await this.saveToFile();
        this.initialized = false;
    }
}

// PostgreSQL хранилище (production)
class PostgreSQLStorage implements IDataStorage {
    private postgres!: Pool;
    private redis!: RedisClientType;
    private config: DatabaseConfig;
    private initialized = false;

    constructor(config: DatabaseConfig) {
        this.config = config;
    }

    async initialize(): Promise<void> {
        try {
            console.log('🗄️ Initializing PostgreSQL Storage...');
            
            // Initialize PostgreSQL
            this.postgres = new Pool({
                host: this.config.postgres!.host,
                port: this.config.postgres!.port,
                database: this.config.postgres!.database,
                user: this.config.postgres!.username,
                password: this.config.postgres!.password,
                ssl: this.config.postgres!.ssl ? { rejectUnauthorized: false } : false,
                min: this.config.postgres!.pool.min,
                max: this.config.postgres!.pool.max,
                idleTimeoutMillis: this.config.postgres!.pool.idle,
                connectionTimeoutMillis: 5000,
            });

            // Initialize Redis
            this.redis = createClient({
                socket: {
                    host: this.config.redis!.host,
                    port: this.config.redis!.port
                },
                password: this.config.redis!.password,
                database: this.config.redis!.db
            });

            this.redis.on('error', (err) => {
                console.error('Redis connection error:', err);
            });

            this.redis.on('connect', () => {
                console.log('✅ Redis connected');
            });

            // Test connections
            await this.redis.connect();
            console.log('✅ Redis connected successfully');

            const client = await this.postgres.connect();
            console.log('✅ PostgreSQL connected successfully');
            
            // Create tables
            await this.createTables(client);
            client.release();

            this.initialized = true;
            console.log('✅ PostgreSQL Storage initialized successfully');
        } catch (error: any) {
            console.error('❌ PostgreSQL Storage initialization failed:', error.message);
            throw error;
        }
    }

    private async createTables(client: PoolClient): Promise<void> {
        // Workflows table
        await client.query(`
            CREATE TABLE IF NOT EXISTS workflows (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                nodes JSONB NOT NULL DEFAULT '[]',
                edges JSONB NOT NULL DEFAULT '[]',
                settings JSONB NOT NULL DEFAULT '{}',
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by VARCHAR(255),
                version INTEGER DEFAULT 1,
                tags TEXT[] DEFAULT '{}'
            );
        `);

        // Workflow executions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS workflow_executions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL DEFAULT 'running',
                started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE,
                result JSONB,
                error TEXT,
                trigger_data JSONB DEFAULT '{}',
                context JSONB DEFAULT '{}',
                created_by VARCHAR(255)
            );
        `);

        // Node executions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS node_executions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
                node_id VARCHAR(255) NOT NULL,
                node_type VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE,
                result JSONB,
                error TEXT,
                input_data JSONB DEFAULT '{}',
                output_data JSONB DEFAULT '{}',
                metadata JSONB DEFAULT '{}'
            );
        `);

        // Indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
            CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at);
            CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
            CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
            CREATE INDEX IF NOT EXISTS idx_executions_started_at ON workflow_executions(started_at);
            CREATE INDEX IF NOT EXISTS idx_node_executions_execution_id ON node_executions(execution_id);
            CREATE INDEX IF NOT EXISTS idx_node_executions_status ON node_executions(status);
        `);
    }

    async saveWorkflow(workflow: Workflow): Promise<Workflow> {
        if (!this.initialized) await this.initialize();
        
        const client = await this.postgres.connect();
        try {
            const query = `
                INSERT INTO workflows (id, name, description, nodes, edges, settings, created_by, tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (id) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    nodes = EXCLUDED.nodes,
                    edges = EXCLUDED.edges,
                    settings = EXCLUDED.settings,
                    tags = EXCLUDED.tags,
                    updated_at = NOW()
                RETURNING *;
            `;

            const result = await client.query(query, [
                workflow.id,
                workflow.name,
                workflow.description,
                JSON.stringify(workflow.nodes),
                JSON.stringify(workflow.edges),
                JSON.stringify(workflow.settings || {}),
                workflow.createdBy || 'system',
                workflow.tags || []
            ]);

            const savedWorkflow = result.rows[0];
            return {
                id: savedWorkflow.id,
                name: savedWorkflow.name,
                description: savedWorkflow.description,
                nodes: savedWorkflow.nodes,
                edges: savedWorkflow.edges,
                settings: savedWorkflow.settings,
                createdAt: savedWorkflow.created_at,
                updatedAt: savedWorkflow.updated_at,
                createdBy: savedWorkflow.created_by,
                tags: savedWorkflow.tags
            };
        } finally {
            client.release();
        }
    }

    async getWorkflow(id: string): Promise<Workflow | null> {
        if (!this.initialized) await this.initialize();
        
        const client = await this.postgres.connect();
        try {
            const result = await client.query(
                'SELECT * FROM workflows WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                description: row.description,
                nodes: row.nodes,
                edges: row.edges,
                settings: row.settings,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                createdBy: row.created_by,
                tags: row.tags
            };
        } finally {
            client.release();
        }
    }

    async listWorkflows(limit: number = 50, offset: number = 0): Promise<Workflow[]> {
        if (!this.initialized) await this.initialize();
        
        const client = await this.postgres.connect();
        try {
            const result = await client.query(
                'SELECT * FROM workflows ORDER BY created_at DESC LIMIT $1 OFFSET $2',
                [limit, offset]
            );

            return result.rows.map(row => ({
                id: row.id,
                name: row.name,
                description: row.description,
                nodes: row.nodes,
                edges: row.edges,
                settings: row.settings,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                createdBy: row.created_by,
                tags: row.tags
            }));
        } finally {
            client.release();
        }
    }

    async saveExecution(execution: IRun): Promise<IRun> {
        if (!this.initialized) await this.initialize();
        
        const client = await this.postgres.connect();
        try {
            await client.query('BEGIN');

            // Save main execution
            const executionQuery = `
                INSERT INTO workflow_executions (id, workflow_id, status, started_at, completed_at, result, error, trigger_data, context, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) 
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    completed_at = EXCLUDED.completed_at,
                    result = EXCLUDED.result,
                    error = EXCLUDED.error
                RETURNING *;
            `;

            const executionResult = await client.query(executionQuery, [
                execution.id,
                execution.workflowId,
                execution.status,
                execution.startedAt,
                execution.completedAt,
                execution.result ? JSON.stringify(execution.result) : null,
                execution.error,
                JSON.stringify(execution.triggerData || {}),
                JSON.stringify(execution.context || {}),
                execution.createdBy || 'system'
            ]);

            // Save node executions
            if (execution.nodes && execution.nodes.length > 0) {
                for (const nodeExecution of execution.nodes) {
                    await client.query(`
                        INSERT INTO node_executions (id, execution_id, node_id, node_type, status, started_at, completed_at, result, error, input_data, output_data, metadata)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        ON CONFLICT (id) 
                        DO UPDATE SET 
                            status = EXCLUDED.status,
                            completed_at = EXCLUDED.completed_at,
                            result = EXCLUDED.result,
                            error = EXCLUDED.error,
                            output_data = EXCLUDED.output_data
                    `, [
                        nodeExecution.id || uuidv4(),
                        execution.id,
                        nodeExecution.nodeId,
                        nodeExecution.nodeType,
                        nodeExecution.status,
                        nodeExecution.startedAt,
                        nodeExecution.completedAt,
                        nodeExecution.result ? JSON.stringify(nodeExecution.result) : null,
                        nodeExecution.error,
                        JSON.stringify(nodeExecution.inputData || {}),
                        JSON.stringify(nodeExecution.outputData || {}),
                        JSON.stringify(nodeExecution.metadata || {})
                    ]);
                }
            }

            await client.query('COMMIT');

            const savedExecution = executionResult.rows[0];
            return {
                id: savedExecution.id,
                workflowId: savedExecution.workflow_id,
                status: savedExecution.status,
                startedAt: savedExecution.started_at,
                completedAt: savedExecution.completed_at,
                result: savedExecution.result,
                error: savedExecution.error,
                triggerData: savedExecution.trigger_data,
                context: savedExecution.context,
                nodes: execution.nodes
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getExecution(id: string): Promise<IRun | null> {
        if (!this.initialized) await this.initialize();
        
        const client = await this.postgres.connect();
        try {
            // Get main execution
            const executionResult = await client.query(
                'SELECT * FROM workflow_executions WHERE id = $1',
                [id]
            );

            if (executionResult.rows.length === 0) {
                return null;
            }

            const executionRow = executionResult.rows[0];

            // Get node executions
            const nodeResult = await client.query(
                'SELECT * FROM node_executions WHERE execution_id = $1 ORDER BY started_at',
                [id]
            );

            return {
                id: executionRow.id,
                workflowId: executionRow.workflow_id,
                status: executionRow.status,
                startedAt: executionRow.started_at,
                completedAt: executionRow.completed_at,
                result: executionRow.result,
                error: executionRow.error,
                triggerData: executionRow.trigger_data,
                context: executionRow.context,
                nodes: nodeResult.rows.map(row => ({
                    id: row.id,
                    nodeId: row.node_id,
                    nodeType: row.node_type,
                    status: row.status,
                    startedAt: row.started_at,
                    completedAt: row.completed_at,
                    result: row.result,
                    error: row.error,
                    inputData: row.input_data,
                    outputData: row.output_data,
                    metadata: row.metadata
                }))
            };
        } finally {
            client.release();
        }
    }

    async healthCheck(): Promise<{ status: string; details: any }> {
        try {
            // Check PostgreSQL
            const pgClient = await this.postgres.connect();
            await pgClient.query('SELECT 1');
            pgClient.release();

            // Check Redis
            await this.redis.ping();

            return {
                status: 'healthy',
                details: {
                    type: 'postgresql',
                    postgres: true,
                    redis: true,
                    initialized: this.initialized
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    type: 'postgresql',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    initialized: this.initialized
                }
            };
        }
    }

    async close(): Promise<void> {
        if (this.postgres) await this.postgres.end();
        if (this.redis) await this.redis.quit();
        this.initialized = false;
    }
}

// Универсальный менеджер данных с автоматическим fallback
export class UniversalDataManager implements IDataStorage {
    private storage: IDataStorage;
    private config: DatabaseConfig;
    private initialized = false;

    constructor(config?: Partial<DatabaseConfig>) {
        this.config = this.buildConfig(config);
        this.storage = new MemoryStorage(); // Начинаем с memory storage
    }

    private buildConfig(config?: Partial<DatabaseConfig>): DatabaseConfig {
        return {
            postgres: {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'corallum',
                username: process.env.DB_USER || 'corallum',
                password: process.env.DB_PASSWORD || 'corallum123',
                ssl: process.env.NODE_ENV === 'production',
                pool: {
                    min: parseInt(process.env.DB_POOL_MIN || '2'),
                    max: parseInt(process.env.DB_POOL_MAX || '20'),
                    idle: parseInt(process.env.DB_POOL_IDLE || '10000')
                }
            },
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_DB || '0')
            },
            fallback: {
                type: process.env.FALLBACK_TYPE === 'file' ? 'file' : 'memory',
                filePath: process.env.FALLBACK_FILE_PATH || './data/corallum-data.json'
            },
            ...config
        };
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('🔄 Initializing Universal Data Manager...');
        
        // Пробуем PostgreSQL первой
        try {
            console.log('🗄️ Attempting PostgreSQL connection...');
            const pgStorage = new PostgreSQLStorage(this.config);
            await pgStorage.initialize();
            
            const health = await pgStorage.healthCheck();
            if (health.status === 'healthy') {
                this.storage = pgStorage;
                console.log('✅ PostgreSQL storage activated');
                this.initialized = true;
                return;
            }
        } catch (error) {
            console.warn('⚠️ PostgreSQL connection failed, trying fallback...');
        }

        // Пробуем File storage
        if (this.config.fallback?.type === 'file') {
            try {
                console.log('📁 Attempting File storage...');
                const fileStorage = new FileStorage(this.config.fallback.filePath!);
                await fileStorage.initialize();
                this.storage = fileStorage;
                console.log('✅ File storage activated (fallback mode)');
                this.initialized = true;
                return;
            } catch (error) {
                console.warn('⚠️ File storage failed, using memory fallback...');
            }
        }

        // Используем Memory storage как последний fallback
        console.log('🧠 Using Memory storage (final fallback)');
        await this.storage.initialize();
        this.initialized = true;
    }

    async saveWorkflow(workflow: Workflow): Promise<Workflow> {
        if (!this.initialized) await this.initialize();
        return this.storage.saveWorkflow(workflow);
    }

    async getWorkflow(id: string): Promise<Workflow | null> {
        if (!this.initialized) await this.initialize();
        return this.storage.getWorkflow(id);
    }

    async listWorkflows(limit: number = 50, offset: number = 0): Promise<Workflow[]> {
        if (!this.initialized) await this.initialize();
        return this.storage.listWorkflows(limit, offset);
    }

    async saveExecution(execution: IRun): Promise<IRun> {
        if (!this.initialized) await this.initialize();
        return this.storage.saveExecution(execution);
    }

    async getExecution(id: string): Promise<IRun | null> {
        if (!this.initialized) await this.initialize();
        return this.storage.getExecution(id);
    }

    async healthCheck(): Promise<{ status: string; details: any }> {
        if (!this.initialized) {
            return {
                status: 'initializing',
                details: { message: 'Data manager is still initializing' }
            };
        }
        
        return this.storage.healthCheck();
    }

    async close(): Promise<void> {
        if (this.initialized) {
            await this.storage.close();
            this.initialized = false;
        }
    }

    // Дополнительные методы для миграции данных
    async migrateData(from: IDataStorage, to: IDataStorage): Promise<void> {
        console.log('🔄 Starting data migration...');
        
        // Миграция workflows
        const workflows = await from.listWorkflows(1000, 0);
        for (const workflow of workflows) {
            await to.saveWorkflow(workflow);
        }
        
        console.log(`✅ Migrated ${workflows.length} workflows`);
        console.log('✅ Data migration completed');
    }
}

// Экспорт универсального менеджера
export const universalDataManager = new UniversalDataManager();
