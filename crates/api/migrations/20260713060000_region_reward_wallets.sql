-- Epic RTR L3 · Region Reward Wallet (ROLE-TOKEN-REWARD-MODEL-V1 · DD-2026-07-017)
-- Region → 1..N wallet rows; product rule max_active = 1 (partial unique on active).

CREATE TABLE IF NOT EXISTS region_reward_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    -- Current effective payout address (null until first bind promotes)
    reward_wallet_address TEXT NULL,
    -- none | pending | active | superseded
    reward_wallet_status TEXT NOT NULL DEFAULT 'none',
    pending_reward_wallet TEXT NULL,
    pending_challenge_id UUID NULL,
    -- Signature verification timestamps
    pending_verified_at TIMESTAMPTZ NULL,
    verified_at TIMESTAMPTZ NULL,
    -- When pending_reward_wallet becomes reward_wallet_address
    effective_at TIMESTAMPTZ NULL,
    last_changed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT region_reward_wallets_status_chk CHECK (
        reward_wallet_status IN ('none', 'pending', 'active', 'superseded')
    ),
    CONSTRAINT region_reward_wallets_region_code_chk CHECK (
        char_length(trim(region_code)) BETWEEN 2 AND 16
    )
);

COMMENT ON TABLE region_reward_wallets IS
  'R-TRACK Region Steward Fee payout wallets. Role ≠ Default Wallet ≠ Holder (TTG) wallet.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_region_reward_wallets_active_per_region
    ON region_reward_wallets (region_code)
    WHERE reward_wallet_status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS uq_region_reward_wallets_open_per_region_user
    ON region_reward_wallets (region_code, user_id)
    WHERE reward_wallet_status IN ('none', 'pending', 'active');

CREATE INDEX IF NOT EXISTS idx_region_reward_wallets_user
    ON region_reward_wallets (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_region_reward_wallets_pending_effective
    ON region_reward_wallets (effective_at)
    WHERE reward_wallet_status = 'pending' AND pending_reward_wallet IS NOT NULL;

-- Audit / history of address changes (immutable append)
CREATE TABLE IF NOT EXISTS region_reward_wallet_change_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_reward_wallet_id UUID NOT NULL REFERENCES region_reward_wallets (id) ON DELETE CASCADE,
    region_code TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    from_address TEXT NULL,
    to_address TEXT NULL,
    challenge_id UUID NULL,
    effective_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT region_reward_wallet_change_events_type_chk CHECK (
        event_type IN (
            'request',
            'verify',
            'confirm_pending',
            'promote_active',
            'supersede'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_region_reward_wallet_change_events_wallet
    ON region_reward_wallet_change_events (region_reward_wallet_id, created_at DESC);
