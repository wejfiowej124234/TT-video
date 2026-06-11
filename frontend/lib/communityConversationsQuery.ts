/** 壳层未读角标与消息列表共用的 React Query key（避免重复 GET conversations） */
export const COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY = ["community", "conversations", "layoutUnread"] as const;

export const COMMUNITY_CONVERSATIONS_STALE_MS = 15_000;

/** 消息/好友页需即时未读；Feed/Explore 等可 idle 后再拉 */
export function shouldEagerFetchCommunityConversations(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/community/messages") || pathname.startsWith("/community/friends");
}

export function scheduleCommunityIdleWork(run: () => void, timeoutMs = 2500): () => void {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }
  const timer = globalThis.setTimeout(run, 100);
  return () => globalThis.clearTimeout(timer);
}
