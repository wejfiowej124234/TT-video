import type { CommunityPost } from "@/lib/communityMockData";
import type { CommunityFeedCardAuthorFollow } from "./CommunityFeedCard";

/** 从 Feed 列表/详情抽屉复用：对接 04 §3.4 `POST|DELETE .../users/:id/follow` */
export function buildAuthorFollowForPost(
  post: CommunityPost,
  options: {
    meUserId?: string | null;
    followingAuthorIds: ReadonlySet<string>;
    followBusyAuthorId?: string | null;
    onAuthorFollowToggle?: (authorId: string) => void;
  }
): CommunityFeedCardAuthorFollow | undefined {
  const { meUserId, followingAuthorIds, followBusyAuthorId, onAuthorFollowToggle } = options;
  const aid = post.author?.id?.trim() || "";
  if (!onAuthorFollowToggle || !aid) return undefined;
  return {
    followed: followingAuthorIds.has(aid),
    onToggle: () => onAuthorFollowToggle(aid),
    disabled: followBusyAuthorId === aid,
    hidden: aid === meUserId,
  };
}
