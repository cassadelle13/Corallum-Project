// Multi-Tenant Middleware для Corallum Enterprise
import { Request, Response, NextFunction } from 'express';
import { DatabaseManager } from '../core/database/DatabaseManager';

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    slug: string;
    name: string;
    settings: any;
    is_active: boolean;
  };
  tenantId?: string;
}

export class MultiTenantMiddleware {
  constructor(private db: DatabaseManager) {}

  // Extract tenant from request
  extractTenant = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Способы извлечения tenant:
      // 1. From subdomain (tenant1.corallum.com)
      // 2. From header (X-Tenant-Slug)
      // 3. From JWT token
      // 4. From request body (for API calls)

      let tenantSlug: string | null = null;

      // Method 1: Subdomain
      const host = req.headers.host || '';
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'localhost' && subdomain !== '127-0-0-1') {
        tenantSlug = subdomain;
      }

      // Method 2: Header
      if (!tenantSlug && req.headers['x-tenant-slug']) {
        tenantSlug = req.headers['x-tenant-slug'] as string;
      }

      // Method 3: JWT token (если реализован)
      if (!tenantSlug && req.headers.authorization) {
        try {
          const token = req.headers.authorization.replace('Bearer ', '');
          // JWT decode logic здесь
          // const decoded = jwt.decode(token);
          // tenantSlug = decoded?.tenantSlug;
        } catch (error) {
          // Ignore JWT errors for now
        }
      }

      // Method 4: Request body (для tenant creation)
      if (!tenantSlug && req.body && req.body.tenantSlug) {
        tenantSlug = req.body.tenantSlug;
      }

      // Fallback to default tenant for development
      if (!tenantSlug) {
        tenantSlug = 'default';
      }

      // Получаем tenant из базы
      const tenantQuery = `
        SELECT id, slug, name, settings, is_active 
        FROM tenants 
        WHERE slug = $1 AND is_active = true
      `;
      
      const tenantResult = await this.db.query(tenantQuery, [tenantSlug]);
      
      if (tenantResult.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Tenant not found',
          tenantSlug 
        });
      }

      const tenant = tenantResult.rows[0];
      req.tenant = tenant;
      req.tenantId = tenant.id;

      // Устанавливаем tenant_id для PostgreSQL Row Level Security
      await this.db.query('SET app.current_tenant_id = $1', [tenant.id]);

      console.log(`🏢 Tenant extracted: ${tenant.slug} (${tenant.id})`);
      next();
    } catch (error) {
      console.error('Tenant extraction error:', error);
      res.status(500).json({ error: 'Tenant extraction failed' });
    }
  };

  // Tenant isolation middleware
  requireTenant = (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({ error: 'Tenant required' });
    }
    next();
  };

  // Tenant admin middleware
  requireTenantAdmin = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Tenant required' });
      }

      // Проверяем, есть ли у пользователя права администратора tenant
      if (req.user && req.user.role === 'admin') {
        return next();
      }

      // Дополнительная проверка в базе данных
      const adminCheck = await this.db.query(
        `SELECT u.role FROM users u 
         WHERE u.tenant_id = $1 AND u.id = $2 AND u.is_active = true`,
        [req.tenantId, req.user?.id]
      );

      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Tenant admin required' });
      }

      next();
    } catch (error) {
      console.error('Tenant admin check error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };

  // Cleanup tenant context
  cleanupTenant = async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Очищаем tenant context после запроса
      await this.db.query('RESET app.current_tenant_id');
      next();
    } catch (error) {
      console.error('Tenant cleanup error:', error);
      next();
    }
  };

  // Tenant statistics
  getTenantStats = async (req: TenantRequest, res: Response) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Tenant required' });
      }

      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND is_active = true) as users_count,
          (SELECT COUNT(*) FROM workflows WHERE tenant_id = $1) as workflows_count,
          (SELECT COUNT(*) FROM workflow_executions WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days') as executions_last_30_days,
          (SELECT COUNT(*) FROM audit_logs WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '7 days') as audit_logs_last_7_days
      `;

      const stats = await this.db.query(statsQuery, [req.tenantId]);
      
      res.json({
        success: true,
        data: {
          tenant: {
            id: req.tenant.id,
            slug: req.tenant.slug,
            name: req.tenant.name,
            settings: req.tenant.settings
          },
          stats: stats.rows[0]
        }
      });
    } catch (error) {
      console.error('Tenant stats error:', error);
      res.status(500).json({ error: 'Failed to get tenant stats' });
    }
  };
}

// Factory function для создания middleware
export function createMultiTenantMiddleware(db: DatabaseManager) {
  const middleware = new MultiTenantMiddleware(db);
  
  return {
    extractTenant: middleware.extractTenant,
    requireTenant: middleware.requireTenant,
    requireTenantAdmin: middleware.requireTenantAdmin,
    cleanupTenant: middleware.cleanupTenant,
    getTenantStats: middleware.getTenantStats
  };
}
