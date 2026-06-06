import { apiUrl, routes } from "../../api";
import { clampCommunityCommentListQueryLimit } from "./constants";
import { communityReadOk, communityWriteJsonBody, defaultHeaders } from "./internal";
import type { CommunityCommentListRow, CommunityCommentSort, CommunityCommentSortQueryInput, CommunityWriteJsonResponse } from "./types";

/** 51-31-8 点赞 */
export async function postLike(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postLike(postId)), {
    method: "POST",
    headers: defaultHeaders(),
  });
  return (await communityWriteJsonBody("community.postLike", res)) as CommunityWriteJsonResponse | null;
}

/** 51-31-8 取消点赞 */
export async function deleteLike(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postLike(postId)), {
    method: "DELETE",
    headers: defaultHeaders(),
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
    headers: defaultHeaders(),
    body: JSON.stringify({ body, parent_id: parentId ?? null }),
  });
  return (await communityWriteJsonBody("community.postComment", res)) as CommunityWriteJsonResponse | null;
}

function canonicalCommentSortForQuery(sort: CommunityCommentSortQueryInput | undefined): CommunityCommentSort {
  const s = sort ?? "chronological";
  if (typeof s === "string" && s.trim().toLowerCase() === "hottest") return "hot";
  if (s === "chronological" || s === "latest" || s === "hot") return s;
  return "chronological";
}

/**
 * 纯函数：构造 **`GET …/community/posts/:id/comments`** 查询串（无 I/O）。
 * 与 **`crates/api/src/routes/community/posts/types.rs`** **`CommentsQuery`** 语义对齐（**`cursor` 强制 `sort=chronological`**；默认 chrono 不传 **`sort`**）。
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
