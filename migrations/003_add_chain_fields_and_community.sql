-- P1 补充关键字段：订单链相关字段、向导证件字段、完整社区表、行程表
-- 依赖 002：orders/guides/users 已存在。执行顺序：001 → 002 → 003。
-- 回滚：见 migrations/README.md。

-- ============================================
-- 1. 订单表补充链相关字段（Critical P1）
-- ============================================
-- 补充 orders 表缺失的链映射关键字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS chain_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id BYTEA;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS snapshot_hash TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS image TEXT;  -- 56 阶段：订单封面图

-- 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_orders_chain_id ON orders(chain_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);

-- ============================================
-- 2. 向导表补充证件与 DID 字段（High P1）
-- ============================================
ALTER TABLE guides ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS real_name TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS passport_number_hash TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS id_photo_url TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS language_cert_url TEXT;

-- ============================================
-- 3. 完整 itineraries 表（Medium P1）
-- ============================================
CREATE TABLE IF NOT EXISTS itineraries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES orders(id) ON DELETE CASCADE,
    draft_id            TEXT,
    version             INT NOT NULL DEFAULT 1,
    destination         TEXT,
    country             TEXT,
    city                TEXT,
    days                INT,
    daily_itinerary     JSONB NOT NULL DEFAULT '[]',  -- 按日行程数组
    amount_breakdown    JSONB,
    cover_image         TEXT,  -- 56 阶段：行程封面图
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itineraries_order ON itineraries(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_itineraries_draft ON itineraries(draft_id) WHERE draft_id IS NOT NULL;

-- ============================================
-- 4. 社区完整表（High P1 - 55 阶段）
-- ============================================

-- 4.1 社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    media_urls          TEXT[] DEFAULT '{}',  -- 多图/视频 URL 数组
    media_types         TEXT[] DEFAULT '{}',  -- image/video
    destination         TEXT,
    likes_count         INT NOT NULL DEFAULT 0,
    comments_count      INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_destination ON community_posts(destination) WHERE destination IS NOT NULL;

-- 4.2 评论表
CREATE TABLE IF NOT EXISTS community_comments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    parent_id           UUID REFERENCES community_comments(id) ON DELETE CASCADE,  -- 二级评论
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_comments(parent_id) WHERE parent_id IS NOT NULL;

-- 4.3 点赞表
CREATE TABLE IF NOT EXISTS community_likes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_likes_post ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user ON community_likes(user_id);

-- 4.4 收藏表
CREATE TABLE IF NOT EXISTS community_collects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_collects_post ON community_collects(post_id);
CREATE INDEX IF NOT EXISTS idx_community_collects_user ON community_collects(user_id);

-- 4.5 关注表
CREATE TABLE IF NOT EXISTS community_follows (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 谁关注
    followee_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 被关注谁
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(follower_id, followee_id)
);

CREATE INDEX IF NOT EXISTS idx_community_follows_follower ON community_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_followee ON community_follows(followee_id);

-- 4.6 好友表
CREATE TABLE IF NOT EXISTS community_friends (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_a_id, user_b_id),
    CHECK (user_a_id < user_b_id)  -- 确保顺序，避免重复
);

CREATE INDEX IF NOT EXISTS idx_community_friends_a ON community_friends(user_a_id);
CREATE INDEX IF NOT EXISTS idx_community_friends_b ON community_friends(user_b_id);

-- 4.7 好友申请表
CREATE TABLE IF NOT EXISTS community_friend_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'pending',  -- pending/accepted/rejected
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_friend_requests_to ON community_friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_community_friend_requests_from ON community_friend_requests(from_user_id);

-- 4.8 私信会话表
CREATE TABLE IF NOT EXISTS community_conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_a_id, user_b_id),
    CHECK (user_a_id < user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_community_conversations_a ON community_conversations(user_a_id);
CREATE INDEX IF NOT EXISTS idx_community_conversations_b ON community_conversations(user_b_id);
CREATE INDEX IF NOT EXISTS idx_community_conversations_last_message ON community_conversations(last_message_at DESC);

-- 4.9 私信消息表
CREATE TABLE IF NOT EXISTS community_dm_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES community_conversations(id) ON DELETE CASCADE,
    sender_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_dm_messages_conversation ON community_dm_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_community_dm_messages_sender ON community_dm_messages(sender_id);

-- ============================================
-- 5. 证据表（Critical P1 - 补充完整结构）
-- ============================================
CREATE TABLE IF NOT EXISTS evidence_receipts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    content_hash        TEXT NOT NULL,
    content_url         TEXT,  -- 对象存储 URL 或 pre-signed URL
    uploader_id         UUID NOT NULL REFERENCES users(id),
    quote_hash          TEXT,  -- 80 附录-01 Import Quote
    quote_canonical     TEXT,  -- 可选：原始 canonical payload
    file_size_bytes     BIGINT,
    mime_type           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_receipts_order ON evidence_receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_evidence_receipts_uploader ON evidence_receipts(uploader_id);

-- ============================================
-- 6. sessions 表（如果不存在）
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    token               TEXT PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- 7. 反馈表（55 阶段）
-- ============================================
CREATE TABLE IF NOT EXISTS community_feedback (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    category            TEXT NOT NULL,  -- bug/feature/other
    content             TEXT NOT NULL,
    contact_email       TEXT,
    status              TEXT NOT NULL DEFAULT 'open',  -- open/reviewing/closed
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_feedback_status ON community_feedback(status);
CREATE INDEX IF NOT EXISTS idx_community_feedback_created ON community_feedback(created_at DESC);
