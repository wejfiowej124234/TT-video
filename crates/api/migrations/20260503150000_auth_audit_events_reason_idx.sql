-- Improve auth audit query latency for failure triage by reason buckets.
CREATE INDEX IF NOT EXISTS idx_auth_audit_events_event_reason_time
    ON auth_audit_events (event_type, reason, created_at DESC)
    WHERE reason IS NOT NULL;

