/**
 * 社区 **`POST …/community/posts`**（**`media_urls` / `cover_url`**）、**`POST …/community/feedback`**（**`media_urls[]`**）
 * 内嵌 **`http(s):`** 的前端预检（与 **`crates/api/src/routes/community/common/embedded_http_urls.rs`** **`validate_single_embedded_url_string`** 同源）。
 *
 * 须与根 **`.env`** **`TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`**、**`TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS`**
 * 对读：构建时注入 **`NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`**、**`NEXT_PUBLIC_TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS`**
 *（**`scripts/dev/sync-frontend-env-local-from-root.*`** 从根 `.env` 同步），否则仅依赖后端 **400**（**`media_url_*`**）。
 */

/** 与 **`feedback_reports`** **`prefix_matches_ignore_ascii_case`** 同源（仅用于 **scheme** 门闩，非 URL 全局规范化）。 */
function prefixMatchesIgnoreAsciiCase(haystack: string, prefix: string): boolean {
  if (haystack.length < prefix.length) return false;
  return haystack.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase();
}

/**
 * 与后端 **`feedback_media_item_has_allowed_scheme`** 同源；用于反馈附件在提交前的 **scheme** 预检。
 */
export function feedbackMediaItemHasAllowedClientScheme(s: string): boolean {
  const t = s.trim();
  return (
    prefixMatchesIgnoreAsciiCase(t, "https://") ||
    prefixMatchesIgnoreAsciiCase(t, "http://") ||
    prefixMatchesIgnoreAsciiCase(t, "data:image/") ||
    prefixMatchesIgnoreAsciiCase(t, "data:video/")
  );
}

/** 与后端 `community_post_media_url_prefixes` 逗号切分一致。 */
export function parseCommaSeparatedUrlPrefixes(raw: string | undefined): string[] {
  if (raw == null || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function readNextPublicCommunityPostMediaUrlPrefixes(): string[] {
  if (typeof process === "undefined") return [];
  return parseCommaSeparatedUrlPrefixes(process.env.NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES);
}

/** 与后端 `env_truthy_for_media_urls("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS")` 一致。 */
export function readNextPublicProductionSafeDefaultsTruthy(): boolean {
  if (typeof process === "undefined") return false;
  const t = (process.env.NEXT_PUBLIC_TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS ?? "").trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes";
}

/**
 * 对**已是** `http://` / `https://` 开头的字符串应用护栏；非 http(s)（相对路径、`blob:` 等）返回 **true**（与后端 walk 一致）。
 */
export function isAllowedCommunityEmbeddedHttpOrHttpsUrl(s: string): boolean {
  const t = s.trim();
  if (t.length === 0) return true;
  const isHttp = t.length >= 7 && t.slice(0, 7).toLowerCase() === "http://";
  const isHttps = t.length >= 8 && t.slice(0, 8).toLowerCase() === "https://";
  if (!isHttp && !isHttps) return true;

  if (readNextPublicProductionSafeDefaultsTruthy() && isHttp) return false;

  const prefixes = readNextPublicCommunityPostMediaUrlPrefixes();
  if (prefixes.length === 0) return true;
  return prefixes.some((p) => t.startsWith(p));
}

/** 视频帖手动 **`cover_url`**：站内上传路径或合法 http(s) 且通过前缀/禁 http 规则。 */
export function isAllowedCommunityVideoCoverUrl(s: string): boolean {
  const u = s.trim();
  if (!u) return false;
  if (u.startsWith("/api/v1/uploads/community-posts/") && !u.includes("..")) return true;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  } catch {
    return false;
  }
  return isAllowedCommunityEmbeddedHttpOrHttpsUrl(u);
}

/**
 * **`POST …/community/feedback`**：**`media_urls`** 中每条 **`http(s):`** 与发帖同源；**`data:`** / 非 http(s) 跳过（与后端 walker 一致）。
 * @returns **`media_url_invalid_scheme`** / **`media_url_prefix_not_allowed`** 或 **`null`**
 */
export function feedbackMediaEmbeddedPolicyViolationCode(urls: readonly string[]): string | null {
  for (const raw of urls) {
    const t = raw.trim();
    if (t.length === 0) continue;
    const isHttp = t.length >= 7 && t.slice(0, 7).toLowerCase() === "http://";
    const isHttps = t.length >= 8 && t.slice(0, 8).toLowerCase() === "https://";
    if (!isHttp && !isHttps) continue;
    if (readNextPublicProductionSafeDefaultsTruthy() && isHttp) return "media_url_invalid_scheme";
    const prefixes = readNextPublicCommunityPostMediaUrlPrefixes();
    if (prefixes.length > 0 && !prefixes.some((p) => t.startsWith(p))) {
      return "media_url_prefix_not_allowed";
    }
  }
  return null;
}
