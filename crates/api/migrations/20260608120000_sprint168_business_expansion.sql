-- Sprint 168-B · BE-FRD-01 fraud-scan runs + BE-GCM-01 country market launches

CREATE TABLE IF NOT EXISTS growth_fraud_scan_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    trigger TEXT NOT NULL CHECK (trigger IN ('register', 'manual', 'scheduled')),
    idempotency_key TEXT NOT NULL UNIQUE,
    outcome TEXT NOT NULL CHECK (outcome IN ('clean', 'signaled', 'auto_action')),
    rules_fired JSONB NOT NULL DEFAULT '[]'::jsonb,
    context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_fraud_scan_runs_user
    ON growth_fraud_scan_runs (subject_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_growth_fraud_scan_runs_ip_window
    ON growth_fraud_scan_runs ((context_snapshot ->> 'client_ip'), created_at DESC);

CREATE TABLE IF NOT EXISTS country_market_launches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_iso CHAR(2) NOT NULL UNIQUE,
    catalog_country_id UUID REFERENCES catalog_countries (id) ON DELETE SET NULL,
    phase TEXT NOT NULL DEFAULT 'intake'
        CHECK (
            phase IN (
                'intake',
                'legal',
                'catalog',
                'geo',
                'steward',
                'publish',
                'live',
                'archived'
            )
        ),
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    owner_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    launched_at TIMESTAMPTZ,
    evidence_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_country_market_launches_phase
    ON country_market_launches (phase);
