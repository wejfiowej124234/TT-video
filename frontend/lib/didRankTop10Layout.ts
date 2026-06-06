/** 前 10 名：领奖台视觉序（2 · 1 · 3）与 4～10 分列 */
export function didRankPodiumVisualOrder<T extends { rank: number }>(items: T[]): T[] {
  const top3 = items.filter((i) => i.rank >= 1 && i.rank <= 3).sort((a, b) => a.rank - b.rank);
  if (top3.length === 0) return [];
  const byRank = new Map(top3.map((i) => [i.rank, i]));
  const ordered: T[] = [];
  for (const rank of [2, 1, 3] as const) {
    const item = byRank.get(rank);
    if (item) ordered.push(item);
  }
  for (const item of top3) {
    if (!ordered.includes(item)) ordered.push(item);
  }
  return ordered;
}

/** 4～10 名栅格：5 列桌面；>5 时拆为 5+尾行 flex 居中（V-04） */
export function didRankTop10RowGridClass(rowCount: number): string {
  if (rowCount <= 2) return "flex flex-wrap justify-center gap-2 sm:gap-3 max-w-3xl mx-auto";
  return "grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 max-w-3xl mx-auto";
}

export function splitDidRankTop10RowBand<T>(row: T[]): { head: T[]; tail: T[] } {
  if (row.length <= 5) return { head: row, tail: [] };
  return { head: row.slice(0, 5), tail: row.slice(5) };
}

export const DID_RANK_TOP10_ROW_TAIL_WRAP =
  "flex flex-wrap justify-center gap-2 sm:gap-3 max-w-3xl mx-auto mt-2 sm:mt-3";

export function splitDidRankTop10<T extends { rank: number }>(items: T[]) {
  const top10 = items.filter((i) => i.rank >= 1 && i.rank <= 10);
  const podium = top10.filter((i) => i.rank <= 3);
  const row = top10.filter((i) => i.rank > 3).sort((a, b) => a.rank - b.rank);
  return {
    top10,
    podium,
    row,
    podiumVisual: didRankPodiumVisualOrder(podium),
  };
}
