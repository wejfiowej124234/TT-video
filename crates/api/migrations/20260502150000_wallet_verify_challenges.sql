-- Wallet ownership verification challenges (EIP-191 personal_sign)
CREATE TABLE IF NOT EXISTS wallet_verify_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    nonce TEXT NOT NULL,
    message TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_verify_challenges_user_wallet_created
    ON wallet_verify_challenges (user_id, wallet_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_verify_challenges_expires
    ON wallet_verify_challenges (expires_at);

