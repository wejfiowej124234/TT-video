-- 95 / DATA-COLLECT-001：收藏行必须引用现存帖子，与 community_likes 一致；清理历史孤儿行后加 FK。

DELETE FROM community_collects c
WHERE NOT EXISTS (SELECT 1 FROM community_posts p WHERE p.id = c.post_id);

ALTER TABLE community_collects
    ADD CONSTRAINT community_collects_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_community_collects_post ON community_collects (post_id);
