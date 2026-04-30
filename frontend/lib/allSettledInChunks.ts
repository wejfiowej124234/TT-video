/**
 * 分段 `Promise.allSettled`，限制并行度，避免个人中心收藏/赞过等场景对 `getPostById` 的瞬时洪峰。
 * 结果顺序与 `items` 一致。
 */
export async function allSettledInChunks<T, R>(
  items: readonly T[],
  chunkSize: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const n = items.length;
  if (n === 0) return [];
  const cap = Math.max(1, Math.floor(chunkSize));
  const out: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < n; i += cap) {
    const slice = items.slice(i, i + cap);
    const chunk = await Promise.allSettled(slice.map((item, j) => worker(item, i + j)));
    out.push(...chunk);
  }
  return out;
}

/** 与 `ME_LIKES_LIST_CAP` 同量级：单用户收藏/赞过 hydrate 的并行上限 */
export const COMMUNITY_ME_POST_DETAIL_FETCH_CONCURRENCY = 8;
