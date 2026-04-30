-- Auth/Wallet hardening indexes:
-- speed up hot-path lookups for active email tokens and wallet verification status.

CREATE INDEX IF NOT EXISTS auth_email_tokens_active_hash_purpose_idx
    ON auth_email_tokens (token_hash, purpose)
    WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS auth_email_tokens_active_user_purpose_created_idx
    ON auth_email_tokens (user_id, purpose, created_at DESC)
    WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS wallet_verify_challenges_active_id_user_idx
    ON wallet_verify_challenges (id, user_id)
    WHERE consumed_at IS NULL AND verified_at IS NULL;

CREATE INDEX IF NOT EXISTS wallet_verify_challenges_latest_verified_idx
    ON wallet_verify_challenges (user_id, verified_at DESC)
    WHERE verified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS wallet_verify_challenges_user_wallet_verified_idx
    ON wallet_verify_challenges (user_id, lower(wallet_address), verified_at DESC)
    WHERE verified_at IS NOT NULL;

