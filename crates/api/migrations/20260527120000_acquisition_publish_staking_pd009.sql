-- PD-009：旅行收购发布/履约保证金（user 级 staking_positions，不经过 role_applications KYB）
-- SSOT: docs/spec/artifacts/acquisition-publish-trust-rules.v1.md
-- 空库路径：staking_positions 在 20260601120000 才建表；此处跳过，语义由 20260601160000 重放。

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'staking_positions'
    ) THEN
        RETURN;
    END IF;

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
END $$;
