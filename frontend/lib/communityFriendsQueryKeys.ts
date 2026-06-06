/** 好友页 / 资料条 / Explore 共用的社交列表 React Query keys */

export const COMMUNITY_ME_FOLLOWERS_QUERY_KEY = ["community", "meFollowers"] as const;
export const COMMUNITY_FRIENDS_LIST_QUERY_KEY = ["community", "friendsList"] as const;
export const COMMUNITY_FRIENDS_REQUESTS_RECEIVED_QUERY_KEY = ["community", "friendsRequests", "received"] as const;
export const COMMUNITY_FRIENDS_REQUESTS_SENT_QUERY_KEY = ["community", "friendsRequests", "sent"] as const;
export const COMMUNITY_FRIENDS_ME_QUERY_KEY = ["community", "friends", "me"] as const;

export const COMMUNITY_FRIENDS_STALE_MS = 60_000;
