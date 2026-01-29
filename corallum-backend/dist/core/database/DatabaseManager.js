"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.DatabaseManager = void 0;
const pg_1 = require("pg");
const redis_1 = require("redis");
const uuid_1 = require("uuid");
// Enterprise-ready Database Manager
class DatabaseManager {
    constructor(config) {
        this.config = {
            postgres: {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'corallum',
                username: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password',
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
            ...config
        };
        this.initializePostgres();
        this.initializeRedis();
    }
    initializePostgres() {
        this.postgres = new pg_1.Pool({
            host: this.config.postgres.host,
            port: this.config.postgres.port,
            database: this.config.postgres.database,
            user: this.config.postgres.username,
            password: this.config.postgres.password,
            ssl: this.config.postgres.ssl ? { rejectUnauthorized: false } : false,
            min: this.config.postgres.pool.min,
            max: this.config.postgres.pool.max,
            idleTimeoutMillis: this.config.postgres.pool.idle,
            connectionTimeoutMillis: 5000,
        });
        // Handle connection errors
        this.postgres.on('error', (err) => {
            console.error('PostgreSQL connection error:', err);
        });
    }
    initializeRedis() {
        this.redis = (0, redis_1.createClient)({
            socket: {
                host: this.config.redis.host,
                port: this.config.redis.port
            },
            password: this.config.redis.password,
            database: this.config.redis.db
        });
        this.redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });
        this.redis.on('connect', () => {
            console.log('✅ Redis connected');
        });
    }
    // Initialize database and create tables
    async initialize() {
        try {
            await this.redis.connect();
            console.log('✅ Redis connected successfully');
            // Test PostgreSQL connection
            const client = await this.postgres.connect();
            console.log('✅ PostgreSQL connected successfully');
            // Create tables if they don't exist
            await this.createTables(client);
            client.release();
            console.log('✅ Database initialized successfully');
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            throw error;
        }
    }
    async createTables(client) {
        // Workflows table - stores workflow definitions
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
        // Workflow executions table - stores execution runs
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
        // Node executions table - stores individual node execution data
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
        // Create indexes for performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
            CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at);
            CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
            CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
            CREATE INDEX IF NOT EXISTS idx_executions_started_at ON workflow_executions(started_at);
            CREATE INDEX IF NOT EXISTS idx_node_executions_execution_id ON node_executions(execution_id);
            CREATE INDEX IF NOT EXISTS idx_node_executions_status ON node_executions(status);
        `);
        // Create updated_at trigger
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
            CREATE TRIGGER update_workflows_updated_at 
                BEFORE UPDATE ON workflows 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
    }
    // Workflow operations
    async saveWorkflow(workflow) {
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
        }
        finally {
            client.release();
        }
    }
    async getWorkflow(id) {
        const client = await this.postgres.connect();
        try {
            const result = await client.query('SELECT * FROM workflows WHERE id = $1', [id]);
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
        }
        finally {
            client.release();
        }
    }
    async listWorkflows(limit = 50, offset = 0) {
        const client = await this.postgres.connect();
        try {
            const result = await client.query('SELECT * FROM workflows ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
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
        }
        finally {
            client.release();
        }
    }
    // Execution operations
    async saveExecution(execution) {
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
                        nodeExecution.id || (0, uuid_1.v4)(),
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
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getExecution(id) {
        const client = await this.postgres.connect();
        try {
            // Get main execution
            const executionResult = await client.query('SELECT * FROM workflow_executions WHERE id = $1', [id]);
            if (executionResult.rows.length === 0) {
                return null;
            }
            const executionRow = executionResult.rows[0];
            // Get node executions
            const nodeResult = await client.query('SELECT * FROM node_executions WHERE execution_id = $1 ORDER BY started_at', [id]);
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
        }
        finally {
            client.release();
        }
    }
    // Redis operations for caching and real-time data
    async cacheExecution(execution, ttl = 3600) {
        const key = `execution:${execution.id}`;
        await this.redis.setEx(key, ttl, JSON.stringify(execution));
    }
    async getCachedExecution(id) {
        const key = `execution:${id}`;
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async deleteCachedExecution(id) {
        const key = `execution:${id}`;
        await this.redis.del(key);
    }
    // Real-time events using Redis pub/sub
    async publishEvent(channel, data) {
        await this.redis.publish(channel, JSON.stringify(data));
    }
    // Health check
    async healthCheck() {
        try {
            // Check PostgreSQL
            const pgClient = await this.postgres.connect();
            await pgClient.query('SELECT 1');
            pgClient.release();
            // Check Redis
            await this.redis.ping();
            return { postgres: true, redis: true };
        }
        catch (error) {
            console.error('Health check failed:', error);
            return { postgres: false, redis: false };
        }
    }
    // Cleanup
    async close() {
        await this.postgres.end();
        await this.redis.quit();
    }
}
exports.DatabaseManager = DatabaseManager;
// Export singleton instance
exports.database = new DatabaseManager();
//# sourceMappingURL=DatabaseManager.js.map