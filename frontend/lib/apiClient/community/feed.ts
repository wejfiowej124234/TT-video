import { apiUrl, routes } from "../../api";
import { clampCommunityFeedListQueryLimit, communityPostTagWithinServerUtf8Limit } from "./constants";
import { communityReadOk, defaultHeaders } from "./internal";
import type { CommunityFeedPostListRow } from "./types";

/** 51-31-9 Feed 游标分页；mode=latest|recommend（时间倒序）、hot（赞+评，游标 `H|…`）、follow（关注流需登录）；tag 与帖子 tags[] 精确匹配（可选） */
export async function getFeed(params?: {
  cursor?: string;
  limit?: number;
  mode?: "recommend" | "latest" | "hot" | "follow";
  /** 与后端 `community_posts.tags` 某一元素精确相等；trim 后空或 **UTF-8 字节**超过 **`COMMUNITY_FEED_TAG_QUERY_MAX_LEN`** 时不发 **`tag`**（与后端忽略语义一致） */
  tag?: string;
  /** ② 附近锚点 / 距离（① 本地 enrich · `feed_geo.rs`） */
  anchor_poi_id?: string;
  max_distance_m?: number;
  anchor_lat?: number;
  anchor_lng?: number;
  /** Feed 正文/目的地 ILIKE（`latest`/`recommend`；有值时 `hot`/`follow` 亦回落时间序检索） */
  q?: string;
}): Promise<{
  status: string;
  posts?: CommunityFeedPostListRow[];
  next_cursor?: string;
  note?: string;
}> {
  const sp = new URLSearchParams();
  if (params?.cursor) sp.set("cursor", params.cursor);
  if (params?.limit != null) sp.set("limit", String(clampCommunityFeedListQueryLimit(Number(params.limit))));
  if (params?.mode) sp.set("mode", params.mode);
  if (params?.tag) {
    const tg = params.tag.trim();
    if (communityPostTagWithinServerUtf8Limit(tg)) {
      sp.set("tag", tg);
    }
  }
  if (params?.anchor_poi_id) sp.set("anchor_poi_id", params.anchor_poi_id);
  if (params?.max_distance_m != null && Number.isFinite(params.max_distance_m)) {
    sp.set("max_distance_m", String(Math.round(params.max_distance_m)));
  }
  if (params?.anchor_lat != null && Number.isFinite(params.anchor_lat)) {
    sp.set("anchor_lat", String(params.anchor_lat));
  }
  if (params?.anchor_lng != null && Number.isFinite(params.anchor_lng)) {
    sp.set("anchor_lng", String(params.anchor_lng));
  }
  if (params?.q) {
    const q = params.q.trim().slice(0, 64);
    if (q.length > 0) sp.set("q", q);
  }
  const url = routes.community.feed + (sp.toString() ? `?${sp}` : "");
  const res = await fetch(apiUrl(url), { headers: defaultHeaders() });
  return (await communityReadOk("community.getFeed", res)) as {
    status: string;
    posts?: CommunityFeedPostListRow[];
    next_cursor?: string;
    note?: string;
  };
}

/** 指定用户的公开帖子（游标分页；无需登录） */
export async function getUserPosts(
  userId: string,
  params?: {
    cursor?: string;
    limit?: number;
    /** 31 §2.3：仅当当前登录用户即该 `userId` 时后端生效；`all` 不传参 */
    visibility?: "all" | "public" | "private" | "archived";
  }
): Promise<{
  status: string;
  posts?: CommunityFeedPostListRow[];
  next_cursor?: string;
  note?: string;
}> {
  const sp = new URLSearchParams();
  if (params?.cursor) sp.set("cursor", params.cursor);
  if (params?.limit != null) sp.set("limit", String(clampCommunityFeedListQueryLimit(Number(params.limit))));
  if (params?.visibility && params.visibility !== "all") sp.set("visibility", params.visibility);
  const url = routes.community.userPosts(userId) + (sp.toString() ? `?${sp}` : "");
  const res = await fetch(apiUrl(url), { headers: defaultHeaders() });
  return (await communityReadOk("community.getUserPosts", res)) as {
    status: string;
    posts?: CommunityFeedPostListRow[];
    next_cursor?: string;
    note?: string;
  };
}

/** 31 §2.1：话题下公开帖子总数（与 Feed **`tag`** 精确匹配；trim、**UTF-8 字节 `1..=COMMUNITY_FEED_TAG_QUERY_MAX_LEN`** 与 stats 路由一致） */
export async function getPublicPostsByTagCount(tag: string): Promise<{
  status: string;
  tag?: string;
  post_count?: number;
  note?: string;
}> {
  const t = typeof tag === "string" ? tag.trim() : "";
  if (!t.length) {
    throw new Error("tag_required");
  }
  if (!communityPostTagWithinServerUtf8Limit(t)) {
    throw new Error("tag_too_long");
  }
  const sp = new URLSearchParams();
  sp.set("tag", t);
  const res = await fetch(apiUrl(`${routes.community.statsPostsByTag}?${sp}`), { headers: defaultHeaders() });
  return (await communityReadOk("community.getPublicPostsByTagCount", res)) as {
    status: string;
    tag?: string;
    post_count?: number;
    note?: string;
  };
}

/** 51-31-19 我的帖子（游标分页） */
export async function getMyPosts(params?: {
  cursor?: string;
  limit?: number;
  /** 31 §2.3：`all`（省略）| `public` | `private` | `archived` */
  visibility?: "all" | "public" | "private" | "archived";
}): Promise<{
  status: string;
  posts?: CommunityFeedPostListRow[];
  next_cursor?: string;
  note?: string;
}> {
  const sp = new URLSearchParams();
  if (params?.cursor) sp.set("cursor", params.cursor);
  if (params?.limit != null) sp.set("limit", String(clampCommunityFeedListQueryLimit(Number(params.limit))));
  if (params?.visibility && params.visibility !== "all") sp.set("visibility", params.visibility);
  const url = routes.community.mePosts + (sp.toString() ? `?${sp}` : "");
  const res = await fetch(apiUrl(url), { headers: defaultHeaders() });
  return (await communityReadOk("community.getMyPosts", res)) as {
    status: string;
    posts?: CommunityFeedPostListRow[];
    next_cursor?: string;
    note?: string;
  };
}
