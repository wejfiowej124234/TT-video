-- 70 · Admin 控制台六角色落库 + 2FA 策略预备（① 本地可验；② staging 矩阵另闸）

CREATE TABLE IF NOT EXISTS admin_console_roles (
    user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    console_role TEXT NOT NULL CHECK (
        console_role IN ('SuperAdmin', 'Ops', 'CS', 'Risk', 'Finance', 'Auditor')
    ),
    assigned_by UUID REFERENCES users (id) ON DELETE SET NULL,
    assignment_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_console_roles_console_role
    ON admin_console_roles (console_role);

CREATE TABLE IF NOT EXISTS admin_security_policies (
    policy_key TEXT PRIMARY KEY,
    policy_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO admin_security_policies (policy_key, policy_value)
VALUES (
    'admin_2fa_policy',
    '{"enforced": false, "required_console_roles": ["SuperAdmin", "Ops"], "implementation_note": "phase_01_prep_not_enforced"}'::jsonb
)
ON CONFLICT (policy_key) DO NOTHING;
