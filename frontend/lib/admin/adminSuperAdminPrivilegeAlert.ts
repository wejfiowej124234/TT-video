/**
 * HU-289 · SuperAdmin console-role share thresholds for workbench alert.
 * HU-454 · CTA → console privilege review (not business users.role filter).
 */

export type AdminSuperAdminPrivilegeAlertLevel = "ok" | "warn" | "critical" | "unknown";

export type AdminSuperAdminPrivilegeAlert = {
  level: AdminSuperAdminPrivilegeAlertLevel;
  superAdminCount: number;
  total: number;
  /** 0–100 share; null when unknown */
  pct: number | null;
  href: string;
};

/** Batch-12 HU-454 · permissions hub console-role strip (≠ `/admin/users?role=SuperAdmin`). */
export const ADMIN_SUPERADMIN_PRIVILEGE_ALERT_HREF =
  "/admin/permissions#admin-console-role-effective";

/**
 * Batch-12 HU-447 · 周检复核清单 SOP（只读 · 不自动削权）。
 * Needle: `tt_admin_home_superadmin_sop_hu447`
 */
export const TT_ADMIN_HOME_SUPERADMIN_SOP_MARK = "tt_admin_home_superadmin_sop_hu447";
export const ADMIN_SUPERADMIN_PRIVILEGE_SOP_HREF =
  "/admin/permissions#admin-superadmin-weekly-review";

const SUPER_KEYS = new Set(["SuperAdmin", "super_admin", "SUPER_ADMIN"]);

export function adminSuperAdminCountFromRoleMap(byRole: Record<string, number>): number {
  let n = 0;
  for (const [role, count] of Object.entries(byRole)) {
    if (SUPER_KEYS.has(role) || role.toLowerCase() === "superadmin") {
      n += count;
    }
  }
  return n;
}

/** >10% critical · >5% warn · else ok. Unknown when total≤0. */
export function resolveAdminSuperAdminPrivilegeAlert(
  byRole: Record<string, number>,
): AdminSuperAdminPrivilegeAlert {
  const total = Object.values(byRole).reduce((s, n) => s + n, 0);
  const superAdminCount = adminSuperAdminCountFromRoleMap(byRole);
  const href = ADMIN_SUPERADMIN_PRIVILEGE_ALERT_HREF;
  if (total <= 0) {
    return { level: "unknown", superAdminCount, total, pct: null, href };
  }
  const pct = (superAdminCount / total) * 100;
  const level: AdminSuperAdminPrivilegeAlertLevel =
    pct > 10 ? "critical" : pct > 5 ? "warn" : "ok";
  return { level, superAdminCount, total, pct, href };
}

/**
 * Batch-12 HU-439 · 概况密度：仅 critical 默认展开；warn 进折叠（不压 KPI）。
 */
export function adminHomeSuperAdminAlertExpandedByDefault(
  level: AdminSuperAdminPrivilegeAlertLevel,
): boolean {
  return level === "critical";
}
