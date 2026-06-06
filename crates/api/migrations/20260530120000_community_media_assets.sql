-- Phase 1：社区视频 / 媒体资产（S3 分片直传 + DB 元数据；与 270、04 §3.4 社区媒体行对读）
-- 对象键与 multipart upload_id 由 API 写入；业务 API 不承载视频字节。

CREATE TABLE IF NOT EXISTS community_media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    object_key TEXT NOT NULL,
    content_type TEXT NOT NULL,
    byte_length BIGINT NOT NULL CHECK (byte_length > 0),
    part_size_bytes BIGINT NOT NULL CHECK (part_size_bytes > 0),
    part_count INT NOT NULL CHECK (part_count > 0 AND part_count <= 10000),
    sha256_hex TEXT,
    state TEXT NOT NULL CHECK (state IN (
        'pending_upload',
        'uploaded',
        'processing',
        'ready',
        'failed'
    )),
    duration_ms INTEGER,
    width INTEGER,
    height INTEGER,
    cover_object_key TEXT,
    playback_url TEXT,
    playback_manifest_json JSONB,
    s3_multipart_upload_id TEXT,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_media_assets_sha256_hex_len CHECK (
        sha256_hex IS NULL OR char_length(sha256_hex) = 64
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_community_media_assets_object_key
    ON community_media_assets (object_key);

CREATE INDEX IF NOT EXISTS idx_community_media_assets_owner_created
    ON community_media_assets (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_media_assets_state
    ON community_media_assets (state);

COMMENT ON TABLE community_media_assets IS
    '270 / 社区：对象存储直传媒体元数据；state=ready 且 playback_url 填齐后方可绑定公开视频帖';

COMMENT ON COLUMN community_media_assets.playback_manifest_json IS
    '预留：HLS/DASH manifest 或自适应流描述 JSON；Phase1 可为 NULL';

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS primary_media_asset_id UUID REFERENCES community_media_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_primary_media_asset
    ON community_posts (primary_media_asset_id);
