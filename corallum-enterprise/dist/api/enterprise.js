"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createEnterpriseRouter;
// Enterprise API Routes с Multi-tenant, SSO, RBAC
const express_1 = require("express");
const zod_1 = require("zod");
const EnterpriseManager_1 = require("../enterprise/EnterpriseManager");
const validate_1 = require("./_validation/validate");
function createEnterpriseRouter(enterprise) {
    const router = (0, express_1.Router)();
    const tenantSlugParamsSchema = zod_1.z.object({
        slug: zod_1.z.string().min(1)
    });
    const createTenantBodySchema = zod_1.z.object({
        name: zod_1.z.string().min(1),
        slug: zod_1.z.string().min(1),
        settings: zod_1.z.any().optional()
    });
    const loginBodySchema = zod_1.z.object({
        email: zod_1.z.string().min(1),
        password: zod_1.z.string().min(1)
    });
    const ssoProviderParamsSchema = zod_1.z.object({
        provider: zod_1.z.string().min(1)
    });
    const createUserBodySchema = zod_1.z.object({
        email: zod_1.z.string().min(1),
        name: zod_1.z.string().min(1),
        role: zod_1.z.string().optional(),
        permissions: zod_1.z.array(zod_1.z.string()).optional()
    }).passthrough();
    const userIdParamsSchema = zod_1.z.object({
        userId: zod_1.z.string().min(1)
    });
    const grantPermissionBodySchema = zod_1.z.object({
        permission: zod_1.z.string().min(1)
    });
    const configureSSOBodySchema = zod_1.z.object({
        provider: zod_1.z.string().min(1),
        config: zod_1.z.any().optional(),
        enabled: zod_1.z.boolean().optional()
    });
    const auditQuerySchema = zod_1.z.object({
        limit: zod_1.z.coerce.number().int().min(1).max(200).default(50),
        offset: zod_1.z.coerce.number().int().min(0).default(0),
        userId: zod_1.z.string().min(1).optional(),
        action: zod_1.z.string().min(1).optional()
    });
    const updateSettingsBodySchema = zod_1.z.object({
        settings: zod_1.z.any()
    });
    // Middleware для извлечения tenant из URL или subdomain
    const extractTenant = async (req, res, next) => {
        try {
            // Извлекаем tenant из URL параметра или subdomain
            const tenantSlug = req.params.tenant || req.headers['x-tenant-slug'];
            if (!tenantSlug) {
                return res.status(400).json({ error: 'Tenant required' });
            }
            const tenant = await enterprise.getTenantBySlug(tenantSlug);
            if (!tenant || !tenant.is_active) {
                return res.status(404).json({ error: 'Tenant not found' });
            }
            req.tenant = tenant;
            next();
        }
        catch (error) {
            res.status(500).json({ error: 'Tenant extraction failed' });
        }
    };
    // Tenant management
    router.post('/tenants', async (req, res) => {
        console.log('POST /tenants body:', req.body);
        try {
            const { name, slug, settings } = req.body;
            if (!name || !slug) {
                return res.status(400).json({ error: 'Name and slug required' });
            }
            const tenant = await enterprise.createTenant(name, slug, settings);
            res.json({ success: true, data: tenant });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    router.get('/tenants/:slug', (0, validate_1.validate)({ params: tenantSlugParamsSchema }), async (req, res) => {
        try {
            const tenant = await enterprise.getTenantBySlug(req.params.slug);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }
            res.json({ success: true, data: tenant });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Authentication
    router.post('/auth/login', extractTenant, (0, validate_1.validate)({ body: loginBodySchema }), async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password required' });
            }
            const result = await enterprise.authenticateUser(email, password, req.tenant.slug);
            if (!result) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            res.json({
                success: true,
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        name: result.user.name,
                        role: result.user.role,
                        permissions: result.user.permissions
                    },
                    token: result.token,
                    tenant: req.tenant
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // SSO Authentication
    router.post('/auth/sso/:provider', extractTenant, (0, validate_1.validate)({ params: ssoProviderParamsSchema }), async (req, res) => {
        try {
            const { provider } = req.params;
            const ssoData = req.body;
            const result = await enterprise.authenticateSSO(provider, ssoData, req.tenant.slug);
            if (!result) {
                return res.status(401).json({ error: 'SSO authentication failed' });
            }
            res.json({
                success: true,
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        name: result.user.name,
                        role: result.user.role,
                        permissions: result.user.permissions
                    },
                    token: result.token,
                    tenant: req.tenant
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // User management (requires authentication)
    router.post('/users', enterprise.requireAuth(), enterprise.requirePermission({ resource: 'users', action: 'create' }), (0, validate_1.validate)({ body: createUserBodySchema }), async (req, res) => {
        try {
            const userData = {
                ...req.body,
                tenant_id: req.user.tenantId
            };
            const user = await enterprise.createUser(userData);
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    router.get('/users', enterprise.requireAuth(), enterprise.requirePermission({ resource: 'users', action: 'read' }), async (req, res) => {
        try {
            // Get users for current tenant
            const client = enterprise.db;
            const result = await client.query('SELECT id, email, name, role, permissions, created_at, last_login, is_active FROM users WHERE tenant_id = $1', [req.user.tenantId]);
            res.json({
                success: true,
                data: result.rows.map(row => ({
                    ...row,
                    permissions: row.permissions || []
                }))
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Permission management
    router.post('/users/:userId/permissions', enterprise.requireAuth(), enterprise.requirePermission({ resource: 'users', action: 'manage_permissions' }), (0, validate_1.validate)({ params: userIdParamsSchema, body: grantPermissionBodySchema }), async (req, res) => {
        try {
            const { userId } = req.params;
            const { permission } = req.body;
            await enterprise.grantPermission(userId, permission);
            res.json({ success: true, message: 'Permission granted' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // SSO Configuration
    router.post('/sso/configure', enterprise.requireAuth(), enterprise.requirePermission({ resource: 'sso', action: 'configure' }), (0, validate_1.validate)({ body: configureSSOBodySchema }), async (req, res) => {
        try {
            const { provider, config, enabled } = req.body;
            await enterprise.configureSSO(req.user.tenantId, {
                provider,
                config,
                enabled: enabled !== false
            });
            res.json({ success: true, message: 'SSO configured' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Audit logs
    router.get('/audit', enterprise.requireAuth(), enterprise.requirePermission({ resource: 'audit', action: 'read' }), (0, validate_1.validate)({ query: auditQuerySchema }), async (req, res) => {
        try {
            const { limit = 50, offset = 0, userId, action } = req.query;
            const logs = await enterprise.getAuditLogs(req.user.tenantId, {
                userId: userId,
                action: action,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            res.json({ success: true, data: logs });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Role management
    router.get('/roles', enterprise.requireAuth(), (req, res) => {
        res.json({
            success: true,
            data: Object.values(EnterpriseManager_1.UserRole).map(role => ({
                name: role,
                description: getRoleDescription(role)
            }))
        });
    });
    // Tenant settings
    router.get('/settings', enterprise.requireAuth(), async (req, res) => {
        try {
            const tenant = await enterprise.getTenant(req.user.tenantId);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }
            res.json({ success: true, data: tenant.settings });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    router.put('/settings', enterprise.requireAuth(), enterprise.requirePermission({ resource: 'settings', action: 'update' }), (0, validate_1.validate)({ body: updateSettingsBodySchema }), async (req, res) => {
        try {
            const { settings } = req.body;
            const client = enterprise.db;
            await client.query('UPDATE tenants SET settings = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(settings), req.user.tenantId]);
            res.json({ success: true, message: 'Settings updated' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Helper function
    function getRoleDescription(role) {
        switch (role) {
            case EnterpriseManager_1.UserRole.ADMIN:
                return 'Full access to all resources';
            case EnterpriseManager_1.UserRole.WORKFLOW_ADMIN:
                return 'Can manage workflows and executions';
            case EnterpriseManager_1.UserRole.USER:
                return 'Can create and execute workflows';
            case EnterpriseManager_1.UserRole.VIEWER:
                return 'Read-only access to workflows';
            default:
                return 'Unknown role';
        }
    }
    return router;
}
//# sourceMappingURL=enterprise.js.map