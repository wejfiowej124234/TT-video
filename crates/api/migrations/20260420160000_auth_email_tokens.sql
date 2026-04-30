-- Batch D：邮箱验证与密码重置令牌（仅存 hash；与 04 §三 auth 契约一致）
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;

CREATE TABLE IF NOT EXISTS auth_email_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose TEXT NOT NULL CHECK (purpose IN ('email_verify', 'password_reset')),
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_email_tokens_hash_purpose_idx
    ON auth_email_tokens (token_hash, purpose);

CREATE INDEX IF NOT EXISTS auth_email_tokens_user_purpose_idx
    ON auth_email_tokens (user_id, purpose);

CREATE INDEX IF NOT EXISTS auth_email_tokens_expires_idx
    ON auth_email_tokens (expires_at);
