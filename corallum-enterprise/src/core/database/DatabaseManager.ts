// Database Manager - чистая рабочая версия
// Предоставляет базовые CRUD операции

import { Pool, PoolClient, QueryResult } from 'pg';

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

export class DatabaseManager {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = {
      min: 2,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ...config
    };
    
    this.pool = new Pool(this.config);
  }

  // Основной метод запросов
  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const startTime = Date.now();

    try {
      const result = await this.pool.query<T>(sql, params);
      
      const duration = Date.now() - startTime;
      
      console.log('Query executed', {
        sql: sql.substring(0, 100),
        duration,
        rowCount: result.rowCount
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('Query failed', error, {
        sql: sql.substring(0, 100),
        duration
      });

      throw error;
    }
  }

  // Базовые CRUD методы для EnterpriseManager
  async connect(): Promise<void> {
    await this.pool.connect();
    console.log('📊 Database connected successfully');
  }

  async createTable(tableName: string, schema: any): Promise<void> {
    const columns = Object.entries(schema)
      .map(([name, config]: [string, any]) => {
        let columnDef = `${name} ${config.type}`;
        if (config.notNull) columnDef += ' NOT NULL';
        if (config.primaryKey) columnDef += ' PRIMARY KEY';
        if (config.unique) columnDef += ' UNIQUE';
        if (config.defaultValue) columnDef += ` DEFAULT ${config.defaultValue}`;
        if (config.references) columnDef += ` REFERENCES ${config.references}`;
        return columnDef;
      })
      .join(', ');

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`;
    await this.query(sql);
    console.log(`📋 Table ${tableName} created successfully`);
  }

  async create(tableName: string, data: any): Promise<any> {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.query(sql, values);
    return result.rows[0];
  }

  async findMany(tableName: string, options: { where?: string; params?: any[]; limit?: number; offset?: number } = {}): Promise<any[]> {
    let sql = `SELECT * FROM ${tableName}`;
    const params: any[] = [];

    if (options.where) {
      sql += ` WHERE ${options.where}`;
      if (options.params) params.push(...options.params);
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    const result = await this.query(sql, params);
    return result.rows;
  }

  async findById(tableName: string, id: string): Promise<any> {
    const result = await this.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async update(tableName: string, id: string, data: any): Promise<any> {
    const columns = Object.keys(data).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(data)];
    
    const sql = `UPDATE ${tableName} SET ${columns} WHERE id = $1 RETURNING *`;
    const result = await this.query(sql, values);
    return result.rows[0];
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    const result = await this.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
    return result.rowCount > 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('📊 Database connection closed');
  }

  // Методы для InngestManager
  async saveExecution(execution: any): Promise<any> {
    return this.create('workflow_executions', execution);
  }

  async getExecution(executionId: string): Promise<any> {
    return this.findById('workflow_executions', executionId);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      const poolInfo = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };

      return {
        status: 'healthy',
        details: {
          connection: 'ok',
          pool: poolInfo
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  // Transaction management
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default DatabaseManager;
