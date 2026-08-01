/** Batch-10 W13 · HU-243 · 运营可见枚举人话（禁裸英文 status/role）。 */

const ROLE_LABEL_KEYS: Record<string, string> = {
  tourist: "admin_enum_role_tourist",
  traveler: "admin_enum_role_traveler",
  guide: "admin_enum_role_guide",
  provider: "admin_enum_role_provider",
  steward: "admin_enum_role_steward",
  kol: "admin_enum_role_kol",
  admin: "admin_enum_role_admin",
  super_admin: "admin_enum_role_super_admin",
  unknown: "admin_enum_role_unknown",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  submitted: "admin_enum_status_submitted",
  open: "admin_enum_status_open",
  pending: "admin_enum_status_pending",
  approved: "admin_enum_status_approved",
  rejected: "admin_enum_status_rejected",
  cancelled: "admin_enum_status_cancelled",
  closed: "admin_enum_status_closed",
  active: "admin_enum_status_active",
  draft: "admin_enum_status_draft",
};

export function adminOperatorRoleLabelKey(role: string): string | null {
  const k = role.trim().toLowerCase();
  return ROLE_LABEL_KEYS[k] ?? null;
}

export function adminOperatorStatusLabelKey(status: string): string | null {
  const k = status.trim().toLowerCase();
  return STATUS_LABEL_KEYS[k] ?? null;
}

export function adminOperatorEnumDisplay(
  raw: string,
  t: (key: string) => string,
  kind: "role" | "status" = "role",
): string {
  const key =
    kind === "status" ? adminOperatorStatusLabelKey(raw) : adminOperatorRoleLabelKey(raw);
  return key ? t(key) : raw;
}
