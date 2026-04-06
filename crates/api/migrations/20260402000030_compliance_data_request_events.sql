-- DSAR 事件轨迹台账（500、04 §3.5）；与 compliance_data_requests 外键关联。

CREATE TABLE IF NOT EXISTS compliance_data_request_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES compliance_data_requests(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_detail TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_dre_request_occurred
    ON compliance_data_request_events(request_id, occurred_at DESC);

INSERT INTO compliance_data_request_events (request_id, event_type, event_detail)
SELECT id, 'created', 'seed event; replace with workflow emits'
FROM compliance_data_requests
WHERE request_ref = 'DSAR-SEED-001'
LIMIT 1;
