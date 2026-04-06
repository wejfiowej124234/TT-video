-- 私信已读游标：用于未读条数；打开会话拉消息时更新 last_read_at
CREATE TABLE IF NOT EXISTS community_dm_read_state (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES community_conversations(id) ON DELETE CASCADE,
    last_read_at    TIMESTAMPTZ NOT NULL DEFAULT '-infinity',
    PRIMARY KEY (user_id, conversation_id)
);
CREATE INDEX IF NOT EXISTS idx_community_dm_read_state_conv ON community_dm_read_state (conversation_id);

-- 发出的好友申请列表查询
CREATE INDEX IF NOT EXISTS idx_community_friend_requests_from ON community_friend_requests (from_user_id, status);
