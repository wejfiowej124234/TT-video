import { apiUrl, routes } from "../../api";
import { clampCommunityCommentListQueryLimit } from "./constants";
import { communityReadOk, communityWriteHeaders, communityWriteJsonBody, defaultHeaders } from "./internal";
import { logApiJsonStatusNotOk, parseResponse, throwUnlessApiOk } from "../core";
import type { CommunityCommentListRow, CommunityCommentSort, CommunityCommentSortQueryInput, CommunityWriteJsonResponse } from "./types";
import { isCommunityOptimisticCommentId } from "@/components/community/communityFeedConstants";

/** FE fail-closed：乐观 id 不得出站 DELETE（否则 Official 400 invalid_id）。 */
export const COMMUNITY_COMMENT_OPTIMISTIC_DELETE_FORBIDDEN = "comment_optimistic_id_forbidden" as const;

/**
 * 同帖同文同父评：稳定幂等键，避免双击/重试用新 Idempotency-Key 再插一条后撞 `comment_duplicate`。
 * 与后端 content-duplicate 窗同语义（刻意同文重发仍走同一键）。
 */
export function communityCommentIdempotencyKey(postId: string, body: string, parentId?: string): string {
  const raw = `${postId}\0${parentId ?? ""}\0${body.trim()}`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const digest = (h >>> 0).toString(16).padStart(8, "0");
  // 再叠一段长度指纹，降低短文碰撞
  let h2 = 0;
  for (let i = 0; i < raw.length; i++) h2 = (h2 * 31 + raw.charCodeAt(i)) >>> 0;
  return `tt-cmt-${digest}-${h2.toString(16)}`;
}

/** 51-31-8 点赞 */
export async function postLike(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postLike(postId)), {
    method: "POST",
    headers: communityWriteHeaders(),
  });
  return (await communityWriteJsonBody("community.postLike", res)) as CommunityWriteJsonResponse | null;
}

/** 51-31-8 取消点赞 */
export async function deleteLike(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postLike(postId)), {
    method: "DELETE",
    headers: communityWriteHeaders(),
  });
  return (await communityWriteJsonBody("community.deleteLike", res)) as CommunityWriteJsonResponse | null;
}

export async function postComment(
  postId: string,
  body: string,
  parentId?: string
): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postComments(postId)), {
    method: "POST",
    headers: communityWriteHeaders(communityCommentIdempotencyKey(postId, body, parentId)),
    body: JSON.stringify({ body, parent_id: parentId ?? null }),
  });
  return (await communityWriteJsonBody("community.postComment", res)) as CommunityWriteJsonResponse | null;
}

/** R-COMM-COMMENT-DELETE-1 · 仅评论作者可删（幂等二次 → already_deleted） */
export async function deleteComment(
  postId: string,
  commentId: string,
): Promise<CommunityWriteJsonResponse & { deleted?: boolean; already_deleted?: boolean; removed_visible_count?: number }> {
  if (isCommunityOptimisticCommentId(commentId)) {
    throw new Error(COMMUNITY_COMMENT_OPTIMISTIC_DELETE_FORBIDDEN);
  }
  // Prefer postComments()+id so delete works even if api.ts drifts from routesCommunity.postCommentById
  const res = await fetch(apiUrl(`${routes.community.postComments(postId)}/${encodeURIComponent(commentId)}`), {
    method: "DELETE",
    headers: communityWriteHeaders(),
  });
  const data: unknown = await parseResponse(res);
  logApiJsonStatusNotOk("community.deleteComment", data);
  throwUnlessApiOk(data);
  return data as CommunityWriteJsonResponse & {
    deleted?: boolean;
    already_deleted?: boolean;
    removed_visible_count?: number;
  };
}

function canonicalCommentSortForQuery(sort: CommunityCommentSortQueryInput | undefined): CommunityCommentSort {
  const s = sort ?? "hot";
  if (typeof s === "string" && s.trim().toLowerCase() === "hottest") return "hot";
  if (s === "chronological" || s === "latest" || s === "hot") return s;
  return "hot";
}

/**
 * 纯函数：构造 **`GET …/community/posts/:id/comments`** 查询串（无 I/O）。
 * 与后端 CommentsQuery 对齐：`cursor` 强制 `sort=chronological`；默认 **`hot`**（回复数↓ + 时间↑）。
 */
export function buildCommunityPostCommentsQueryString(options?: {
  sort?: CommunityCommentSortQueryInput;
  /** 1～**`COMMUNITY_COMMENT_LIST_API_MAX`** */
  limit?: number;
  cursor?: string;
}): string {
  const sp = new URLSearchParams();
  const sort = canonicalCommentSortForQuery(options?.sort);
  const cursorTrim = options?.cursor?.trim();
  if (cursorTrim) {
    sp.set("cursor", cursorTrim);
    sp.set("sort", "chronological");
  } else if (sort === "hot") {
    sp.set("sort", "hot");
  } else if (sort !== "chronological") {
    sp.set("sort", sort);
  }
  if (options?.limit != null && Number.isFinite(options.limit)) {
    sp.set("limit", String(clampCommunityCommentListQueryLimit(Number(options.limit))));
  }
  return sp.toString();
}

export async function getPostComments(
  postId: string,
  options?: {
    sort?: CommunityCommentSortQueryInput;
    /** 1～**`COMMUNITY_COMMENT_LIST_API_MAX`**；仅 chronological 时作为 SQL LIMIT；与 04 GET …/comments 对拍 */
    limit?: number;
    /** **`chronological` 根评游标**（`C|RFC3339|uuid`）；与后端 **`GET …/comments?cursor=`** 同源；传此参数时强制 **`sort=chronological`**。 */
    cursor?: string;
  }
): Promise<{
  status: string;
  comments?: CommunityCommentListRow[];
  /** 仅 **`sort=chronological`**：下一页根评 keyset；无更多则为 **undefined** */
  next_cursor?: string | null;
  note?: string;
  message?: string;
}> {
  const qs = buildCommunityPostCommentsQueryString(options);
  const path = routes.community.postComments(postId) + (qs ? `?${qs}` : "");
  const res = await fetch(apiUrl(path), {
    headers: defaultHeaders(),
  });
  return (await communityReadOk("community.getPostComments", res)) as {
    status: string;
    comments?: CommunityCommentListRow[];
    next_cursor?: string | null;
    note?: string;
    message?: string;
  };
}
