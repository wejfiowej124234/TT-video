-- 31 §2.3：帖子可见性（公开 / 仅自己 / 归档）；Feed 与他人主页仅展示 public

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS visibility_status TEXT NOT NULL DEFAULT 'public';

ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_visibility_status_check;
ALTER TABLE community_posts
    ADD CONSTRAINT community_posts_visibility_status_check
    CHECK (visibility_status IN ('public', 'private', 'archived'));

CREATE INDEX IF NOT EXISTS idx_community_posts_tag_public_created
    ON community_posts (created_at DESC)
    WHERE visibility_status = 'public';
