-- B-115-1：区域治理 Snapshot 链下 SSOT（83 RegionShare / Snapshot 叙事）
-- 与 fee_router_routed_events、region_vault_forwarded_events 分表；后续 Claim / 分配登记另卡接线

CREATE TABLE IF NOT EXISTS region_share_snapshot_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    region_id TEXT NOT NULL,
    snapshot_epoch BIGINT NOT NULL,
    recipient_address TEXT NOT NULL,
    snapshot_block_number BIGINT NOT NULL,
    share_balance_u256_hex TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT region_share_snapshot_lines_natural_key UNIQUE (chain_id, region_id, snapshot_epoch, recipient_address)
);

CREATE INDEX IF NOT EXISTS idx_region_share_snapshot_lines_chain_region_epoch
    ON region_share_snapshot_lines (chain_id, region_id, snapshot_epoch DESC);

CREATE INDEX IF NOT EXISTS idx_region_share_snapshot_lines_recipient
    ON region_share_snapshot_lines (recipient_address);
