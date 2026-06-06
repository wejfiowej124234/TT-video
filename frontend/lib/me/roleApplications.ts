/**
 * **`GET /api/v1/me/role-applications`**（PD-007 · Phase A PG SSOT）。
 */

export type MeRoleApplicationRow = {
  id: string;
  kind: string;
  status: string;
  legacy_ref?: Record<string, unknown>;
  submitted_at?: string | null;
  decided_at?: string | null;
  rejection_codes?: unknown;
  rejection_message?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export function parseMeRoleApplicationsResponse(raw: unknown): MeRoleApplicationRow[] {
  if (raw == null || typeof raw !== "object") return [];
  const apps = (raw as { applications?: unknown }).applications;
  if (!Array.isArray(apps)) return [];
  const out: MeRoleApplicationRow[] = [];
  for (const row of apps) {
    if (row == null || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const kind = typeof o.kind === "string" ? o.kind.trim() : "";
    const status = typeof o.status === "string" ? o.status.trim() : "";
    if (!id || !kind || !status) continue;
    out.push({
      id,
      kind,
      status,
      legacy_ref:
        o.legacy_ref != null && typeof o.legacy_ref === "object" && !Array.isArray(o.legacy_ref)
          ? (o.legacy_ref as Record<string, unknown>)
          : undefined,
      submitted_at: typeof o.submitted_at === "string" ? o.submitted_at : null,
      decided_at: typeof o.decided_at === "string" ? o.decided_at : null,
      rejection_codes: o.rejection_codes,
      rejection_message:
        typeof o.rejection_message === "string" ? o.rejection_message : null,
      metadata:
        o.metadata != null && typeof o.metadata === "object" && !Array.isArray(o.metadata)
          ? (o.metadata as Record<string, unknown>)
          : undefined,
      created_at: typeof o.created_at === "string" ? o.created_at : undefined,
      updated_at: typeof o.updated_at === "string" ? o.updated_at : undefined,
    });
  }
  return out;
}

export type MeRoleApplicationSurface = "provider" | "steward";

function kindForSurface(surface: MeRoleApplicationSurface): string {
  return surface === "provider" ? "provider_onboarding" : "region_steward_onboarding";
}

/** 取该轨最新一条申请状态（API 已按 `updated_at DESC` 排序）。 */
export function roleApplicationStatusForSurface(
  applications: MeRoleApplicationRow[] | null | undefined,
  surface: MeRoleApplicationSurface,
): string | null {
  if (!applications?.length) return null;
  const kind = kindForSurface(surface);
  const row = applications.find((a) => a.kind === kind);
  return row?.status ?? null;
}
