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
};

export type AdminGuidesRes = {
  status?: string;
  items?: AdminGuideRow[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

export const ADMIN_GUIDES_STATUS_MAX = 128;
export const ADMIN_GUIDES_CITY_MAX = 128;
export const ADMIN_GUIDES_COUNTRY_MAX = 16;
export const ADMIN_GUIDES_Q_MAX = 128;

export function clampGuideLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export type AdminGuidesListQuery = {
  limit: number;
  status: string;
  city: string;
  country_code: string;
  q: string;
};

export function parseGuidesListQuery(sp: URLSearchParams): AdminGuidesListQuery {
  const limit = clampGuideLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const status = (sp.get("status") ?? "").trim().slice(0, ADMIN_GUIDES_STATUS_MAX);
  const city = (sp.get("city") ?? "").trim().slice(0, ADMIN_GUIDES_CITY_MAX);
  const country_code = (sp.get("country_code") ?? "").trim().slice(0, ADMIN_GUIDES_COUNTRY_MAX);
  const q = (sp.get("q") ?? "").trim().slice(0, ADMIN_GUIDES_Q_MAX);
  return { limit, status, city, country_code, q };
}

export function buildGuidesListPath(query: AdminGuidesListQuery): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampGuideLimit(query.limit)));
  const st = query.status.trim().slice(0, ADMIN_GUIDES_STATUS_MAX);
  if (st) sp.set("status", st);
  const city = query.city.trim().slice(0, ADMIN_GUIDES_CITY_MAX);
  if (city) sp.set("city", city);
  const cc = query.country_code.trim().slice(0, ADMIN_GUIDES_COUNTRY_MAX);
  if (cc) sp.set("country_code", cc);
  const q = query.q.trim().slice(0, ADMIN_GUIDES_Q_MAX);
  if (q) sp.set("q", q);
  return `/admin/guides?${sp.toString()}`;
}
