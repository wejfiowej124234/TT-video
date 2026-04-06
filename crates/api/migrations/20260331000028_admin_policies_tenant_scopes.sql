-- Admin 数据策略与租户/区域作用域台账（04 §3.5、70）；发布流 POST …/policies/:id/publish 仍待后续阶段。

CREATE TABLE IF NOT EXISTS admin_data_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_code TEXT NOT NULL,
    scope_type TEXT NOT NULL,
    scope_expr TEXT,
    binding_role TEXT NOT NULL,
    binding_resources TEXT,
    status TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT admin_data_policies_status_check CHECK (status IN ('draft', 'active', 'deprecated'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_data_policies_code ON admin_data_policies(policy_code);

CREATE INDEX IF NOT EXISTS idx_admin_data_policies_status ON admin_data_policies(status, updated_at DESC);

INSERT INTO admin_data_policies (
    policy_code,
    scope_type,
    scope_expr,
    binding_role,
    binding_resources,
    status,
    version
) VALUES
    (
        'baseline.orders.read',
        'resource',
        'orders:*',
        'tourist',
        'read',
        'active',
        1
    ),
    (
        'baseline.orders.write_own',
        'resource',
        'orders:own',
        'tourist',
        'create,cancel_pending',
        'active',
        1
    ),
    (
        'baseline.evidence.upload',
        'resource',
        'evidence:order_participant',
        'tourist,guide',
        'upload',
        'active',
        1
    )
ON CONFLICT (policy_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_tenant_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_key TEXT NOT NULL,
    region_code TEXT NOT NULL,
    scope_class TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT admin_tenant_scopes_status_check CHECK (status IN ('draft', 'active', 'sunset')),
    CONSTRAINT admin_tenant_scopes_class_check CHECK (scope_class IN (
        'data_residency', 'ops', 'feature', 'network'
    ))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_tenant_scopes_key_region_class
    ON admin_tenant_scopes(tenant_key, region_code, scope_class);

CREATE INDEX IF NOT EXISTS idx_admin_tenant_scopes_tenant ON admin_tenant_scopes(tenant_key, updated_at DESC);

INSERT INTO admin_tenant_scopes (tenant_key, region_code, scope_class, status, notes) VALUES
    ('default', 'global', 'data_residency', 'active', 'seed: single-tenant baseline; replace for multi-region'),
    ('default', 'global', 'ops', 'active', 'seed: operational scope placeholder')
ON CONFLICT (tenant_key, region_code, scope_class) DO NOTHING;
