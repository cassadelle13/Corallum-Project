-- Упрощенная Multi-Tenant миграция для существующей базы

-- Обновляем таблицу workflows для поддержки tenant_id
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Создаем индексы для tenant isolation
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON workflows(tenant_id);

-- Вставляем default tenant если нет
INSERT INTO tenants (id, slug, name, settings, is_active, created_at, updated_at) 
VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'default', 'Default Tenant', '{"theme": "light", "timezone": "UTC"}', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Обновляем существующие workflows для default tenant
UPDATE workflows SET tenant_id = '550e8400-e29b-41d4-a716-446655440000' WHERE tenant_id IS NULL;

-- Делаем tenant_id NOT NULL после обновления
ALTER TABLE workflows ALTER COLUMN tenant_id SET NOT NULL;
