-- B-089 Completion：Governor 事件 → **`governance_proposals_projection`**（与 **event_log** 回放一致；**reorg** 时清空重放）。

CREATE TABLE IF NOT EXISTS governance_proposals_projection (
    chain_id BIGINT NOT NULL,
    proposal_id NUMERIC(78, 0) NOT NULL,
    proposer BYTEA,
    snapshot_block BIGINT NOT NULL DEFAULT 0,
    vote_start_block BIGINT NOT NULL DEFAULT 0,
    vote_end_block BIGINT NOT NULL DEFAULT 0,
    title TEXT,
    for_votes NUMERIC(78, 0) NOT NULL DEFAULT 0,
    against_votes NUMERIC(78, 0) NOT NULL DEFAULT 0,
    abstain_votes NUMERIC(78, 0) NOT NULL DEFAULT 0,
    chain_state TEXT,
    operation_id BYTEA,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, proposal_id)
);

CREATE INDEX IF NOT EXISTS idx_governance_proposals_projection_chain_updated
    ON governance_proposals_projection (chain_id, updated_at DESC);
