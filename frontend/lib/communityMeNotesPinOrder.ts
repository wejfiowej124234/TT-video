/**
 * 个人中心玻璃弹层内：将用户「置顶」的条目稳定排在列表前（同一会话内有效，刷新后恢复 API 顺序）。
 */
export function applyPinOrder<T>(items: readonly T[], getId: (row: T) => string, pinOrder: readonly string[]): T[] {
  const byId = new Map(items.map((x) => [getId(x), x] as const));
  const seen = new Set<string>();
  const pinned: T[] = [];
  for (const id of pinOrder) {
    const row = byId.get(id);
    if (row && !seen.has(id)) {
      pinned.push(row);
      seen.add(id);
    }
  }
  const rest = items.filter((x) => !seen.has(getId(x)));
  return [...pinned, ...rest];
}
