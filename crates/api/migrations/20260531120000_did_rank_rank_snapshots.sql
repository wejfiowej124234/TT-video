-- DID 榜 rank_delta 快照（① 本地多进程/重启可复用；②③ 可换 Redis/专用表）
CREATE TABLE IF NOT EXISTS did_rank_rank_snapshots (
    cache_key TEXT PRIMARY KEY,
    ranks_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS did_rank_rank_snapshots_updated_at_idx
    ON did_rank_rank_snapshots (updated_at DESC);
