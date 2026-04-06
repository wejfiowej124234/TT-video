-- 160：评论行级可见性/风险标签（列表内嵌治理最小字段；与 04 §3.4 登记一致）

ALTER TABLE community_comments
    ADD COLUMN IF NOT EXISTS visibility_status TEXT NOT NULL DEFAULT 'visible',
    ADD COLUMN IF NOT EXISTS risk_level SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE community_comments
    DROP CONSTRAINT IF EXISTS community_comments_visibility_check;

ALTER TABLE community_comments
    ADD CONSTRAINT community_comments_visibility_check
    CHECK (visibility_status IN ('visible', 'hidden', 'removed'));

CREATE INDEX IF NOT EXISTS idx_community_comments_post_visibility
    ON community_comments (post_id, visibility_status);
