/**
 * B-075：站内帖子分享 URL，与 `useCommunityFeed` 的 `?post=` 深链及
 * `app/community/post/[id]` → `/community?post=` 重定向一致。
 */
export function buildCommunityPostShareUrl(origin: string, postId: string): string {
  const base = (origin ?? "").replace(/\/$/, "");
  const id = typeof postId === "string" ? postId.trim() : "";
  if (!id) return `${base}/community`;
  return `${base}/community?post=${encodeURIComponent(id)}`;
}
