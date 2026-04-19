-- 91 §八：event_log 分轨（track_type）+ chain_id；防同一 tx 跨 A/B/Escrow 等双计。
ALTER TABLE event_log
    ADD COLUMN IF NOT EXISTS track_type TEXT NOT NULL DEFAULT 'legacy_backfill';

COMMENT ON COLUMN event_log.track_type IS 'Rail: A | B | Escrow | Staking | Vault | legacy_backfill (pre-migration rows)';

ALTER TABLE event_log DROP CONSTRAINT IF EXISTS event_log_track_type_check;
ALTER TABLE event_log ADD CONSTRAINT event_log_track_type_check CHECK (
    track_type IN ('A', 'B', 'Escrow', 'Staking', 'Vault', 'legacy_backfill')
);

CREATE INDEX IF NOT EXISTS idx_event_log_chain_tx_track ON event_log (chain_id, tx_hash, track_type);
