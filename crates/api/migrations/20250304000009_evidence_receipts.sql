-- 证据回执落库（01 §6、04 需落库实体 evidence_receipts；50-EV1）
CREATE TABLE IF NOT EXISTS evidence_receipts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id),
    uploader_id         UUID NOT NULL REFERENCES users(id),
    content_hash        VARCHAR(128) NOT NULL,
    schema_version      VARCHAR(64),
    prompt_version      VARCHAR(64),
    snapshot_hash       VARCHAR(128),
    quote_hash          VARCHAR(128),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evidence_receipts_order ON evidence_receipts (order_id);
