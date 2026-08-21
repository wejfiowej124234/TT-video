import { apiUrl } from "./api";

/**
 * Git Bash MSYS may prefix `/api/…` as `C:/Program Files/Git/api/…`; strip to site path before render.
 */
export function normalizePersistedCommunityMediaPath(raw: string | null | undefined): string {
  const u = (raw ?? "").trim();
  if (!u) return "";
  if (
    u.startsWith("/") ||
    u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("blob:") ||
    u.startsWith("data:")
  ) {
    return u;
  }
  const lower = u.toLowerCase();
  const apiIdx = lower.indexOf("/api/");
  if (apiIdx > 0) return u.slice(apiIdx);
  const authIdx = lower.indexOf("/auth/");
  if (authIdx > 0) return u.slice(authIdx);
  return u;
}

/**
 * 将后端持久化的站内媒体路径转为浏览器可加载 URL（与 `apiUrl`、社区 JSON fetch 同源）。
 * - **`/api/*` / `/auth/*`（浏览器）**：与 **`MarketGuideCover`** 一致，保留**同源相对路径**，经 Next rewrite 代理（② staging web）。
 * - **`/api/*` / `/auth/*`（SSR / 无 `window`）**：走 **`apiUrl`**。
 * - **`//api/*` / `//auth/*`**：规范为单斜杠后再走上述规则。
 * - **`//cdn.example/…`**：协议相对绝对 URL，用当前页 origin 解析。
 * - **`api/*` / `auth/*`（无前导 `/`）**：补 **`/`** 后同上。
 * - **`blob:` / `data:` / `http(s):`**：绝对 URL 中 **`/api/v1/uploads/*`** 在浏览器降回相对路径（Guide 封面 parity）。
 * - 其它以 **`/`** 开头的前端路径原样返回。
 */
function communityMediaBrowserHasWindow(): boolean {
  const win = (globalThis as { window?: { location?: { origin?: string } } }).window;
  return typeof win?.location?.origin === "string" && win.location.origin.length > 0;
}

/** 浏览器 · `/api/*` / `/auth/*` 与 Guide 封面一致：同源 rewrite，不拼跨域 API host。 */
function communityMediaSameOriginApiPathForBrowser(path: string): string | null {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!p.startsWith("/api/") && !p.startsWith("/auth/")) return null;
  return communityMediaBrowserHasWindow() ? p : null;
}

export function communityMediaAbsoluteUrlForRender(raw: string | null | undefined): string {
  const normalized = normalizePersistedCommunityMediaPath(raw);
  const ocs = remapOfficialColdStartLegacyUploadUrl(normalized);
  if (ocs !== normalized && ocs.startsWith("https://")) return ocs;
  const u = remapCommunityTestCdnPlaybackPath(ocs);
  if (!u) return "";
  if (u.startsWith("blob:") || u.startsWith("data:")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) {
    try {
      const parsed = new URL(u);
      const same = communityMediaSameOriginApiPathForBrowser(`${parsed.pathname}${parsed.search}`);
      if (same) return same;
    } catch {
      /* keep absolute */
    }
    return u;
  }
  if (u.startsWith("//api/") || u.startsWith("//auth/")) {
    const p = `/${u.slice(2)}`;
    const same = communityMediaSameOriginApiPathForBrowser(p);
    if (same) return same;
    return apiUrl(p);
  }
  if (u.startsWith("//")) {
    try {
      const win = (globalThis as { window?: { location?: { origin?: string } } }).window;
      const base = typeof win?.location?.origin === "string" && win.location.origin.length > 0 ? win.location.origin : "https://127.0.0.1";
      return new URL(u, base).href;
    } catch {
      return u;
    }
  }
  if (u.startsWith("/") && !u.startsWith("//") && !u.startsWith("/api/") && !u.startsWith("/auth/")) {
    return u;
  }
  if (u.startsWith("/api/") || u.startsWith("/auth/")) {
    const same = communityMediaSameOriginApiPathForBrowser(u);
    if (same) return same;
    return apiUrl(u);
  }
  if (u.startsWith("api/") || u.startsWith("auth/")) {
    const p = `/${u}`;
    const same = communityMediaSameOriginApiPathForBrowser(p);
    if (same) return same;
    return apiUrl(p);
  }
  return u;
}

/**
 * 出站链接（`href` / `target="_blank"` 等）：与测试网/公网「前后端分源」对齐。
 * - 以 **`/`** 开头且**不是** **`/api/*`**、**`/auth/*`** 的字符串视为**前端站内路径**（如 `/market`、外链型 `/foo` 若存在），原样返回，避免误拼到 API 基址。
 * - 其余与 {@link communityMediaAbsoluteUrlForRender} 同源（`http(s):`、`//…`、`api/`、**`/api/*`** 等）。
 * - **`mailto:`** / **`tel:`** 原样返回。
 */
export function outboundUrlFromPersisted(raw: string | null | undefined): string {
  const u = (raw ?? "").trim();
  if (!u) return "";
  if (u.startsWith("mailto:") || u.startsWith("tel:")) return u;
  // `//api/…` 以 `/` 开头但不是站内路径；须走下方与 {@link communityMediaAbsoluteUrlForRender} 同源逻辑。
  if (u.startsWith("/") && !u.startsWith("//") && !u.startsWith("/api/") && !u.startsWith("/auth/")) {
    return u;
  }
  return communityMediaAbsoluteUrlForRender(u);
}

/** Staging Tigris 公网桶（COS permanent · staging_primary）。 */
export const COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST =
  "traveltrust-community-media.fly.storage.tigris.dev";

/** 未来 CDN 切流目标（PI3 · 与 COS permanent `r2_cdn_cutover` 对齐）。 */
export const COMMUNITY_MEDIA_CDN_PUBLIC_HOST = "cdn.traveltrust.app";

/** Official OCS assets live on Tigris `official-cold-start/v1/`; DB may still store legacy upload paths. */
const OCS_LEGACY_UPLOAD_RE =
  /(?:^|\/)api\/v1\/uploads\/community-posts\/(ocs-[A-Za-z0-9._-]+\.(?:jpe?g|png|webp|gif|avif))(?:\?.*)?$/i;

/**
 * Remap legacy `/api/v1/uploads/community-posts/ocs-*` → Tigris Official Cold Start object URL.
 * No-op for non-OCS uploads (user media still served via uploads / community-media).
 */
export function remapOfficialColdStartLegacyUploadUrl(raw: string | null | undefined): string {
  const u = (raw ?? "").trim();
  if (!u) return "";
  const m = u.replace(/\\/g, "/").match(OCS_LEGACY_UPLOAD_RE);
  if (!m) return u;
  return `https://${COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST}/official-cold-start/v1/${m[1]}`;
}

/**
 * Durable community media normalizer（数据入模边界）：path normalize + OCS legacy→Tigris。
 * 浏览器 Network 不得再发 `/api/v1/uploads/community-posts/ocs-*`。
 */
export function normalizeDurableCommunityMediaUrl(raw: string | null | undefined): string {
  const n = normalizePersistedCommunityMediaPath(raw);
  if (!n) return "";
  return remapOfficialColdStartLegacyUploadUrl(n);
}

function communityMediaHostIsObjectStoreOrCdn(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST || h === COMMUNITY_MEDIA_CDN_PUBLIC_HOST;
}

/**
 * 与 `next/image` 配合：自管上传路径、本地预览、Tigris/CDN 公网媒体等不走默认优化器
 *（CardMedia / PostDetail 等均经此 helper；与各处分散的 `unoptimized` 条件同源）。
 * 入参须为**已**经 `communityMediaAbsoluteUrlForRender` 等解析后的展示 URL。
 *
 * MED-05：绝对 Tigris/CDN URL 须 `unoptimized`，避免 Staging `/_next/image` 400。
 */
export function communityMediaNextImageUnoptimized(resolvedSrc: string): boolean {
  const s = resolvedSrc;
  if (!s) return false;
  if (
    s.startsWith("blob:") ||
    s.startsWith("data:") ||
    s.includes("/api/v1/uploads/") ||
    s.includes("images.unsplash.com")
  ) {
    return true;
  }
  if (s.startsWith("http://") || s.startsWith("https://")) {
    try {
      if (communityMediaHostIsObjectStoreOrCdn(new URL(s).hostname)) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/** 与后端 **`COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL`** / MinIO 证据链同源；Next rewrite 须与此一致。 */
export function communityMediaS3PublicBaseUrl(): string {
  const fromNext =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL : undefined;
  const fromServer =
    typeof process !== "undefined" ? process.env.COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL : undefined;
  return (fromNext ?? fromServer ?? "").trim().replace(/\/$/, "");
}

/** ① 本地 MinIO 证据链默认公网基址（与根 `.env` / `community-media-minio-local.env.snippet` 同源）。 */
export const COMMUNITY_MEDIA_LOCAL_MINIO_PUBLIC_BASE_DEFAULT =
  "http://127.0.0.1:19000/traveltrust-community-media";

const COMMUNITY_TEST_CDN_PLAYBACK_RE =
  /^https:\/\/cdn(?:-staging)?\.example\.test\/(?:playback|community\/media)\/([0-9a-f-]{36})\.mp4(\?.*)?$/i;

const COMMUNITY_PLAYABLE_VIDEO_SUFFIX_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

function isLoopbackMediaBase(base: string): boolean {
  try {
    const u = new URL(base);
    const h = u.hostname.toLowerCase();
    return (
      (u.protocol === "http:" || u.protocol === "https:") &&
      (h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1")
    );
  } catch {
    return false;
  }
}

/** 解析 S3/MinIO 公网基址；未配 env 时回退本地 MinIO 默认（① remap 假 CDN 用）。 */
function communityMediaS3PublicBaseUrlForPlayback(): string {
  const configured = communityMediaS3PublicBaseUrl();
  if (configured) return configured;
  return COMMUNITY_MEDIA_LOCAL_MINIO_PUBLIC_BASE_DEFAULT;
}

/**
 * C4 multipart 真路径：`community-media/v1/{user_id}/{asset_id}.mp4`（与 `playback_url_for_key` 同源）。
 * 仅 `primary_media_asset_id`、无 `media_urls` 时作 Feed/详情回退。
 */
export function communityMediaAssetPlaybackUrlFromIds(
  authorUserId: string | null | undefined,
  assetId: string | null | undefined,
): string {
  const uid = (authorUserId ?? "").trim();
  const aid = (assetId ?? "").trim();
  if (!uid || !aid) return "";
  const base = communityMediaS3PublicBaseUrlForPlayback();
  if (!base) return "";
  return `${base}/community-media/v1/${uid}/${aid}.mp4`;
}

/**
 * PG·IT / staging 种子常写 `https://cdn.example.test/playback/{assetId}.mp4`，
 * 真实 object_key 为 `community/media/{assetId}.mp4` — ① 本地 remap 到 MinIO。
 */
export function remapCommunityTestCdnPlaybackPath(raw: string | null | undefined): string {
  const u = (raw ?? "").trim();
  if (!u) return "";
  const m = u.match(COMMUNITY_TEST_CDN_PLAYBACK_RE);
  if (!m) return u;
  const base = communityMediaS3PublicBaseUrlForPlayback();
  return `${base}/community/media/${m[1]}.mp4`;
}

/** 是否仍图（可作 `<Image>` / `<video poster>`）；排除可播放视频链。 */
export function communityMediaIsStillImageUrl(resolved: string): boolean {
  const s = (resolved ?? "").trim();
  if (!s) return false;
  if (COMMUNITY_PLAYABLE_VIDEO_SUFFIX_RE.test(s)) return false;
  return /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(s) || s.startsWith("blob:") || s.startsWith("data:image/");
}

/**
 * Feed / 详情 **`<video src>`**：将对象存储公网基址改写为可加载 URL。
 * - **测试 CDN**（`cdn.example.test` / `cdn-staging.example.test`）→ MinIO **`community/media/{id}.mp4`**
 * - **loopback MinIO**（Q-07）：**直连**公网基址（桶 CORS 已配）
 * - **非 loopback CDN**：同源 **`/tt-community-s3/*`**（须 next.config rewrite · ②③）
 * - 其余回退 {@link communityMediaAbsoluteUrlForRender}
 */
export function communityMediaPlaybackUrlForRender(raw: string | null | undefined): string {
  const remapped = remapCommunityTestCdnPlaybackPath(normalizePersistedCommunityMediaPath(raw));
  const abs = communityMediaAbsoluteUrlForRender(remapped);
  if (!abs) return "";
  const base = communityMediaS3PublicBaseUrlForPlayback();
  if (!base) return abs;
  const prefix = `${base}/`;
  if (abs.startsWith(prefix)) {
    const rest = abs.slice(prefix.length);
    if (!rest) return abs;
    if (isLoopbackMediaBase(base)) {
      return abs;
    }
    return `/tt-community-s3/${rest}`;
  }
  return abs;
}
