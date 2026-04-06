-- 500/450 Admin 只读基线：DSAR 请求台账、内部工具执行审计（04 §3.5、70）
-- 完整审批/导出签名/事件轨迹仍以 500 阶段为准。

CREATE TABLE IF NOT EXISTS compliance_data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_ref TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    request_type TEXT NOT NULL,
    status TEXT NOT NULL,
    due_at TIMESTAMPTZ,
    sla_hours INT,
    jurisdiction TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT compliance_data_requests_type_check CHECK (request_type IN ('export', 'erasure')),
    CONSTRAINT compliance_data_requests_status_check CHECK (status IN (
        'open', 'in_progress', 'completed', 'rejected', 'cancelled'
    ))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_compliance_data_requests_ref
    ON compliance_data_requests(request_ref);

CREATE INDEX IF NOT EXISTS idx_compliance_data_requests_due
    ON compliance_data_requests(due_at NULLS LAST, created_at DESC);

INSERT INTO compliance_data_requests (
    request_ref,
    subject_id,
    request_type,
    status,
    due_at,
    sla_hours,
    jurisdiction,
    notes
) VALUES
    (
        'DSAR-SEED-001',
        '00000000-0000-0000-0000-000000000001',
        'export',
        'open',
        now() + interval '30 days',
        720,
        'unspecified',
        'seed row; replace with real DSAR workflow'
    )
ON CONFLICT (request_ref) DO NOTHING;

CREATE TABLE IF NOT EXISTS internal_tool_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id TEXT NOT NULL,
    tool_name TEXT,
    action_code TEXT NOT NULL,
    actor_id TEXT,
    approval_request_id UUID,
    resource_ref TEXT,
    input_digest TEXT,
    result_digest TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_tool_audit_created
    ON internal_tool_audit_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_tool_audit_tool
    ON internal_tool_audit_events(tool_id, created_at DESC);

INSERT INTO internal_tool_audit_events (
    tool_id,
    tool_name,
    action_code,
    actor_id,
    approval_request_id,
    resource_ref,
    input_digest,
    result_digest
) VALUES
    (
        'registry.readonly',
        'Registry snapshot',
        'inspect',
        NULL,
        NULL,
        'config:baseline',
        NULL,
        NULL
    );
