/**
 * SSOT: docs/handbook/engineering/181-Complexity-Audit-Final-Candidate-Before-Soak.md
 * Booking Core 活跃；扩展轨（商家/主理人/收购/Growth/CMS）在 freeze 下默认壳冻结。
 */

function envTruthy(name: string): boolean {
  const v = process.env[name];
  return v === "1" || v === "true" || v === "TRUE";
}

/** ①② 复杂度收敛冻结（staging 默认 ON via deploy env） */
export function isComplexityConvergenceFreezeActive(): boolean {
  return envTruthy("NEXT_PUBLIC_COMPLEXITY_CONVERGENCE_FREEZE");
}

export type ExpansionIdentitySurface = "merchant" | "region_steward" | "acquisition" | "provider";

/** Hub 仅展示 traveler + guide 活跃轨时，隐藏 B 轨/收购/主理人卡片 */
export function isExpansionIdentitySurfaceVisible(surface: ExpansionIdentitySurface): boolean {
  if (!isComplexityConvergenceFreezeActive()) return true;
  return false;
}

/** Admin 侧栏/首页 · 收敛期冻结路径前缀（P0+P1 ~20 项外） */
export const ADMIN_CONVERGENCE_FROZEN_HREF_PREFIXES: readonly string[] = [
  "/admin/growth",
  "/admin/official",
  "/admin/content",
  "/admin/community",
  "/admin/conversion-analytics",
  "/admin/trust-growth",
  "/admin/region-share",
  "/admin/steward-applications",
  "/admin/provider-applications",
  "/admin/onboarding",
  "/admin/catalog",
  "/admin/cold-start",
  "/admin/schema",
  "/admin/lifecycle",
  "/admin/policies",
  "/admin/drift-summary",
  "/admin/cross-check",
  "/admin/internal-tools",
  "/admin/media",
  "/admin/api-versions",
];

export function adminHrefBase(href: string): string {
  return (href.split("?")[0] ?? href).split("#")[0] ?? href;
}

export function isAdminHrefVisibleInConvergence(href: string): boolean {
  if (!isComplexityConvergenceFreezeActive()) return true;
  const base = adminHrefBase(href);
  if (base === "/admin") return true;
  return !ADMIN_CONVERGENCE_FROZEN_HREF_PREFIXES.some(
    (p) => base === p || base.startsWith(`${p}/`),
  );
}

export function filterAdminHrefList<T extends { href: string }>(items: T[]): T[] {
  return items.filter((item) => isAdminHrefVisibleInConvergence(item.href));
}

/** 治理 UI 收敛：仅 proposals 列表/详情只读 */
export const GOVERNANCE_CONVERGENCE_FROZEN_PATH_PREFIXES: readonly string[] = [
  "/governance/delegate",
  "/governance/distribution-claim",
  "/governance/distribution-accruals",
  "/governance/fee-routes",
  "/governance/vault-forwards",
];

export function isGovernancePathVisibleInConvergence(pathname: string): boolean {
  if (!isComplexityConvergenceFreezeActive()) return true;
  const base = pathname.split("?")[0] ?? pathname;
  if (base === "/governance" || base.startsWith("/governance/proposals")) return true;
  if (base === "/governance/params") return true;
  return !GOVERNANCE_CONVERGENCE_FROZEN_PATH_PREFIXES.some(
    (p) => base === p || base.startsWith(`${p}/`),
  );
}
