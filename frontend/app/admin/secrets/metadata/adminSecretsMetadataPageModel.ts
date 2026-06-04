export type SecretsMetadataRow = {
  id?: string;
  key_alias?: string;
  env_scope?: string | null;
  last_rotated_at?: string | null;
  next_rotation_due?: string | null;
  status?: string;
  notes?: string | null;
  updated_at?: string;
};

export type SecretsMetadataRes = {
  status?: string;
  error?: string;
  items?: SecretsMetadataRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const KEY_ALIAS_MAX_LEN = 256;
export const ENV_SCOPE_RE = /^[a-zA-Z0-9._-]{1,64}$/;
export const STATUS_OPTIONS = ["active", "deprecated", "revoked", "pending", "suspended"] as const;

export function parseListQuery(sp: URLSearchParams): {
  limit: number;
  keyAlias: string;
  status: string;
  envScope: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "200", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 200;
  limit = Math.min(200, Math.floor(limit));
  const keyAlias = (sp.get("key_alias") ?? "").trim().slice(0, KEY_ALIAS_MAX_LEN);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status = STATUS_OPTIONS.includes(rawSt as (typeof STATUS_OPTIONS)[number]) ? rawSt : "";
  const rawEnv = (sp.get("env_scope") ?? "").trim();
  const envScope = ENV_SCOPE_RE.test(rawEnv) ? rawEnv : "";
  return { limit, keyAlias, status, envScope };
}

export function buildListPath(q: { limit: number; keyAlias: string; status: string; envScope: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const ka = q.keyAlias.trim().slice(0, KEY_ALIAS_MAX_LEN);
  if (ka) sp.set("key_alias", ka);
  if (q.status) sp.set("status", q.status);
  if (q.envScope) sp.set("env_scope", q.envScope);
  return `/admin/secrets/metadata?${sp.toString()}`;
}
