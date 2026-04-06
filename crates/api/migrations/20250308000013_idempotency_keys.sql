-- 51-DB1：API/队列幂等键（01 §10 #14、04 附录 §7、04-数据库架构 §3.4）
-- key_hash 为 Idempotency-Key 的哈希，避免明文 key 过长；key_scope 用于按 scope 清理或查询

CREATE TABLE IF NOT EXISTS idempotency_keys (
    key_hash            BYTEA PRIMARY KEY,
    key_scope           TEXT NOT NULL,
    response_snapshot   JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope ON idempotency_keys (key_scope);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys (expires_at) WHERE expires_at IS NOT NULL;
