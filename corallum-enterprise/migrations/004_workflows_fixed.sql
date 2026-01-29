-- Создаем таблицу workflows с поддержкой multi-tenant (правильная версия)

CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для tenant isolation и производительности
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_status ON workflows(tenant_id, status);

-- Row Level Security
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policy для tenant isolation
CREATE POLICY tenant_isolation_workflows ON workflows
    FOR ALL TO corallum
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Вставляем default tenant если нет
INSERT INTO tenants (id, slug, name, settings, is_active, created_at, updated_at) 
VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'default', 'Default Tenant', '{"theme": "light", "timezone": "UTC"}', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;
