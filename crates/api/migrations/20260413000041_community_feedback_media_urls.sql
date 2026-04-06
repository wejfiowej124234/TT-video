-- 54-S19：反馈帖可选图/视频 URL 列表（与 community_posts.media_urls 形态一致；可为 HTTPS 或 data:image|data:video）

ALTER TABLE community_feedback
    ADD COLUMN IF NOT EXISTS media_urls TEXT[] NOT NULL DEFAULT '{}';
