import type { AdminFinanceSuiteModuleStatus } from "@/lib/adminUi";

/** HU-049 · 管理台数据诚实徽章（REAL / PARTIAL / TOOL / HIDE）。 */
export type AdminTruthBadge = "REAL" | "PARTIAL" | "TOOL" | "HIDE";

export function adminTruthBadgeLabelKey(b: AdminTruthBadge): string {
  return `admin_truth_badge_${b}`;
}

/** 财务七件套模块 status → 诚实徽章（partial 永不为 REAL）。 */
export function adminFinanceSuiteTruthBadge(
  status: AdminFinanceSuiteModuleStatus,
): AdminTruthBadge {
  if (status === "partial") return "PARTIAL";
  if (status === "active") return "REAL";
  if (status === "placeholder") return "TOOL";
  return "HIDE";
}
