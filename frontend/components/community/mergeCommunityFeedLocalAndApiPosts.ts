/**
 * Feed 合并：API refetch 后 local 乐观帖与 api 同 id 时以 api 为准，避免 duplicate React key。
 */
export function mergeCommunityFeedLocalAndApiPosts<T extends { id: string }>(
  localPosts: T[],
  apiPosts: T[],
): T[] {
  const apiIds = new Set(apiPosts.map((p) => p.id));
  const pendingLocal = localPosts.filter((p) => !apiIds.has(p.id));
  return dedupeCommunityFeedPostsById([...pendingLocal, ...apiPosts]);
}

/** 按 id 保留首次出现顺序（Feed 列表 React key 去重） */
export function dedupeCommunityFeedPostsById<T extends { id: string }>(posts: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of posts) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}
