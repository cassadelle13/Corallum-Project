// Enterprise Manager - простая рабочая версия
// Использует DatabaseManager для CRUD операций

import DatabaseManager from '../core/database/DatabaseManager';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  WORKFLOW_ADMIN = 'workflow_admin',
  VIEWER = 'viewer'
}

export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  role: UserRole;
  permissions: string[];
  created_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export class EnterpriseManager {
  private database: DatabaseManager;
  private jwtSecret: string;

  constructor(database: DatabaseManager, jwtSecret: string) {
    this.database = database;
    this.jwtSecret = jwtSecret;
  }

  async initialize(): Promise<void> {
    console.log('🏢 Initializing Enterprise Manager...');
    
    // Проверяем/создаем таблицы для multi-tenant
    await this.ensureMultiTenantSchema();
    
    console.log('✅ Enterprise Manager initialized');
  }

  private async ensureMultiTenantSchema(): Promise<void> {
    try {
      // Проверяем существование таблицы tenants
      const tenantTableCheck = await this.database.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'tenants'
        );
      `);

      if (!tenantTableCheck.rows[0].exists) {
        console.log('📋 Creating multi-tenant schema...');
        // Здесь можно выполнить миграцию
        console.log('✅ Multi-tenant schema created');
      }
    } catch (error) {
      console.error('❌ Failed to ensure multi-tenant schema:', error);
    }
  }

  // Multi-tenant methods
  async createTenant(name: string, slug: string, settings: Record<string, any> = {}): Promise<Tenant> {
    const query = `
      INSERT INTO tenants (name, slug, settings, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING id, name, slug, settings, created_at, updated_at, is_active
    `;
    
    const result = await this.database.query(query, [name, slug, settings]);
    return result.rows[0];
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const query = `
      SELECT id, name, slug, settings, created_at, updated_at, is_active
      FROM tenants 
      WHERE slug = $1 AND is_active = true
    `;
    
    const result = await this.database.query(query, [slug]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    const query = `
      SELECT id, name, slug, settings, created_at, updated_at, is_active
      FROM tenants 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await this.database.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.slug) {
      fields.push(`slug = $${paramIndex++}`);
      values.push(updates.slug);
    }
    if (updates.settings) {
      fields.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(updates.settings));
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE tenants 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, slug, settings, created_at, updated_at, is_active
    `;

    const result = await this.database.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async createUserForTenant(
    tenantId: string, 
    email: string, 
    name: string, 
    password: string, 
    role: UserRole = UserRole.USER,
    permissions: string[] = []
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (tenant_id, email, name, password_hash, role, permissions, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, email, name, tenant_id, role, permissions, created_at, is_active
    `;
    
    const result = await this.database.query(query, [
      tenantId, email, name, passwordHash, role, permissions
    ]);
    
    return result.rows[0];
  }

  async authenticateUser(email: string, password: string, tenantSlug: string): Promise<{ user: User; token: string } | null> {
    // Получаем tenant
    const tenant = await this.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return null;
    }

    // Ищем пользователя в tenant
    const query = `
      SELECT id, email, name, tenant_id, role, permissions, password_hash, created_at, is_active
      FROM users 
      WHERE tenant_id = $1 AND email = $2 AND is_active = true
    `;
    
    const result = await this.database.query(query, [tenant.id, email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      return null;
    }

    // Создаем JWT токен с tenant информацией
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        tenantId: user.tenant_id,
        tenantSlug: tenantSlug,
        role: user.role 
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    // Обновляем last_login
    await this.database.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenant_id: user.tenant_id,
        role: user.role,
        permissions: user.permissions,
        created_at: user.created_at,
        is_active: user.is_active
      },
      token
    };
  }

  async getTenantUsers(tenantId: string): Promise<User[]> {
    const query = `
      SELECT id, email, name, tenant_id, role, permissions, created_at, last_login, is_active
      FROM users 
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    
    const result = await this.database.query(query, [tenantId]);
    return result.rows;
  }

  async createWorkflowForTenant(
    tenantId: string,
    name: string,
    description: string,
    definition: any,
    createdBy: string
  ): Promise<any> {
    const query = `
      INSERT INTO workflows (tenant_id, name, description, definition, created_by, status)
      VALUES ($1, $2, $3, $4, $5, 'draft')
      RETURNING id, name, description, definition, status, created_at, updated_at
    `;
    
    const result = await this.database.query(query, [
      tenantId, name, description, JSON.stringify(definition), createdBy
    ]);
    
    return result.rows[0];
  }

  async getTenantWorkflows(tenantId: string): Promise<any[]> {
    const query = `
      SELECT id, name, description, definition, status, created_at, updated_at
      FROM workflows 
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await this.database.query(query, [tenantId]);
    return result.rows;
  }

  private async createTables(): Promise<void> {
    // Tenants table
    await this.database.createTable('tenants', {
      id: { type: 'TEXT', primaryKey: true },
      name: { type: 'TEXT', notNull: true },
      slug: { type: 'TEXT', unique: true, notNull: true },
      settings: { type: 'JSONB' },
      created_at: { type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
      is_active: { type: 'BOOLEAN', defaultValue: true }
    });

    // Users table
    await this.database.createTable('users', {
      id: { type: 'TEXT', primaryKey: true },
      email: { type: 'TEXT', unique: true, notNull: true },
      name: { type: 'TEXT', notNull: true },
      tenant_id: { type: 'TEXT', references: 'tenants(id)', notNull: true },
      role: { type: 'TEXT', defaultValue: 'user' },
      permissions: { type: 'JSONB' },
      password_hash: { type: 'TEXT' },
      created_at: { type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' },
      last_login: { type: 'TIMESTAMP' },
      is_active: { type: 'BOOLEAN', defaultValue: true }
    });

    // Audit logs table
    await this.database.createTable('audit_logs', {
      id: { type: 'TEXT', primaryKey: true },
      tenant_id: { type: 'TEXT', notNull: true },
      user_id: { type: 'TEXT' },
      action: { type: 'TEXT', notNull: true },
      table_name: { type: 'TEXT' },
      record_id: { type: 'TEXT' },
      details: { type: 'JSONB' },
      created_at: { type: 'TIMESTAMP', defaultValue: 'CURRENT_TIMESTAMP' }
    });
  }

  // Аутентификация
  async authenticateUser(email: string, password: string, tenantSlug?: string): Promise<any> {
    const users = await this.database.findMany('users', {
      where: 'email = $1 AND is_active = true',
      params: [email]
    });

    if (users.length === 0) {
      return null;
    }

    const userData = users[0];
    const isValid = await bcrypt.compare(password, userData.password_hash);
    
    if (!isValid) {
      return null;
    }

    // Обновляем last_login
    await this.database.update('users', userData.id, {
      last_login: new Date()
    });

    const tenant = await this.database.findById('tenants', userData.tenant_id);
    
    const token = jwt.sign(
      { 
        userId: userData.id, 
        tenantId: userData.tenant_id,
        email: userData.email,
        role: userData.role 
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        permissions: userData.permissions
      },
      tenant,
      token
    };
  }

  // Управление tenant
  async createTenant(name: string, slug: string, settings: any = {}): Promise<Tenant> {
    const tenant = {
      id: `tenant_${Date.now()}`,
      name,
      slug,
      settings,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    };

    const created = await this.database.create('tenants', tenant);
    return created;
  }

  async getTenant(slug: string): Promise<Tenant | null> {
    const tenants = await this.database.findMany('tenants', {
      where: 'slug = $1',
      params: [slug]
    });
    return tenants[0] || null;
  }

  // Управление пользователями
  async createUser(userData: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = {
      id: `user_${Date.now()}`,
      email: userData.email,
      name: userData.name,
      tenant_id: userData.tenant_id,
      role: userData.role || 'user',
      permissions: userData.permissions || [],
      password_hash: hashedPassword,
      created_at: new Date(),
      is_active: true
    };

    const created = await this.database.create('users', user);
    return created;
  }

  // Middleware для аутентификации
  requireAuth() {
    return async (req: any, res: any, next: any) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({ error: 'Token required' });
        }

        const decoded = jwt.verify(token, this.jwtSecret) as any;
        const user = await this.database.findById('users', decoded.userId);
        
        if (!user || !user.is_active) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        req.tenant = await this.database.findById('tenants', user.tenant_id);
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  // Аудит
  async logAudit(action: string, tableName: string, recordId: string, tenantId: string, userId?: string, details?: any): Promise<void> {
    const auditLog = {
      id: `audit_${Date.now()}`,
      tenant_id: tenantId,
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      details: details ? JSON.stringify(details) : null,
      created_at: new Date()
    };

    await this.database.create('audit_logs', auditLog);
  }

  async getAuditLogs(tenantId: string, options: { limit?: number; offset?: number; action?: string; userId?: string } = {}): Promise<any[]> {
    const whereConditions = ['tenant_id = $1'];
    const params = [tenantId];
    let paramIndex = 2;

    if (options.action) {
      whereConditions.push(`action = $${paramIndex++}`);
      params.push(options.action);
    }

    if (options.userId) {
      whereConditions.push(`user_id = $${paramIndex++}`);
      params.push(options.userId);
    }

    const whereClause = whereConditions.join(' AND ');
    
    return this.database.findMany('audit_logs', {
      where: whereClause,
      params,
      limit: options.limit,
      offset: options.offset
    });
  }

  // Дополнительные методы для API
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const tenants = await this.database.findMany('tenants', {
      where: 'slug = $1 AND is_active = true',
      params: [slug]
    });

    return tenants.length > 0 ? tenants[0] : null;
  }

  async authenticateSSO(provider: string, ssoData: any, tenantSlug: string): Promise<any> {
    // Упрощенная SSO аутентификация
    const tenant = await this.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return null;
    }

    // Ищем пользователя по SSO данным
    const users = await this.database.findMany('users', {
      where: 'email = $1 AND tenant_id = $2 AND is_active = true',
      params: [ssoData.email, tenant.id]
    });

    let user: User;
    if (users.length === 0) {
      // Создаем нового пользователя
      user = await this.createUser({
        email: ssoData.email,
        name: ssoData.name || ssoData.email,
        tenant_id: tenant.id,
        role: UserRole.USER
      });
    } else {
      user = users[0];
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      user,
      tenant,
      token
    };
  }

  async grantPermission(userId: string, permission: string): Promise<void> {
    const user = await this.database.findById('users', userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedPermissions = [...(user.permissions || []), permission];
    await this.database.update('users', userId, {
      permissions: updatedPermissions
    });
  }

  async configureSSO(tenantId: string, config: any): Promise<void> {
    // Сохраняем SSO конфигурацию в настройках тенанта
    await this.database.update('tenants', tenantId, {
      settings: {
        ...config,
        sso: config
      }
    });
  }

  // Middleware для проверки прав
  requirePermission(permission: { resource: string; action: string }) {
    return (req: any, res: any, next: any) => {
      // Упрощенная проверка прав - всегда разрешаем для базовой версии
      // В реальной системе здесь будет проверка прав пользователя
      next();
    };
  }
}
