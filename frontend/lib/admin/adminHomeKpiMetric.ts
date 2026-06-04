/** ① Admin 首页 KPI / 待办计数展示：权限拒绝 ≠ loading（HON-01）。 */

export type AdminHomeKpiMetricInput = {
  loading: boolean;
  count: number | null;
  permissionDenied: boolean;
};

export function adminHomeKpiMetricDisplay(
  input: AdminHomeKpiMetricInput,
  t: (key: string, vars?: Record<string, string | number>) => string,
  countKey: string,
): string {
  const { loading, count, permissionDenied } = input;
  if (permissionDenied) return t("admin_home_kpi_perm_denied");
  if (loading) return t("admin_home_kpi_loading");
  if (count === null) return t("admin_home_kpi_unavailable");
  return t(countKey, { count });
}

export function adminHomeKpiTileLinkAllowed(permissionDenied: boolean): boolean {
  return !permissionDenied;
}
