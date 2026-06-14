-- G-S6 · Airdrop snapshot audit columns（链下 · 无链上发放）

ALTER TABLE airdrop_snapshots
    ADD COLUMN IF NOT EXISTS referral_invites BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS referral_points_awarded BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS early_bird_stage INT,
    ADD COLUMN IF NOT EXISTS early_bird_multiplier NUMERIC(4, 2),
    ADD COLUMN IF NOT EXISTS growth_registration_rank BIGINT,
    ADD COLUMN IF NOT EXISTS growth_fraud_status TEXT NOT NULL DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS eligible BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE airdrop_campaigns
    ADD COLUMN IF NOT EXISTS snapshot_user_count BIGINT,
    ADD COLUMN IF NOT EXISTS eligible_points_total BIGINT,
    ADD COLUMN IF NOT EXISTS calculation_version INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_airdrop_snapshots_campaign_eligible
    ON airdrop_snapshots (campaign_id, eligible);

CREATE INDEX IF NOT EXISTS idx_airdrop_allocations_campaign
    ON airdrop_allocations (campaign_id);
