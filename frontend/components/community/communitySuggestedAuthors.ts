import type { CommunityPost, CommunityPostAuthor } from "@/lib/communityMockData";
import { isShowcaseAuthorId } from "@/lib/communityShowcase";

function normalizeAuthorNickname(nickname: string | undefined): string {
  return (nickname ?? "").trim().toLowerCase();
}

/** 31 §1.2：从当前帖子列表推导「推荐关注」作者（去重、排除自己、排除已关注） */
export function suggestedAuthorsFromPosts(
  posts: CommunityPost[],
  options: {
    meUserId: string | null | undefined;
    followingAuthorIds: Set<string>;
    max: number;
  },
): CommunityPostAuthor[] {
  const { meUserId, followingAuthorIds, max } = options;
  const seenIds = new Set<string>();
  const nickToIndex = new Map<string, number>();
  const out: CommunityPostAuthor[] = [];

  const pushAuthor = (a: NonNullable<CommunityPost["author"]>) => {
    out.push({
      id: a.id,
      nickname: a.nickname,
      avatar_url: a.avatar_url ?? null,
      role: a.role,
      ...(a.isEscrowGuide ? { isEscrowGuide: true as const } : {}),
    });
  };

  for (const p of posts) {
    const a = p.author;
    const id = a?.id;
    if (!id) continue;
    if (meUserId && id === meUserId) continue;
    if (followingAuthorIds.has(id)) continue;
    if (seenIds.has(id)) continue;

    const nickKey = normalizeAuthorNickname(a.nickname);
    if (nickKey && nickToIndex.has(nickKey)) {
      const existingIdx = nickToIndex.get(nickKey)!;
      const existing = out[existingIdx];
      if (existing && isShowcaseAuthorId(id) && !isShowcaseAuthorId(existing.id)) {
        seenIds.delete(existing.id);
        seenIds.add(id);
        out[existingIdx] = {
          id: a.id,
          nickname: a.nickname,
          avatar_url: a.avatar_url ?? null,
          role: a.role,
          ...(a.isEscrowGuide ? { isEscrowGuide: true as const } : {}),
        };
      }
      continue;
    }

    seenIds.add(id);
    if (nickKey) nickToIndex.set(nickKey, out.length);
    pushAuthor(a);
    if (out.length >= max) break;
  }
  return out;
}
