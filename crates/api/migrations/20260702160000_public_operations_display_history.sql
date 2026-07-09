-- Public Operations · display change version history (SSOT-PUB-OPS O7)

CREATE TABLE IF NOT EXISTS ops_public_operations_display_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID,
    display_source TEXT,
    before_state JSONB,
    after_state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_pub_ops_history_entity
    ON ops_public_operations_display_history (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_pub_ops_history_action
    ON ops_public_operations_display_history (action, created_at DESC);
