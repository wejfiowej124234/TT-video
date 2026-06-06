/** Re-export SSOT from lib (e2e · ADM-U01 矩阵探针). */
export {
  ADM_U01_ROLES,
  ADM_U01_SHELL_GROUP_IDS,
  ADM_U01_SHELL_GROUP_VISIBILITY,
  admU01ShellGroupVisible,
} from "@/lib/admin/admU01ShellGroupVisibility";

import type { ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";

export type AdmU01Role = ConsoleRole70;

export function admU01TokenForRole(role: AdmU01Role): string | null {
  const key = `TRAVELTRUST_ADMIN_TOKEN_${role === "SuperAdmin" ? "SUPER" : role.toUpperCase()}`;
  const t = process.env[key]?.trim();
  return t || null;
}
