/** FIN-02 · 对账报告列表页 partial 深度快照（当前页/筛选 · 非全库）。 */
export function adminReconcileReportsListSnapshot(input: {
  total: number;
  page: number;
  limit: number;
  reportType: string;
  hasActiveFilters: boolean;
}) {
  return {
    total: input.total,
    page: input.page,
    limit: input.limit,
    reportType: input.reportType.trim() || null,
    hasActiveFilters: input.hasActiveFilters,
  };
}
