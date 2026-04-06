-- P3 Phase 2 业务表：与 04 §二 一致；链下核心流程（用户/向导/订单/评价/争议）。
-- 依赖 001：users 已存在。执行顺序：001 → 002。
-- 回滚：见 migrations/README.md。

-- 扩展 users（04 §二 2.1 可选字段）
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_wallet_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- guides（04 §二 2.2）
CREATE TABLE IF NOT EXISTS guides (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city                TEXT NOT NULL,
    country_code        TEXT NOT NULL DEFAULT '',
    languages           TEXT[] NOT NULL DEFAULT '{}',
    service_types       TEXT[] NOT NULL DEFAULT '{}',
    bio                 TEXT,
    stake_amount        NUMERIC(36,18) NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_guides_user_id ON guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_city ON guides(city);
CREATE INDEX IF NOT EXISTS idx_guides_status ON guides(status);

-- orders（链下业务订单；资金终态仍以链/投影为准，本表为创建→接单→支付占位→完成流程）
CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tourist_id          UUID NOT NULL REFERENCES users(id),
    guide_id            UUID NOT NULL REFERENCES users(id),
    amount              NUMERIC(36,18) NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'USD',
    status              TEXT NOT NULL DEFAULT 'created',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at         TIMESTAMPTZ,
    escrowed_at         TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    dispute_deadline_at TIMESTAMPTZ,
    auto_complete_at    TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT dispute_deadline_ge_auto_complete CHECK (
        dispute_deadline_at IS NULL OR auto_complete_at IS NULL OR dispute_deadline_at >= auto_complete_at
    )
);
CREATE INDEX IF NOT EXISTS idx_orders_tourist ON orders(tourist_id);
CREATE INDEX IF NOT EXISTS idx_orders_guide ON orders(guide_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- reviews（04 §二 2.2；仅资金终态可评）
CREATE TABLE IF NOT EXISTS reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    reviewee_id         UUID NOT NULL REFERENCES users(id),
    score               SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    weight              NUMERIC(12,6) NOT NULL DEFAULT 1,
    comment             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(order_id, reviewer_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);

-- stakes（04 §二 2.2；MVP 可记 DB）
CREATE TABLE IF NOT EXISTS stakes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id            UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    amount              NUMERIC(36,18) NOT NULL,
    locked_until        TIMESTAMPTZ,
    slashed_amount      NUMERIC(36,18) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stakes_guide ON stakes(guide_id);

-- disputes（04 §二 2.2；仅 DB 裁决，执行器 P5 上链）
CREATE TABLE IF NOT EXISTS disputes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'open',
    evidence_hashes     TEXT[] NOT NULL DEFAULT '{}',
    arbitrator_id       UUID REFERENCES users(id),
    refund_ratio        NUMERIC(5,4),
    slash_guide         BOOLEAN,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(order_id)
);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
