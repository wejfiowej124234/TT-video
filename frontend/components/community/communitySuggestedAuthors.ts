import type { CommunityPost, CommunityPostAuthor } from "@/lib/communityMockData";

/** 31 §1.2：从当前帖子列表推导「推荐关注」作者（去重、排除自己、排除已关注） */
export function suggestedAuthorsFromPosts(
  posts: CommunityPost[],
  options: {
    meUserId: string | null | undefined;
    followingAuthorIds: Set<string>;
    max: number;
  }
): CommunityPostAuthor[] {
  const { meUserId, followingAuthorIds, max } = options;
  const seen = new Set<string>();
  const out: CommunityPostAuthor[] = [];
  for (const p of posts) {
    const a = p.author;
    const id = a?.id;
    if (!id) continue;
    if (meUserId && id === meUserId) continue;
    if (followingAuthorIds.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id: a.id,
      nickname: a.nickname,
      avatar_url: a.avatar_url ?? null,
      role: a.role,
      ...(a.isEscrowGuide ? { isEscrowGuide: true as const } : {}),
    });
    if (out.length >= max) break;
  }
  return out;
}
