-- B-072 / B-073 / B-092：链下治理 MVP 可选 PG 持久化（与 `routes/governance_proposals.rs`、`governance_delegate.rs` 对读）。
-- 当 **`chain_off.db_pool`** 存在且 **未** 启用 Governor 索引模式时，读写本组表；无池时仍用进程内 `OnceLock`。
CREATE TABLE IF NOT EXISTS governance_mvp_proposals (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO governance_mvp_proposals (id, title, body, status)
VALUES
    (
        '00000000-0000-4000-8000-000000000001'::uuid,
        'TT MVP: FeeRouter parameter calibration',
        'Chain-off governance demo proposal. Vote to signal support for aligning protocol-reference snapshots with runtime GET /meta (B-072 MVP).',
        'active'
    ),
    (
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Treasury rotation (placeholder)',
        'Second demo entry for list/detail navigation and vote isolation tests.',
        'active'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    status = EXCLUDED.status,
    updated_at = now();

CREATE TABLE IF NOT EXISTS governance_mvp_votes (
    proposal_id UUID NOT NULL REFERENCES governance_mvp_proposals (id) ON DELETE CASCADE,
    voter_user_id UUID NOT NULL,
    choice TEXT NOT NULL CHECK (choice IN ('yes', 'no', 'abstain')),
    weight BIGINT NOT NULL CHECK (weight > 0),
    voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (proposal_id, voter_user_id)
);

CREATE INDEX IF NOT EXISTS governance_mvp_votes_voter_idx ON governance_mvp_votes (voter_user_id);

CREATE TABLE IF NOT EXISTS governance_mvp_delegations (
    voter_user_id UUID PRIMARY KEY,
    delegate_to UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS governance_mvp_delegations_delegate_to_idx ON governance_mvp_delegations (delegate_to);
