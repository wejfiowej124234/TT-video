import { apiUrl } from "../../api";
import { routes } from "../../api/routes";
import { logApiJsonStatusNotOk, parseResponse, throwUnlessApiOk } from "../core";
import { isExpectedCommunityWriteRejection } from "@/lib/communityApiExpectedWriteRejection";
import { communityReadOk, defaultHeaders, merge429RetryAfterFromResponse } from "./internal";
import type { CommunityGetPostByIdResponse, CommunityPatchPostVisibilityResponse, CommunityWriteJsonResponse } from "./types";

/** 51-31-9 帖子详情 */
export async function getPostById(postId: string): Promise<CommunityGetPostByIdResponse> {
  const res = await fetch(apiUrl(routes.community.postById(postId)), {
    headers: defaultHeaders(),
  });
  return (await communityReadOk("community.getPostById", res)) as CommunityGetPostByIdResponse;
}

/** 31 §2.3：删除自己的帖子（`parseResponse` + `throwUnlessApiOk`；`delete_failed` 等为 **HTTP 5xx** 与 4xx；成功 **200** 时 `throwUnlessApiOk` 兜底 **`status:error`**，与 `core.ts` / 04 同源） */
export async function deletePost(postId: string): Promise<CommunityWriteJsonResponse> {
  const res = await fetch(apiUrl(routes.community.postById(postId)), {
    method: "DELETE",
    headers: defaultHeaders(),
  });
  const data: unknown = await parseResponse(res);
  logApiJsonStatusNotOk("community.deletePost", data);
  throwUnlessApiOk(data);
  return data as CommunityWriteJsonResponse;
}

/** 31 §2.3：更新帖子可见性（仅作者；`parseResponse` + `throwUnlessApiOk`，与 `deletePost` 同形） */
export async function patchPostVisibility(
  postId: string,
  visibility_status: "public" | "private" | "archived"
): Promise<CommunityPatchPostVisibilityResponse> {
  const res = await fetch(apiUrl(routes.community.postById(postId)), {
    method: "PATCH",
    headers: defaultHeaders(),
    body: JSON.stringify({ visibility_status }),
  });
  const data: unknown = await parseResponse(res);
  logApiJsonStatusNotOk("community.patchPostVisibility", data);
  throwUnlessApiOk(data);
  return data as CommunityPatchPostVisibilityResponse;
}

/**
 * **`POST /api/v1/community/posts/upload-media`**（31，需登录）：将 **`data:image/jpeg|png|webp;base64,…`** 或 **`data:video/mp4|webm;base64,…`** 解码落盘；裸 base64 走 **`.bin`** 提示分支（见实现）。返回站内 **`/api/v1/uploads/community-posts/{uuid}.{ext}`** 供 **`createPost`** **`media_urls`** 引用（勿依赖 **`blob:`** 持久化）。
 *
 * **上限**：解码后默认 **≤512KiB**，可由 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES`** 调至 **1024～980000**（与全局 **`REQUEST_BODY_LIMIT_BYTES`** 留余量）；实现见 **`crates/api/src/routes/community/media_upload/`**（**`handlers`/`payload`/`limits`**）。
 *
 * **成功**：**200** **`{ status:"ok", url }`**。**失败**：**400** 根级 **`error`/`message`** 同键（**`empty_body`**、**`unsupported_mime`**、**`invalid_file_type`**、**`mime_body_mismatch`**、**`invalid_base64`**、**`missing_base64_payload`**、**`file_too_large`** 等，常带 **`max_bytes`**；**MP4/WebM** 另可 **`video_too_long`** + **`max_duration_sec`**、**`video_metadata_unreadable`**）；**401** **`unauthorized`**；**500** **`mkdir_failed`** / **`write_failed`**。**04** §3.4 **`POST …/community/posts/upload-media`** 行。
 *
 * 匿名取流：**`GET /api/v1/uploads/community-posts/:name`**（与 **`frontend/lib/communityMediaClientUrl.ts`**、**04** 媒体拓扑对齐）。
 */
export async function uploadCommunityPostMedia(contentBase64: string): Promise<{
  status: string;
  url?: string;
  message?: string;
  error?: string;
  max_bytes?: number;
  /** **`video_too_long`** 时与后端 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC`** 对齐（默认 180） */
  max_duration_sec?: number;
  retry_after_sec?: number;
  retry_after_seconds?: number;
} | null> {
  const res = await fetch(apiUrl(routes.community.postsUploadMedia), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ content_base64: contentBase64 }),
  });
  const data: unknown = await res.json().catch(() => null);
  logApiJsonStatusNotOk("community.uploadCommunityPostMedia", data);
  if (data == null || typeof data !== "object") {
    const stub = res.ok
      ? null
      : { status: "error", message: `http_${res.status}`, error: `http_${res.status}` };
    return merge429RetryAfterFromResponse(res, stub) as typeof stub;
  }
  const o = data as {
    status: string;
    url?: string;
    message?: string;
    error?: string;
    max_bytes?: number;
    max_duration_sec?: number;
  };
  if (!res.ok && o.status === "ok") {
    return merge429RetryAfterFromResponse(res, {
      ...o,
      status: "error",
      message: o.message ?? o.error ?? `http_${res.status}`,
    }) as typeof o & { status: string; message: string };
  }
  return merge429RetryAfterFromResponse(res, o) as typeof o;
}

/**
 * 51-31-9 发帖。**`tags?`**：**每项** trim、**单条 UTF-8 字节 ≤ `COMMUNITY_FEED_TAG_QUERY_MAX_LEN`**（同 Rust **`str::len()`**）、去重后 **≤ `COMMUNITY_POST_TAGS_MAX_COUNT`**（**400** **`tag_too_long`** / **`tags_too_many`**，`errors.tags`）。**`media_urls` / `cover_url`** 内嵌 **`http(s):`** 受 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`**、**`TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS`** 约束（**400** **`media_url_*`**，与 **04**、**`market_subsite`** 同源）。可选前端预检见 **`communityPostMediaEmbeddedUrlPolicy`**、**`PublishDrawer`**、**`useCommunityFeed`**。
 */
export async function createPost(payload: {
  body: string;
  post_type?: string;
  destination?: string;
  /** 与 **`POST …/community/posts`** **`tags`** 校验同源（**`COMMUNITY_FEED_TAG_QUERY_MAX_LEN`** / **`COMMUNITY_POST_TAGS_MAX_COUNT`**）。 */
  tags?: string[];
  media_urls?: string[];
  /** 视频 + 对象存储启用时与 **`media_urls`** 同源校验；后端以 **`ready`** 资产填充 **`media_urls`**。 */
  media_asset_id?: string;
  /** 视频帖可选封面 URL（与 DB/API `cover_url` 一致） */
  cover_url?: string;
  /** 与 `commerce_showcase_kind` PG/API 同源（市场帖 ↔ 个人中心角标） */
  commerce_showcase_kind?: string;
  commerce_market_listing_id?: string;
}): Promise<{
  status: string;
  id?: string;
  /** 成功时与 **`GET …/feed`** 行字段同源（小写 **`post_type`**） */
  post_type?: string;
  media_urls?: string[];
  tags?: string[];
  cover_url?: string | null;
  message?: string;
  errors?: Record<string, string>;
  /** **HTTP 429** 时由 **`merge429RetryAfterFromResponse`** 从 **`Retry-After`** 注入 */
  retry_after_sec?: number;
  /** 与全局限流体 JSON 同源；展示层用 **`coalesceRetryAfterSecondsFromJson`** */
  retry_after_seconds?: number;
} | null> {
  const { media_asset_id, ...rest } = payload;
  const bodyJson =
    media_asset_id != null && String(media_asset_id).trim().length > 0
      ? { ...rest, media_asset_id: String(media_asset_id).trim() }
      : rest;
  const res = await fetch(apiUrl(routes.community.posts), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify(bodyJson),
  });
  const data = await res.json().catch(() => null);
  if (!data) return null;
  if (isExpectedCommunityWriteRejection(data)) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.debug("community.createPost expected write rejection:", data);
    }
  } else {
    logApiJsonStatusNotOk("community.createPost", data);
  }
  return merge429RetryAfterFromResponse(res, data) as {
    status: string;
    id?: string;
    post_type?: string;
    media_urls?: string[];
    tags?: string[];
    cover_url?: string | null;
    message?: string;
    errors?: Record<string, string>;
    retry_after_sec?: number;
    retry_after_seconds?: number;
  };
}
