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

export function clampGuideLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

export function parseGuidesListQuery(sp: URLSearchParams): {
  limit: number;
  status: string;
} {
  const limit = clampGuideLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const status = (sp.get("status") ?? "").trim().slice(0, ADMIN_GUIDES_STATUS_MAX);
  // HU-418: data_origin query ignored (no client filter / no server filter yet)
  return { limit, status };
}

export function buildGuidesListPath(q: { limit: number; status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampGuideLimit(q.limit)));
  const st = q.status.trim().slice(0, ADMIN_GUIDES_STATUS_MAX);
  if (st) sp.set("status", st);
  return `/admin/guides?${sp.toString()}`;
}
