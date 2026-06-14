/** 发布中心 → 社区帖管理深链（① · SSOT：`PUBLISH-HUB-PHASE-TASK-LIST.md` PH-A-12） */
export function publishHubCommunityPostManageHref(postId: string): string {
  const trimmed = postId.trim();
  if (!trimmed) return "/community/me/posts";
  return `/community/me/posts?post=${encodeURIComponent(trimmed)}`;
}
