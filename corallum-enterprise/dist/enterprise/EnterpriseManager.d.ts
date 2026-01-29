import DatabaseManager from '../core/database/DatabaseManager';
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    settings: Record<string, any>;
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
}
export declare enum UserRole {
    ADMIN = "admin",
    USER = "user",
    MANAGER = "manager",
    WORKFLOW_ADMIN = "workflow_admin",
    VIEWER = "viewer"
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
export declare class EnterpriseManager {
    private database;
    private jwtSecret;
    constructor(database: DatabaseManager, jwtSecret: string);
    initialize(): Promise<void>;
    private createTables;
    authenticateUser(email: string, password: string, tenantSlug?: string): Promise<any>;
    createTenant(name: string, slug: string, settings?: any): Promise<Tenant>;
    getTenant(slug: string): Promise<Tenant | null>;
    createUser(userData: any): Promise<User>;
    requireAuth(): (req: any, res: any, next: any) => Promise<any>;
    logAudit(action: string, tableName: string, recordId: string, tenantId: string, userId?: string, details?: any): Promise<void>;
    getAuditLogs(tenantId: string, options?: {
        limit?: number;
        offset?: number;
        action?: string;
        userId?: string;
    }): Promise<any[]>;
    getTenantBySlug(slug: string): Promise<Tenant | null>;
    authenticateSSO(provider: string, ssoData: any, tenantSlug: string): Promise<any>;
    grantPermission(userId: string, permission: string): Promise<void>;
    configureSSO(tenantId: string, config: any): Promise<void>;
    requirePermission(permission: {
        resource: string;
        action: string;
    }): (req: any, res: any, next: any) => void;
}
//# sourceMappingURL=EnterpriseManager.d.ts.map