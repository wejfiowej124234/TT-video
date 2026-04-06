/**
 * 自由市场 / Discover 列表：按稳定 id 去重与分页合并（54-S9、04/55 一单一展示）。
 * 不假设后端一定去重；首屏与 load-more 共用同一套逻辑，便于单测与回归。
 * Discover 订单卡业务键见 `discoverOrderDedupeKey`（优先 order_id，54-S9）。
 */

export function dedupeListById<T>(items: T[], getId: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const id = getId(item);
    if (!id) {
      out.push(item);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

/** 将新一页接到已有列表后，仅追加未见过的 id（cursor 分页防重复条） */
export function mergeListsUniqueById<T>(existing: T[], incoming: T[], getId: (item: T) => string): T[] {
  const seen = new Set<string>();
  for (const x of existing) {
    const id = getId(x);
    if (id) seen.add(id);
  }
  const merged = [...existing];
  for (const item of incoming) {
    const id = getId(item);
    if (!id) {
      merged.push(item);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(item);
  }
  return merged;
}
