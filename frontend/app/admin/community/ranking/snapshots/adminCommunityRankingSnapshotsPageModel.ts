export type RankSnapshotRow = {
  id?: string;
  feed_mode?: string;
  item_count?: number;
  top_post_ids?: string[];
  notes?: string | null;
  created_at?: string;
};

export type RankSnapshotsListRes = {
  status?: string;
  error?: string;
  items?: RankSnapshotRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const RANK_SNAPSHOTS_FEED_MODE_MAX = 128;

export function rankSnapshotsIdsPreview(ids: string[] | undefined, dash: string): string {
  if (!ids || ids.length === 0) return dash;
  const s = ids.join(", ");
  return s.length > 120 ? `${s.slice(0, 120)}…` : s;
}

export function parseRankSnapshotsQuery(sp: URLSearchParams): { limit: number; feedMode: string } {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const feedMode = (sp.get("feed_mode") ?? "").trim().slice(0, RANK_SNAPSHOTS_FEED_MODE_MAX);
  return { limit, feedMode };
}

export function buildRankSnapshotsPath(q: { limit: number; feedMode: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const fm = q.feedMode.trim().slice(0, RANK_SNAPSHOTS_FEED_MODE_MAX);
  if (fm) sp.set("feed_mode", fm);
  return `/admin/community/ranking/snapshots?${sp.toString()}`;
}
