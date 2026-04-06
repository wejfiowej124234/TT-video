-- 110：业务订单链归属（全表按链筛选/回滚之前提；NULL 兼容迁移前历史行）
ALTER TABLE orders ADD COLUMN IF NOT EXISTS chain_id BIGINT NULL;
COMMENT ON COLUMN orders.chain_id IS 'EVM chain id when known (CHAIN_ID / CHAIN_RPC_URL 默认 137)；NULL = 历史或未配置链';
CREATE INDEX IF NOT EXISTS idx_orders_chain_id ON orders (chain_id) WHERE chain_id IS NOT NULL;
