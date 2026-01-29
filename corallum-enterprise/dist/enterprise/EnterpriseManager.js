"use strict";
// Enterprise Manager - простая рабочая версия
// Использует DatabaseManager для CRUD операций
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseManager = exports.UserRole = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["MANAGER"] = "manager";
    UserRole["WORKFLOW_ADMIN"] = "workflow_admin";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
class EnterpriseManager {
    constructor(database, jwtSecret) {
        this.database = database;
        this.jwtSecret = jwtSecret;
    }
    async initialize() {
        console.log('🏢 Initializing Enterprise Manager...');
        console.log('✅ Enterprise Manager initialized');
    }
    async createTables() {
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
    async authenticateUser(email, password, tenantSlug) {
        const users = await this.database.findMany('users', {
            where: 'email = $1 AND is_active = true',
            params: [email]
        });
        if (users.length === 0) {
            return null;
        }
        const userData = users[0];
        const isValid = await bcrypt_1.default.compare(password, userData.password_hash);
        if (!isValid) {
            return null;
        }
        // Обновляем last_login
        await this.database.update('users', userData.id, {
            last_login: new Date()
        });
        const tenant = await this.database.findById('tenants', userData.tenant_id);
        const token = jsonwebtoken_1.default.sign({
            userId: userData.id,
            tenantId: userData.tenant_id,
            email: userData.email,
            role: userData.role
        }, this.jwtSecret, { expiresIn: '24h' });
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
    async createTenant(name, slug, settings = {}) {
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
    async getTenant(slug) {
        const tenants = await this.database.findMany('tenants', {
            where: 'slug = $1',
            params: [slug]
        });
        return tenants[0] || null;
    }
    // Управление пользователями
    async createUser(userData) {
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 12);
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
        return async (req, res, next) => {
            try {
                const token = req.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    return res.status(401).json({ error: 'Token required' });
                }
                const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
                const user = await this.database.findById('users', decoded.userId);
                if (!user || !user.is_active) {
                    return res.status(401).json({ error: 'Invalid token' });
                }
                req.user = user;
                req.tenant = await this.database.findById('tenants', user.tenant_id);
                next();
            }
            catch (error) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        };
    }
    // Аудит
    async logAudit(action, tableName, recordId, tenantId, userId, details) {
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
    async getAuditLogs(tenantId, options = {}) {
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
    async getTenantBySlug(slug) {
        const tenants = await this.database.findMany('tenants', {
            where: 'slug = $1 AND is_active = true',
            params: [slug]
        });
        return tenants.length > 0 ? tenants[0] : null;
    }
    async authenticateSSO(provider, ssoData, tenantSlug) {
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
        let user;
        if (users.length === 0) {
            // Создаем нового пользователя
            user = await this.createUser({
                email: ssoData.email,
                name: ssoData.name || ssoData.email,
                tenant_id: tenant.id,
                role: UserRole.USER
            });
        }
        else {
            user = users[0];
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            tenantId: user.tenant_id,
            email: user.email,
            role: user.role
        }, this.jwtSecret, { expiresIn: '24h' });
        return {
            user,
            tenant,
            token
        };
    }
    async grantPermission(userId, permission) {
        const user = await this.database.findById('users', userId);
        if (!user) {
            throw new Error('User not found');
        }
        const updatedPermissions = [...(user.permissions || []), permission];
        await this.database.update('users', userId, {
            permissions: updatedPermissions
        });
    }
    async configureSSO(tenantId, config) {
        // Сохраняем SSO конфигурацию в настройках тенанта
        await this.database.update('tenants', tenantId, {
            settings: {
                ...config,
                sso: config
            }
        });
    }
    // Middleware для проверки прав
    requirePermission(permission) {
        return (req, res, next) => {
            // Упрощенная проверка прав - всегда разрешаем для базовой версии
            // В реальной системе здесь будет проверка прав пользователя
            next();
        };
    }
}
exports.EnterpriseManager = EnterpriseManager;
//# sourceMappingURL=EnterpriseManager.js.map