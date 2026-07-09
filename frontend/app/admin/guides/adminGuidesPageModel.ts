export type AdminGuideRow = {
  id: string;
  user_id: string;
  city?: string;
  country_code?: string;
  status?: string;
  stake_amount?: string;
  wallet_address?: string | null;
  id_photo_url?: string | null;
  language_cert_url?: string | null;
  guide_license_url?: string | null;
  updated_at?: string;
  data_origin?: string;
};

export type AdminGuidesRes = {
  status?: string;
  items?: AdminGuideRow[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

export const ADMIN_GUIDES_STATUS_MAX = 128;
export const ADMIN_GUIDES_DATA_ORIGIN_MAX = 64;

export function clampGuideLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export function parseGuidesListQuery(sp: URLSearchParams): {
  limit: number;
  status: string;
  data_origin: string;
} {
  const limit = clampGuideLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const status = (sp.get("status") ?? "").trim().slice(0, ADMIN_GUIDES_STATUS_MAX);
  const data_origin = (sp.get("data_origin") ?? "").trim().slice(0, ADMIN_GUIDES_DATA_ORIGIN_MAX);
  return { limit, status, data_origin };
}

export function buildGuidesListPath(q: { limit: number; status: string; data_origin?: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampGuideLimit(q.limit)));
  const st = q.status.trim().slice(0, ADMIN_GUIDES_STATUS_MAX);
  if (st) sp.set("status", st);
  const origin = (q.data_origin ?? "").trim().slice(0, ADMIN_GUIDES_DATA_ORIGIN_MAX);
  if (origin) sp.set("data_origin", origin);
  return `/admin/guides?${sp.toString()}`;
}
