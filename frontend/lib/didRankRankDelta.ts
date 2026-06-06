import type { Period } from "@/lib/didRankUtils";

export type DidRankRankDeltaItem = {
  rank_delta?: number;
};

function parseApiRankDelta(r: Record<string, unknown>): number | undefined {
  const raw = r.rank_delta ?? r.rankDelta;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw === 0) return undefined;
  return Math.trunc(raw);
}

/** 正数=名次上升（数字变小），负数=下降 */
export function mergeDidRankRowDelta<T extends { id: string; rank: number }>(
  row: T,
  prevRankById: Map<string, number> | undefined,
): T & DidRankRankDeltaItem {
  const fromApi = row as T & DidRankRankDeltaItem & Record<string, unknown>;
  const apiDelta = parseApiRankDelta(fromApi as Record<string, unknown>);
  if (apiDelta !== undefined) return { ...row, rank_delta: apiDelta };
  const prevRank = prevRankById?.get(row.id);
  if (prevRank === undefined) return row;
  const delta = prevRank - row.rank;
  if (delta === 0) return row;
  return { ...row, rank_delta: delta };
}

export function snapshotDidRankRanks<T extends { id: string; rank: number }>(items: T[]): Map<string, number> {
  return new Map(items.map((i) => [i.id, i.rank]));
}

const periodPrevStore = new Map<string, Map<string, number>>();

/** 按 period / 副榜 cache key 对比上一轮快照，供 Top10 FLIP 与 ↑↓ 徽章（① 本地刷新/② API 同键） */
export function attachDidRankRankDeltas<T extends { id: string; rank: number }>(
  items: T[],
  cacheKey: Period | string,
): (T & DidRankRankDeltaItem)[] {
  const prev = periodPrevStore.get(cacheKey);
  const withDelta = items.map((item) => mergeDidRankRowDelta(item, prev));
  periodPrevStore.set(cacheKey, snapshotDidRankRanks(items));
  return withDelta;
}

export function resetDidRankRankDeltaSnapshots(): void {
  periodPrevStore.clear();
}
