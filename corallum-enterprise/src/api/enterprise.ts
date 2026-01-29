// Enterprise API Routes с Multi-tenant, SSO, RBAC
import { Router } from 'express';
import { z } from 'zod';
import type { EnterpriseManager } from '../enterprise/EnterpriseManager';
import { UserRole } from '../enterprise/EnterpriseManager';
import * as express from 'express';
import { validate } from './_validation/validate';
import { createMultiTenantMiddleware, type TenantRequest } from '../middleware/MultiTenantMiddleware';

// Расширяем тип Request для tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        slug: string;
        settings: any;
        is_active: boolean;
      };
      tenantId?: string;
    }
  }
}

export default function createEnterpriseRouter(enterprise: EnterpriseManager, db: any) {
const router = Router();
const tenantMiddleware = createMultiTenantMiddleware(db);

const tenantSlugParamsSchema = z.object({
  slug: z.string().min(1)
});

const createTenantBodySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  settings: z.any().optional()
});

const loginBodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});

const ssoProviderParamsSchema = z.object({
  provider: z.string().min(1)
});

const createUserBodySchema = z.object({
  email: z.string().min(1),
  name: z.string().min(1),
  role: z.string().optional(),
  permissions: z.array(z.string()).optional()
});

const userIdParamsSchema = z.object({
  userId: z.string().min(1)
});

const grantPermissionBodySchema = z.object({
  permission: z.string().min(1)
});

const configureSSOBodySchema = z.object({
  provider: z.string().min(1),
  config: z.any().optional(),
  enabled: z.boolean().optional()
});

const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  userId: z.string().min(1).optional(),
  action: z.string().min(1).optional()
});

const updateSettingsBodySchema = z.object({
  settings: z.any()
});

// Tenant management
router.post('/tenants', tenantMiddleware.extractTenant, async (req: TenantRequest, res) => {
  console.log('POST /tenants body:', req.body);
  try {
    const { name, slug, settings } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug required' });
    }

    const tenant = await enterprise.createTenant(name, slug, settings);
    res.json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tenants/:slug', tenantMiddleware.extractTenant, validate({ params: tenantSlugParamsSchema }), async (req: TenantRequest, res) => {
  try {
    const tenant = await enterprise.getTenantBySlug(req.params.slug);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Workflows with tenant isolation
router.get('/workflows', tenantMiddleware.extractTenant, tenantMiddleware.requireTenant, async (req: TenantRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const workflows = await enterprise.getTenantWorkflows(req.tenantId);
    res.json({ success: true, data: workflows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/workflows', tenantMiddleware.extractTenant, tenantMiddleware.requireTenant, async (req: TenantRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const { name, description, definition } = req.body;
    
    if (!name || !definition) {
      return res.status(400).json({ error: 'Name and definition required' });
    }
    
    // В реальном приложении здесь будет ID из JWT токена
    const createdBy = 'user001';
    
    const workflow = await enterprise.createWorkflowForTenant(
      req.tenantId,
      name,
      description || '',
      definition,
      createdBy
    );
    
    res.json({ success: true, data: workflow });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Authentication
router.post('/auth/login', tenantMiddleware.extractTenant, validate({ body: loginBodySchema }), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Строгая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Проверка на SQL injection паттерны
    const sqlPatterns = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'drop', 'delete', 'insert', 'update'];
    const emailLower = email.toLowerCase();
    const passwordLower = password.toLowerCase();
    
    for (const pattern of sqlPatterns) {
      if (emailLower.includes(pattern) || passwordLower.includes(pattern)) {
        return res.status(400).json({ error: 'Invalid input format' });
      }
    }

    // Проверка на XSS паттерны
    const xssPatterns = ['<script', 'javascript:', 'onerror=', 'onload=', '<img', '<iframe'];
    for (const pattern of xssPatterns) {
      if (emailLower.includes(pattern) || passwordLower.includes(pattern)) {
        return res.status(400).json({ error: 'Invalid input format' });
      }
    }

    // Ограничение длины
    if (email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: 'Input too long' });
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SSO Authentication
router.post('/auth/sso/:provider', extractTenant, validate({ params: ssoProviderParamsSchema }), async (req, res) => {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User management (requires authentication)
router.post('/users', 
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'users', action: 'create' }),
  validate({ body: createUserBodySchema }),
  async (req, res) => {
    try {
      const userData = {
        ...req.body,
        tenant_id: req.user.tenantId
      };

      const user = await enterprise.createUser(userData);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/users', 
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'users', action: 'read' }),
  async (req, res) => {
    try {
      // Get users for current tenant
      const client = (enterprise as any).db;
      const result = await client.query(
        'SELECT id, email, name, role, permissions, created_at, last_login, is_active FROM users WHERE tenant_id = $1',
        [req.user.tenantId]
      );

      res.json({ 
        success: true, 
        data: result.rows.map(row => ({
          ...row,
          permissions: row.permissions || []
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Permission management
router.post('/users/:userId/permissions',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'users', action: 'manage_permissions' }),
  validate({ params: userIdParamsSchema, body: grantPermissionBodySchema }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { permission } = req.body;

      await enterprise.grantPermission(userId, permission);
      res.json({ success: true, message: 'Permission granted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// SSO Configuration
router.post('/sso/configure',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'sso', action: 'configure' }),
  validate({ body: configureSSOBodySchema }),
  async (req, res) => {
    try {
      const { provider, config, enabled } = req.body;
      
      await enterprise.configureSSO(req.user.tenantId, {
        provider,
        config,
        enabled: enabled !== false
      });

      res.json({ success: true, message: 'SSO configured' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Audit logs
router.get('/audit',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'audit', action: 'read' }),
  validate({ query: auditQuerySchema }),
  async (req, res) => {
    try {
      const { limit = 50, offset = 0, userId, action } = req.query;
      
      const logs = await enterprise.getAuditLogs(req.user.tenantId, {
        userId: userId as string,
        action: action as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Role management
router.get('/roles', enterprise.requireAuth(), (req, res) => {
  res.json({
    success: true,
    data: Object.values(UserRole).map(role => ({
      name: role,
      description: getRoleDescription(role)
    }))
  });
});

// Tenant settings
router.get('/settings',
  enterprise.requireAuth(),
  async (req, res) => {
    try {
      const tenant = await enterprise.getTenant(req.user.tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json({ success: true, data: tenant.settings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.put('/settings',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'settings', action: 'update' }),
  validate({ body: updateSettingsBodySchema }),
  async (req, res) => {
    try {
      const { settings } = req.body;
      
      const client = (enterprise as any).db;
      await client.query(
        'UPDATE tenants SET settings = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(settings), req.user.tenantId]
      );

      res.json({ success: true, message: 'Settings updated' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Helper function
function getRoleDescription(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Full access to all resources';
    case UserRole.WORKFLOW_ADMIN:
      return 'Can manage workflows and executions';
    case UserRole.USER:
      return 'Can create and execute workflows';
    case UserRole.VIEWER:
      return 'Read-only access to workflows';
    default:
      return 'Unknown role';
  }
}

return router;
}
