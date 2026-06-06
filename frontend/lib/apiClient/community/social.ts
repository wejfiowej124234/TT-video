import { apiUrl, routes } from "../../api";
import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "./constants";
import { communityReadOk, communityWriteJsonBody, communityFetchGet, defaultHeaders } from "./internal";
import type {
  CommunityFriendRequestReceivedRow,
  CommunityFriendRequestSentRow,
  CommunityPublicUserRow,
  CommunityWriteJsonResponse,
} from "./types";

/** `GET …/me/likes`、`GET …/me/collects` 共用：有 **`limit`** 时写 query；省略则不附带 **`limit`**（后端 **`clamp_me_ids_list_limit(None)`** 即 **`LIST_LIMIT`**）。 */
function communityMeIdsListQueryString(params?: { limit?: number }): string {
  const sp = new URLSearchParams();
  if (params?.limit != null && Number.isFinite(params.limit)) {
    const n = Math.floor(Number(params.limit));
    sp.set(
      "limit",
      String(Math.min(COMMUNITY_ME_DRAWER_LIST_ID_CAP, Math.max(1, n)))
    );
  }
  return sp.toString();
}

export async function getMeFollowing(): Promise<{
  status: string;
  following?: CommunityPublicUserRow[];
  note?: string;
  message?: string;
}> {
  const res = await communityFetchGet(apiUrl(routes.community.meFollowing));
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
  const res = await communityFetchGet(apiUrl(routes.community.meFollowers));
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
  const res = await communityFetchGet(apiUrl(routes.community.friendsList));
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
  const res = await communityFetchGet(apiUrl(routes.community.friendsRequests));
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
  const res = await communityFetchGet(apiUrl(routes.community.friendsRequestsSent));
  return (await communityReadOk("community.getFriendsRequestsSent", res)) as {
    status: string;
    requests?: CommunityFriendRequestSentRow[];
    note?: string;
    message?: string;
  };
}

/** 我的帖子收到的点赞总数 */
export async function getMeLikesReceived(): Promise<{ status: string; likes_received?: number }> {
  const res = await communityFetchGet(apiUrl(routes.community.meLikesReceived));
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
  return (await communityWriteJsonBody("community.postUserFollow", res)) as CommunityWriteJsonResponse | null;
}

/** 31 §5：取消关注用户（DELETE /api/v1/community/users/:id/follow） */
export async function deleteUserFollow(userId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.userFollow(userId)), {
    method: "DELETE",
    headers: defaultHeaders(),
  });
  return (await communityWriteJsonBody("community.deleteUserFollow", res)) as CommunityWriteJsonResponse | null;
}

/** 31 §5：发送好友请求（POST /api/v1/community/friends/request） */
export async function postFriendsRequest(userId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.friendsRequest), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });
  return (await communityWriteJsonBody("community.postFriendsRequest", res)) as CommunityWriteJsonResponse | null;
}

/** 31 §5：接受好友请求（POST /api/v1/community/friends/accept） */
export async function postFriendsAccept(requestId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.friendsAccept), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ request_id: requestId }),
  });
  return (await communityWriteJsonBody("community.postFriendsAccept", res)) as CommunityWriteJsonResponse | null;
}

/** 拒绝好友请求（POST /api/v1/community/friends/reject） */
export async function postFriendsReject(requestId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.friendsReject), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ request_id: requestId }),
  });
  return (await communityWriteJsonBody("community.postFriendsReject", res)) as CommunityWriteJsonResponse | null;
}

/**
 * 当前用户收藏过的帖子 id 列表（与 **`getMeLikes`** 对称）。
 * 可选 **`limit`**：有值时钳 **1～`COMMUNITY_ME_DRAWER_LIST_ID_CAP`** 写入 query（与后端 **`clamp_me_ids_list_limit`** 同源）；**省略**时不发 **`limit`**，后端按 **`LIST_LIMIT`** 拉满（**04**、**①②③** 一致）。
 */
export async function getMeCollects(params?: { limit?: number }): Promise<{
  status: string;
  collects?: Array<{ post_id?: string }>;
  note?: string;
  message?: string;
}> {
  const q = communityMeIdsListQueryString(params);
  const path = q ? `${routes.community.meCollects}?${q}` : routes.community.meCollects;
  const res = await communityFetchGet(apiUrl(path));
  return (await communityReadOk("community.getMeCollects", res)) as {
    status: string;
    collects?: Array<{ post_id?: string }>;
    note?: string;
    message?: string;
  };
}

/**
 * 当前用户点赞过的帖子（`likes[]` 与 `parseMeLikesListEnvelope` 对齐）。
 * 可选 **`limit`**：有值时钳 **1～`COMMUNITY_ME_DRAWER_LIST_ID_CAP`** 写入 query（与后端 **`clamp_me_ids_list_limit`** 同源）；**省略**时不发 **`limit`**，后端按 **`LIST_LIMIT`** 拉满（**04**、**①②③** 一致）。
 */
export async function getMeLikes(params?: { limit?: number }): Promise<{
  status: string;
  likes?: Array<{ post_id?: string }>;
  note?: string;
  message?: string;
}> {
  const q = communityMeIdsListQueryString(params);
  const path = q ? `${routes.community.meLikes}?${q}` : routes.community.meLikes;
  const res = await communityFetchGet(apiUrl(path));
  return (await communityReadOk("community.getMeLikes", res)) as {
    status: string;
    likes?: Array<{ post_id?: string }>;
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
  return (await communityWriteJsonBody("community.postCollect", res)) as CommunityWriteJsonResponse | null;
}

/** 51-31-8：取消收藏 */
export async function deleteCollect(postId: string): Promise<CommunityWriteJsonResponse | null> {
  const res = await fetch(apiUrl(routes.community.postCollect(postId)), {
    method: "DELETE",
    headers: defaultHeaders(),
  });
  return (await communityWriteJsonBody("community.deleteCollect", res)) as CommunityWriteJsonResponse | null;
}
