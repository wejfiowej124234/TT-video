-- 50-O-31：社区扩展表（31 附录 §11、04 对接）
-- 评论、关注、好友、收藏、私信会话与消息；post_id 为业务侧帖子标识（可暂无 community_posts 表）

CREATE TABLE IF NOT EXISTS community_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_user ON community_comments (user_id);

CREATE TABLE IF NOT EXISTS community_follows (
    follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT chk_follow_not_self CHECK (follower_id != following_id)
);
CREATE INDEX IF NOT EXISTS idx_community_follows_following ON community_follows (following_id);

CREATE TABLE IF NOT EXISTS community_friend_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (from_user_id, to_user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_friend_requests_to ON community_friend_requests (to_user_id, status);

CREATE TABLE IF NOT EXISTS community_friends (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, friend_id),
    CONSTRAINT chk_friends_not_self CHECK (user_id != friend_id)
);
CREATE INDEX IF NOT EXISTS idx_community_friends_friend ON community_friends (friend_id);

CREATE TABLE IF NOT EXISTS community_collects (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id    UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_community_collects_user ON community_collects (user_id);

CREATE TABLE IF NOT EXISTS community_conversations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user1_id, user2_id),
    CONSTRAINT chk_conv_order CHECK (user1_id < user2_id)
);
CREATE INDEX IF NOT EXISTS idx_community_conversations_user ON community_conversations (user1_id);
CREATE INDEX IF NOT EXISTS idx_community_conversations_user2 ON community_conversations (user2_id);

CREATE TABLE IF NOT EXISTS community_dm_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES community_conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_dm_messages_conv ON community_dm_messages (conversation_id, created_at DESC);
