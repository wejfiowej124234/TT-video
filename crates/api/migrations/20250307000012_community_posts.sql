-- 51-31-9 / 51-31-B1：帖子表与发帖/Feed API（31 附录 §7、04 业务逻辑）
-- 含媒体、类型、目的地、标签；点赞表供 51-31-8 使用

CREATE TABLE IF NOT EXISTS community_posts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL DEFAULT '',
    post_type   TEXT NOT NULL DEFAULT 'photo',
    destination TEXT,
    tags        TEXT[] DEFAULT '{}',
    media_urls   TEXT[] DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts (post_type) WHERE post_type IS NOT NULL;

-- 点赞（51-31-8 点赞/收藏 API）
CREATE TABLE IF NOT EXISTS community_likes (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_community_likes_post ON community_likes (post_id);
