/**
 * 社区发帖 **`POST …/community/posts/upload-media`** 解码体上限（与
 * `crates/api/src/routes/community/media_upload/`、`docs/spec/04-后端与API.md` §三 同源）。
 * 部署若上调 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES`**，须同步设置
 * **`NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES`** 后重建前端，避免客户端预检与 API 不一致。
 *
 * **MP4 视频时长上限（秒）**：后端 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC`**（默认 **180**，钳位 **1～3600**）；
 * 前端发帖预检须 **`NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC`** 同值（**`scripts/dev/sync-frontend-env-local-from-root.*`** 可从根 `.env` 同步）。
 */

export const COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_DEFAULT = 512 * 1024;

export const COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC_DEFAULT = 180;

/** 与后端 `TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES` 默认 **500MiB** 同源（multipart 视频选文件上限）。 */
export const COMMUNITY_MEDIA_ASSET_MAX_BYTES_DEFAULT = 500 * 1024 * 1024;

const COMMUNITY_MEDIA_ASSET_MAX_BYTES_FLOOR = 5 * 1024 * 1024;
const COMMUNITY_MEDIA_ASSET_MAX_BYTES_CAP = 1024 * 1024 * 1024;

const COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_CAP = 980_000;
const COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_FLOOR = 1024;
const COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC_CAP = 3600;
const COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC_FLOOR = 1;

function readOptionalPositiveInt(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) return null;
  return n;
}

/** 与后端 `TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES` 同钳位（1024～980000）。 */
export function clampCommunityPostMediaMaxDecodedBytes(n: number): number {
  return Math.min(
    COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_CAP,
    Math.max(COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_FLOOR, Math.floor(n)),
  );
}

/**
 * 浏览器构建时注入；未设置则回退 **512KiB**（与 API 默认一致）。
 */
export function getCommunityPostMediaMaxDecodedBytes(): number {
  if (typeof process === "undefined") return COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_DEFAULT;
  const fromEnv = readOptionalPositiveInt(process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES);
  if (fromEnv != null) return clampCommunityPostMediaMaxDecodedBytes(fromEnv);
  return COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_DEFAULT;
}

/** 与后端 `TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC` 同钳位（1～3600）。 */
export function clampCommunityPostMediaMaxVideoDurationSec(n: number): number {
  return Math.min(
    COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC_CAP,
    Math.max(COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC_FLOOR, Math.floor(n)),
  );
}

/**
 * 浏览器构建期注入；未设置则 **180**（与 API 默认一致）。
 * 用于 **`PublishDrawer`** 客户端时长预检，须与部署侧后端 env 对齐。
 */
export function getCommunityPostMediaMaxVideoDurationSec(): number {
  if (typeof process === "undefined") return COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC_DEFAULT;
  const fromEnv = readOptionalPositiveInt(process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC);
  if (fromEnv != null) return clampCommunityPostMediaMaxVideoDurationSec(fromEnv);
  return COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC_DEFAULT;
}

/** 与后端 `TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES` 钳位 **5MiB～1GiB** 同源；Next 构建期 **`NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES`**。 */
export function getCommunityMediaAssetMaxBytesClient(): number {
  if (typeof process === "undefined") return COMMUNITY_MEDIA_ASSET_MAX_BYTES_DEFAULT;
  const fromEnv = readOptionalPositiveInt(process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES);
  if (fromEnv != null) {
    return Math.min(
      COMMUNITY_MEDIA_ASSET_MAX_BYTES_CAP,
      Math.max(COMMUNITY_MEDIA_ASSET_MAX_BYTES_FLOOR, fromEnv),
    );
  }
  return COMMUNITY_MEDIA_ASSET_MAX_BYTES_DEFAULT;
}

/** 发帖弹窗 `{{mb}}` 提示：小上限用去尾零的小数 MB，避免误读为 10MB/100MB。 */
export function communityPostMediaMaxSizeMbLabel(maxBytes: number): string {
  const mb = maxBytes / (1024 * 1024);
  const rounded = Math.round(mb * 1000) / 1000;
  if (!Number.isFinite(rounded) || rounded <= 0) return "0";
  if (rounded >= 1) return String(Math.round(rounded * 10) / 10);
  return String(Math.round(rounded * 100) / 100).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}
