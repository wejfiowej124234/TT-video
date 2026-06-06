import AdminRouteLoadingBoundary from "@/components/admin/AdminRouteLoadingBoundary";

/** boot 就绪时 null → AdminNavContentTransition 保留上一页；冷启动仍轻量 segment loading。 */
export default function AdminRouteLoading() {
  return <AdminRouteLoadingBoundary />;
}
