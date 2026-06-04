export type AdminReviewRow = {
  id?: string;
  order_id?: string;
  reviewer_id?: string;
  reviewee_id?: string;
  score?: number;
  weight?: number;
  comment?: string | null;
  created_at?: string;
};

export type AdminReviewsRes = {
  status?: string;
  items?: AdminReviewRow[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

export function clampReviewsLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export function parseOptionalI16(s: string | null): number | undefined {
  if (s == null) return undefined;
  const v = s.trim();
  if (v === "") return undefined;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(32767, Math.max(-32768, n));
}

/** 与列表请求一致：无任何 query 时默认低分抽样（max_score=2）；一旦 URL 含任一键则按 URL 解析（缺省键不补默认 max）。 */
export function parseReviewsListQuery(sp: URLSearchParams): {
  limit: number;
  minScore?: number;
  maxScore?: number;
} {
  const hasAny = sp.has("limit") || sp.has("min_score") || sp.has("max_score");
  const limit = clampReviewsLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const minScore = parseOptionalI16(sp.get("min_score"));
  let maxScore = parseOptionalI16(sp.get("max_score"));
  if (!hasAny) {
    maxScore = 2;
  }
  return { limit, minScore, maxScore };
}

export function buildReviewsListPath(q: { limit: number; minScore?: number; maxScore?: number }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampReviewsLimit(q.limit)));
  if (q.minScore != null) sp.set("min_score", String(q.minScore));
  if (q.maxScore != null) sp.set("max_score", String(q.maxScore));
  return `/admin/reviews?${sp.toString()}`;
}

export function parseDraftReviewsLimit(s: string): number {
  const n = Number.parseInt(s.trim(), 10);
  return clampReviewsLimit(n);
}

export function parseDraftReviewsScore(s: string): number | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(32767, Math.max(-32768, n));
}
