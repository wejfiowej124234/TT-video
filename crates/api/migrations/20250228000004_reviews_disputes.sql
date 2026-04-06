-- 企业级审计 P2 D1/D2：reviews、disputes 落库（04 附录 DDL §9.5、§9.6）
-- reviews（评价）
CREATE TABLE IF NOT EXISTS reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id),
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    reviewee_id         UUID NOT NULL REFERENCES users(id),
    score               SMALLINT NOT NULL,
    weight              NUMERIC NOT NULL DEFAULT 1,
    comment             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews (order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews (reviewee_id);

-- disputes（争议）
CREATE TABLE IF NOT EXISTS disputes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL UNIQUE REFERENCES orders(id),
    status              TEXT NOT NULL,
    evidence_hashes     JSONB NOT NULL DEFAULT '[]',
    arbitrator_id       UUID REFERENCES users(id),
    refund_ratio        NUMERIC,
    slash_guide         BOOLEAN,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    arb_fee_paid        TEXT,
    dispute_sequence    INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes (order_id);
