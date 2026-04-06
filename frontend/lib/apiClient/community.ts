/**
 * 50-O-31 / 51-31-9 社区 API（31 附录 §11、§7）；有 DB 时后端返回真实数据，无 DB 时占位 JSON。
 * 前端页面不再用本地 MOCK 帖子/会话兜底，空列表即空态。
 */

import { apiUrl, routes } from "../api";
import { getAuthHeaders, requestId, logApiJsonStatusNotOk, parseResponse, throwUnlessApiOk } from "./core";

const defaultHeaders = (): Record<string, string> => ({
  "x-request-id": requestId(),
  "Content-Type": "application/json",
  ...getAuthHeaders(),
});

/** GET 等：与主站 apiClient 一致，HTTP 2xx 且根级 envelope `status !== "ok"` 时抛错，便于 `.catch` + `mapApiReadError` */
async function communityReadOk(context: string, res: Response): Promise<unknown> {
  const data = await parseResponse(res);
  logApiJsonStatusNotOk(context, data);
  throwUnlessApiOk(data);
  return data;
}

/** POST 等：无论 HTTP 是否 2xx 都解析 JSON，便于读取 `status`/`message` */
async function communityJsonBody(context: string, res: Response): Promise<unknown | null> {
  const data: unknown = await res.json().catch(() => null);
  logApiJsonStatusNotOk(context, data);
  return data;
}

/** 51-31-9 Feed 游标分页；mode=latest|recommend（时间倒序）、hot（赞+评，游标 `H|…`）、follow（关注流需登录）；tag 与帖子 tags[] 精确匹配（可选） */
export async function getFeed(params?: {
  cursor?: string;
  limit?: number;
  mode?: "recommend" | "latest" | "hot" | "follow";
  /** 与后端 `community_posts.tags` 某一元素精确相等；缺省不按标签过滤 */
  tag?: string;
}): Promise<{
  status: string;
  posts?: Array<{
    id: string;
    user_id: string;
    body: string;
    post_type: string;
    destination?: string;
    tags: string[];
    media_urls: string[];
    created_at: string;
    like_count?: number;
    comment_count?: number;
    collect_count?: number;
    liked_by_me?: boolean;
    collected_by_me?: boolean;
    /** 07 §五 5.3B：批量作者展示（与 `communityFeedMappers.ApiPostInput` 一致） */
    author_nickname?: string | null;
    author_avatar_url?: string | null;
    author_role?: string | null;
    author_is_escrow_guide?: boolean | null;
    author_default_wallet?: string | null;
    cover_url?: string | null;
    evidence_anchored?: boolean | null;
  }>;
  next_cursor?: string;
  note?: string;
}> {
  const sp = new URLSearchParams();
  if (params?.cursor) sp.set("cursor", params.cursor);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.mode) sp.set("mode", params.mode);
  if (params?.tag) sp.set("tag", params.tag);
  const url = routes.community.feed + (sp.toString() ? `?${sp}` : "");
  const res = await fetch(apiUrl(url), { headers: defaultHeaders() });
  return (await communityReadOk("community.getFeed", res)) as {
    status: string;
    posts?: Array<{
      id: string;
      user_id: string;
      body: string;
      post_type: string;
      destination?: string;
      tags: string[];
      media_urls: string[];
      created_at: string;
      like_count?: number;
      comment_count?: number;
      collect_count?: number;
      liked_by_me?: boolean;
      collected_by_me?: boolean;
      author_nickname?: string | null;
      author_avatar_url?: string | null;
      author_role?: string | null;
      author_is_escrow_guide?: boolean | null;
      author_default_wallet?: string | null;
      cover_url?: string | null;
      evidence_anchored?: boolean | null;
    }>;
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
  posts?: Array<{
    id: string;
    user_id: string;
    body: string;
    post_type: string;
    destination?: string;
    tags: string[];
    media_urls: string[];
    created_at: string;
    like_count?: number;
    comment_count?: number;
    collect_count?: number;
    liked_by_me?: boolean;
    collected_by_me?: boolean;
    /** 07 §五 5.3B：批量作者展示（与 `communityFeedMappers.ApiPostInput` 一致） */
    author_nickname?: string | null;
    author_avatar_url?: string | null;
    author_role?: string | null;
    author_is_escrow_guide?: boolean | null;
    author_default_wallet?: string | null;
    cover_url?: string | null;
    evidence_anchored?: boolean | null;
  }>;
  next_cursor?: string;
  note?: string;
}> {
  const sp = new URLSearchParams();
  if (params?.cursor) sp.set("cursor", params.cursor);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.visibility && params.visibility !== "all") sp.set("visibility", params.visibility);
  const url = routes.community.userPosts(userId) + (sp.toString() ? `?${sp}` : "");
  const res = await fetch(apiUrl(url), { headers: defaultHeaders() });
  return (await communityReadOk("community.getUserPosts", res)) as {
    status: string;
    posts?: Array<{
      id: string;
      user_id: string;
      body: string;
      post_type: string;
      destination?: string;
      tags: string[];
      media_urls: string[];
      created_at: string;
      like_count?: number;
      comment_count?: number;
      collect_count?: number;
      liked_by_me?: boolean;
      collected_by_me?: boolean;
      author_nickname?: string | null;
      author_avatar_url?: string | null;
      author_role?: string | null;
      author_is_escrow_guide?: boolean | null;
      author_default_wallet?: string | null;
      cover_url?: string | null;
      evidence_anchored?: boolean | null;
    }>;
    next_cursor?: string;
    note?: string;
  };
}

/** 31 §2.1：话题下公开帖子总数（与 Feed `tag` 精确匹配） */
export async function getPublicPostsByTagCount(tag: string): Promise<{
  status: string;
  tag?: string;
  post_count?: number;
  note?: string;
}> {
  const sp = new URLSearchParams();
  sp.set("tag", tag);
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
  posts?: Array<{
    id: string;
    user_id: string;
    body: string;
    post_type: string;
    destination?: string;
    tags: string[];
    media_urls: string[];
    created_at: string;
    like_count?: number;
    comment_count?: number;
    collect_count?: number;
    liked_by_me?: boolean;
    collected_by_me?: boolean;
    /** 07 §五 5.3B：批量作者展示（与 `communityFeedMappers.ApiPostInput` 一致） */
    author_nickname?: string | null;
    author_avatar_url?: string | null;
    author_role?: string | null;
    author_is_escrow_guide?: boolean | null;
    author_default_wallet?: string | null;
    cover_url?: string | null;
    evidence_anchored?: boolean | null;
  }>;
  next_cursor?: string;
  note?: string;
}> {
  const sp = new URLSearchParams();
  if (params?.cursor) sp.set("cursor", params.cursor);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.visibility && params.visibility !== "all") sp.set("visibility", params.visibility);
  const url = routes.community.mePosts + (sp.toString() ? `?${sp}` : "");
  const res = await fetch(apiUrl(url), { headers: defaultHeaders() });
  return (await communityReadOk("community.getMyPosts", res)) as {
    status: string;
    posts?: Array<{
      id: string;
      user_id: string;
      body: string;
      post_type: string;
      destination?: string;
      tags: string[];
      media_urls: string[];
      created_at: string;
      like_count?: number;
      comment_count?: number;
      collect_count?: number;
      liked_by_me?: boolean;
      collected_by_me?: boolean;
      author_nickname?: string | null;
      author_avatar_url?: string | null;
      author_role?: string | null;
      author_is_escrow_guide?: boolean | null;
      author_default_wallet?: string | null;
      cover_url?: string | null;
      evidence_anchored?: boolean | null;
    }>;
    next_cursor?: string;
    note?: string;
  };
}

/**
 * GET …/posts/:id 内嵌 `post`（`community.rs` get_post_detail；与 Feed 行、`ApiPostInput` 对齐，便于 `mapApiPostToCommunityPost`）。
 * HTTP 非 2xx 或根级 **`status !== "ok"`** 时抛错（**`communityReadOk`**）；成功时 **`post`** 可为 **`null`**（未找到/无权限等由后端以 **`status: "ok"`** 表达时仍返回体，否则进错误 envelope 并抛错）。
 */
export type CommunityApiPostDetailRow = {
  id: string;
  user_id: string;
  body: string;
  post_type: string;
  destination?: string;
  tags: string[];
  media_urls: string[];
  created_at: string;
  like_count?: number;
  comment_count?: number;
  collect_count?: number;
  liked_by_me?: boolean;
  collected_by_me?: boolean;
  author_nickname?: string | null;
  author_avatar_url?: string | null;
  author_role?: string | null;
  author_is_escrow_guide?: boolean | null;
  author_default_wallet?: string | null;
  cover_url?: string | null;
  evidence_anchored?: boolean | null;
  visibility_status?: string | null;
};

export type CommunityGetPostByIdResponse = {
  status: string;
  post?: CommunityApiPostDetailRow | null;
  note?: string;
  message?: string;
};

/** 51-31-9 帖子详情 */
export async function getPostById(postId: string): Promise<CommunityGetPostByIdResponse> {
  const res = await fetch(apiUrl(routes.community.postById(postId)), {
    headers: defaultHeaders(),
  });
  return (await communityReadOk("community.getPostById", res)) as CommunityGetPostByIdResponse;
}

/** 31 §2.3：删除自己的帖子（HTTP 4xx/5xx 仍解析 JSON，便于 `messageForCommunityActionResponse`） */
export async function deletePost(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postById(postId)), {
    method: "DELETE",
    headers: defaultHeaders(),
  });
  const data: unknown = await res.json().catch(() => null);
  logApiJsonStatusNotOk("community.deletePost", data);
  if (data == null || typeof data !== "object") return null;
  return data as CommunityWriteJsonResponse;
}

/** 31 §2.3：更新帖子可见性（仅作者） */
export async function patchPostVisibility(
  postId: string,
  visibility_status: "public" | "private" | "archived"
): Promise<CommunityPatchPostVisibilityResponse | null> {
  const res = await fetch(apiUrl(routes.community.postById(postId)), {
    method: "PATCH",
    headers: defaultHeaders(),
    body: JSON.stringify({ visibility_status }),
  });
  const data: unknown = await res.json().catch(() => null);
  logApiJsonStatusNotOk("community.patchPostVisibility", data);
  if (data == null || typeof data !== "object") return null;
  return data as CommunityPatchPostVisibilityResponse;
}

/** 51-31-9 发帖 */
export async function createPost(payload: {
  body: string;
  post_type?: string;
  destination?: string;
  tags?: string[];
  media_urls?: string[];
  /** 视频帖可选封面 URL（与 DB/API `cover_url` 一致） */
  cover_url?: string;
}): Promise<{ status: string; id?: string; message?: string; errors?: Record<string, string> } | null> {
  const res = await fetch(apiUrl(routes.community.posts), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!data) return null;
  logApiJsonStatusNotOk("community.createPost", data);
  return data as { status: string; id?: string; message?: string; errors?: Record<string, string> };
}

/**
 * 社区写操作常见 JSON（`community.rs`：`status` + 可选 `message` / `errors` / `note`；
 * 评论成功可带 `id`、`visibility_status`、`risk_level`）。
 */
export type CommunityWriteJsonResponse = {
  status: string;
  message?: string;
  errors?: Record<string, string>;
  note?: string;
  id?: string | null;
  visibility_status?: string;
  risk_level?: number;
};

/** 31 §2.3：`PATCH …/posts/:id` 成功响应带服务端回显 `visibility_status`（`community.rs`） */
export type CommunityPatchPostVisibilityResponse = CommunityWriteJsonResponse & {
  visibility_status?: string;
};

/** 31 §2.2：GET …/comments 列表行（含作者 enrichment、可见性/风控字段） */
export type CommunityCommentListRow = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  body: string;
  created_at: string;
  visibility_status?: string;
  risk_level?: number | string;
  body_is_redacted?: boolean;
  author_nickname?: string;
  author_avatar_url?: string | null;
  author_role?: string | null;
  author_is_escrow_guide?: boolean | null;
  author_default_wallet?: string | null;
};

/** 51-31-8 点赞 */
export async function postLike(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postLike(postId)), {
    method: "POST",
    headers: defaultHeaders(),
  });
  return (await communityJsonBody("community.postLike", res)) as CommunityWriteJsonResponse | null;
}

/** 51-31-8 取消点赞 */
export async function deleteLike(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postLike(postId)), {
    method: "DELETE",
    headers: defaultHeaders(),
  });
  return (await communityJsonBody("community.deleteLike", res)) as CommunityWriteJsonResponse | null;
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
  return (await communityJsonBody("community.postComment", res)) as CommunityWriteJsonResponse | null;
}

/** 31 §2.2：GET comments `?sort=` */
export type CommunityCommentSort = "chronological" | "latest" | "hot";

export async function getPostComments(
  postId: string,
  options?: { sort?: CommunityCommentSort }
): Promise<{
  status: string;
  comments?: CommunityCommentListRow[];
  note?: string;
  message?: string;
}> {
  const sp = new URLSearchParams();
  const sort = options?.sort ?? "chronological";
  if (sort !== "chronological") {
    sp.set("sort", sort);
  }
  const qs = sp.toString();
  const path = routes.community.postComments(postId) + (qs ? `?${qs}` : "");
  const res = await fetch(apiUrl(path), {
    headers: defaultHeaders(),
  });
  return (await communityReadOk("community.getPostComments", res)) as {
    status: string;
    comments?: CommunityCommentListRow[];
    note?: string;
    message?: string;
  };
}

/** GET …/conversations 单行（`community.rs` list_conversations_enriched） */
export type CommunityConversationRow = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  last_message?: string;
  last_message_at?: string | null;
  last_sender_id?: string | null;
  unread_count?: number;
  peer_id?: string;
  peer_nickname?: string;
  peer_avatar_url?: string | null;
  peer_role?: string | null;
  peer_is_escrow_guide?: boolean | null;
  peer_default_wallet?: string | null;
};

/** GET …/conversations/:id/messages 单行 */
export type CommunityDmMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export async function getConversations(): Promise<{
  status: string;
  conversations?: CommunityConversationRow[];
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.conversations), {
    headers: defaultHeaders(),
  });
  return (await communityReadOk("community.getConversations", res)) as {
    status: string;
    conversations?: CommunityConversationRow[];
    note?: string;
    message?: string;
  };
}

export async function getConversationMessages(conversationId: string): Promise<{
  status: string;
  messages?: CommunityDmMessageRow[];
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.conversationMessages(conversationId)), {
    headers: defaultHeaders(),
  });
  return (await communityReadOk("community.getConversationMessages", res)) as {
    status: string;
    messages?: CommunityDmMessageRow[];
    note?: string;
    message?: string;
  };
}

/** 51-31-6：发送私信 */
export async function postConversationMessage(
  conversationId: string,
  body: string
): Promise<{ status: string; id?: string | null; message?: string } | null> {
  const res = await fetch(apiUrl(routes.community.conversationMessages(conversationId)), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ body }),
  });
  return (await communityJsonBody("community.postConversationMessage", res)) as {
    status: string;
    id?: string | null;
    message?: string;
    errors?: Record<string, string>;
  } | null;
}

/** 关注/粉丝/好友列表项（`community.rs` `user_ids_to_json_profiles` / 04 §3.4） */
export type CommunityPublicUserRow = {
  id: string;
  nickname?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  is_escrow_guide?: boolean | null;
  default_wallet_address?: string | null;
};

/** GET …/friends/requests：他人发来的待处理申请 */
export type CommunityFriendRequestReceivedRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at?: string;
  from_nickname?: string;
  from_avatar_url?: string | null;
  from_role?: string | null;
  from_is_escrow_guide?: boolean | null;
  from_default_wallet?: string | null;
};

/** GET …/friends/requests/sent：我发出的待处理申请 */
export type CommunityFriendRequestSentRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at?: string;
  to_nickname?: string;
  to_avatar_url?: string | null;
  to_role?: string | null;
  to_is_escrow_guide?: boolean | null;
  to_default_wallet?: string | null;
};

export async function getMeFollowing(): Promise<{
  status: string;
  following?: CommunityPublicUserRow[];
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.meFollowing), { headers: defaultHeaders() });
  return (await communityReadOk("community.getMeFollowing", res)) as {
    status: string;
    following?: CommunityPublicUserRow[];
    note?: string;
    message?: string;
  };
}

export async function getMeFollowers(): Promise<{
  status: string;
  followers?: CommunityPublicUserRow[];
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.meFollowers), { headers: defaultHeaders() });
  return (await communityReadOk("community.getMeFollowers", res)) as {
    status: string;
    followers?: CommunityPublicUserRow[];
    note?: string;
    message?: string;
  };
}

export async function getFriendsList(): Promise<{
  status: string;
  friends?: CommunityPublicUserRow[];
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.friendsList), { headers: defaultHeaders() });
  return (await communityReadOk("community.getFriendsList", res)) as {
    status: string;
    friends?: CommunityPublicUserRow[];
    note?: string;
    message?: string;
  };
}

export async function getFriendsRequests(): Promise<{
  status: string;
  requests?: CommunityFriendRequestReceivedRow[];
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.friendsRequests), { headers: defaultHeaders() });
  return (await communityReadOk("community.getFriendsRequests", res)) as {
    status: string;
    requests?: CommunityFriendRequestReceivedRow[];
    note?: string;
    message?: string;
  };
}

/** 当前用户发出的待处理好友申请 */
export async function getFriendsRequestsSent(): Promise<{
  status: string;
  requests?: CommunityFriendRequestSentRow[];
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.friendsRequestsSent), { headers: defaultHeaders() });
  return (await communityReadOk("community.getFriendsRequestsSent", res)) as {
    status: string;
    requests?: CommunityFriendRequestSentRow[];
    note?: string;
    message?: string;
  };
}

/** 我的帖子收到的点赞总数 */
export async function getMeLikesReceived(): Promise<{ status: string; likes_received?: number }> {
  const res = await fetch(apiUrl(routes.community.meLikesReceived), { headers: defaultHeaders() });
  return (await communityReadOk("community.getMeLikesReceived", res)) as {
    status: string;
    likes_received?: number;
  };
}

/** 31 §5：关注用户（POST /api/v1/community/users/:id/follow） */
export async function postUserFollow(userId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.userFollow(userId)), {
    method: "POST",
    headers: defaultHeaders(),
  });
  return (await communityJsonBody("community.postUserFollow", res)) as CommunityWriteJsonResponse | null;
}

/** 31 §5：取消关注用户（DELETE /api/v1/community/users/:id/follow） */
export async function deleteUserFollow(userId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.userFollow(userId)), {
    method: "DELETE",
    headers: defaultHeaders(),
  });
  return (await communityJsonBody("community.deleteUserFollow", res)) as CommunityWriteJsonResponse | null;
}

/** 31 §5：发送好友请求（POST /api/v1/community/friends/request） */
export async function postFriendsRequest(userId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.friendsRequest), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });
  return (await communityJsonBody("community.postFriendsRequest", res)) as CommunityWriteJsonResponse | null;
}

/** 31 §5：接受好友请求（POST /api/v1/community/friends/accept） */
export async function postFriendsAccept(requestId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.friendsAccept), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ request_id: requestId }),
  });
  return (await communityJsonBody("community.postFriendsAccept", res)) as CommunityWriteJsonResponse | null;
}

/** 拒绝好友请求（POST /api/v1/community/friends/reject） */
export async function postFriendsReject(requestId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.friendsReject), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ request_id: requestId }),
  });
  return (await communityJsonBody("community.postFriendsReject", res)) as CommunityWriteJsonResponse | null;
}

export async function getMeCollects(): Promise<{
  status: string;
  collects?: Array<{ post_id?: string }>;
  note?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.meCollects), { headers: defaultHeaders() });
  return (await communityReadOk("community.getMeCollects", res)) as {
    status: string;
    collects?: Array<{ post_id?: string }>;
    note?: string;
    message?: string;
  };
}

/** 51-31-8：收藏帖子 */
export async function postCollect(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postCollect(postId)), {
    method: "POST",
    headers: defaultHeaders(),
  });
  return (await communityJsonBody("community.postCollect", res)) as CommunityWriteJsonResponse | null;
}

/** 51-31-8：取消收藏 */
export async function deleteCollect(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postCollect(postId)), {
    method: "DELETE",
    headers: defaultHeaders(),
  });
  return (await communityJsonBody("community.deleteCollect", res)) as CommunityWriteJsonResponse | null;
}

/** 55-S10 / 54-S19：反馈列表（需登录） */
export async function getFeedbackList(): Promise<{
  status: string;
  items?: Array<{
    id: string;
    category: string;
    content: string;
    status: string;
    official_reply?: string | null;
    media_urls?: string[];
    created_at: string;
    updated_at: string;
  }>;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.feedback), { headers: defaultHeaders() });
  return (await communityReadOk("community.getFeedbackList", res)) as {
    status: string;
    items?: Array<{
      id: string;
      category: string;
      content: string;
      status: string;
      official_reply?: string | null;
      media_urls?: string[];
      created_at: string;
      updated_at: string;
    }>;
    message?: string;
  };
}

/** 55-S10 / 54-S19：提交反馈（需登录）；HTTP 非 2xx 仍解析 JSON 以便读取 `status`/`errors` */
export async function postFeedback(params: {
  category: string;
  content: string;
  /** 可选；与后端 `community_feedback.media_urls` 一致，最多 4 条 */
  media_urls?: string[];
}): Promise<(CommunityWriteJsonResponse & { id?: string }) | null> {
  const body: Record<string, unknown> = { category: params.category, content: params.content };
  if (params.media_urls && params.media_urls.length > 0) {
    body.media_urls = params.media_urls;
  }
  const res = await fetch(apiUrl(routes.community.feedback), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => null);
  logApiJsonStatusNotOk("community.postFeedback", data);
  if (data == null || typeof data !== "object") return null;
  return data as CommunityWriteJsonResponse & { id?: string };
}

/** 160：`POST /api/v1/community/reports` 与 04 §3.4 一致 */
export type CommunityReportReasonCode =
  | "spam"
  | "harassment"
  | "scam"
  | "illegal"
  | "hate"
  | "other";

export type CommunityReportTargetType = "post" | "user" | "comment" | "message" | "other";

/** 160：`GET …/me/reports` 行 / `GET …/reports/:id` 的 `report`（`community.rs`） */
export type CommunityReportTicketRow = {
  id: string;
  target_type: string;
  target_id: string;
  reason_code: string;
  details?: string | null;
  evidence_ref?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CommunityGetMyReportsResponse = {
  status: string;
  items?: CommunityReportTicketRow[];
  message?: string;
};

export type CommunityGetReportDetailResponse = {
  status: string;
  report?: CommunityReportTicketRow;
  message?: string;
};

/** `POST …/reports/:id/appeals` 成功时可带 `report_id` */
export type CommunityReportAppealResponse = CommunityWriteJsonResponse & {
  report_id?: string;
};

/** HTTP 非 2xx（含 429）仍解析 JSON，供 `interpretCommunityWriteError` */
export async function postCommunityReport(payload: {
  target_type: CommunityReportTargetType;
  target_id: string;
  reason_code: CommunityReportReasonCode;
  details?: string;
  evidence_ref?: string;
}): Promise<CommunityWriteJsonResponse | null> {
  const body: Record<string, string> = {
    target_type: payload.target_type,
    target_id: payload.target_id.trim(),
    reason_code: payload.reason_code,
  };
  const d = payload.details?.trim();
  if (d) body.details = d;
  const ev = payload.evidence_ref?.trim();
  if (ev) body.evidence_ref = ev;
  const res = await fetch(apiUrl(routes.community.reports), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify(body),
  });
  return (await communityJsonBody("community.postCommunityReport", res)) as CommunityWriteJsonResponse | null;
}

/** 160：`GET …/me/reports` 当前用户提交的举报列表（`limit` 默认 30，最大 100） */
export async function getMyCommunityReports(params?: { limit?: number }): Promise<CommunityGetMyReportsResponse> {
  const lim = params?.limit;
  const q =
    typeof lim === "number" && Number.isFinite(lim) && lim > 0
      ? `?limit=${encodeURIComponent(String(Math.min(100, Math.floor(lim))))}`
      : "";
  const res = await fetch(apiUrl(`${routes.community.meReports}${q}`), {
    headers: defaultHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("community.getMyCommunityReports", data);
  throwUnlessApiOk(data);
  return data as CommunityGetMyReportsResponse;
}

/** 160：`GET …/reports/:id`（仅举报人，见 04 §3.4） */
export async function getCommunityReport(reportId: string): Promise<CommunityGetReportDetailResponse> {
  const res = await fetch(apiUrl(routes.community.reportById(reportId.trim())), {
    headers: defaultHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("community.getCommunityReport", data);
  throwUnlessApiOk(data);
  return data as CommunityGetReportDetailResponse;
}

/** 160：结案后申诉 `POST …/reports/:id/appeals` */
export async function postCommunityReportAppeal(
  reportId: string,
  bodyText: string
): Promise<CommunityReportAppealResponse | null> {
  const res = await fetch(apiUrl(routes.community.reportAppeals(reportId.trim())), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ body: bodyText.trim() }),
  });
  return (await communityJsonBody(
    "community.postCommunityReportAppeal",
    res
  )) as CommunityReportAppealResponse | null;
}
