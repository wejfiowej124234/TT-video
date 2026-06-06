-- PD-009：旅行收购发布/履约保证金（空库→最新 · 须在 staking_positions 建表之后）
-- SSOT: docs/spec/artifacts/acquisition-publish-trust-rules.v1.md
-- 与 20260527120000 语义同源；对已应用旧版 20260527 的库为幂等重放。

ALTER TABLE staking_positions DROP CONSTRAINT IF EXISTS staking_positions_kind_check;

ALTER TABLE staking_positions
    ADD CONSTRAINT staking_positions_kind_check CHECK (kind IN (
        'identity_pool_guide',
        'identity_pool_provider',
        'onboarding_fee',
        'acquisition_publish_bond',
        'acquisition_fulfillment_bond'
    ));

ALTER TABLE staking_positions ALTER COLUMN application_id DROP NOT NULL;

ALTER TABLE staking_positions
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE staking_positions DROP CONSTRAINT IF EXISTS staking_positions_owner_xor;

ALTER TABLE staking_positions
    ADD CONSTRAINT staking_positions_owner_xor CHECK (
        (application_id IS NOT NULL AND user_id IS NULL)
        OR (
            application_id IS NULL
            AND user_id IS NOT NULL
            AND kind IN ('acquisition_publish_bond', 'acquisition_fulfillment_bond')
        )
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_staking_positions_user_kind_acquisition
    ON staking_positions (user_id, kind)
    WHERE user_id IS NOT NULL
      AND kind IN ('acquisition_publish_bond', 'acquisition_fulfillment_bond');
