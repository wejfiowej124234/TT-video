-- 31 §2.1 / 160：视频帖可选封面图 URL，列表与详情优先展示封面而非直链视频帧
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS cover_url TEXT;
