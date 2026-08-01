import { adminListFetchCacheKey } from "@/lib/admin/adminListFetchCache";
import { routes } from "@/lib/api";

/** Staging / contract needle · keep literal (fn names minify). HU-460 SWR + HU-464 count-only. */
export const TT_ADMIN_HOME_KPI_SWR_CACHE_MARK = "tt_admin_kpi_queue_list_cache_hu460";
export const TT_ADMIN_HOME_KPI_COUNT_ONLY_MARK = "tt_admin_kpi_count_only_hu464";

/** HU-464 · KPI 只读 total · 禁止 200/500/100 大体量列表 */
export const ADMIN_HOME_KPI_COUNT_ONLY_LIMIT = 1;

export type AdminHomeKpiChannelKey = "orders" | "disputes" | "guides";

export type AdminKpiQueueListFetchConfig = {
  scope: string;
  listUrl: string;
};

/**
 * Batch-12 W04 HU-460 · KPI 三通道走列表同源 scope（90s SWR）。
 * Batch-12 W04 HU-464 · count-only：`limit=1`，只消费 body/meta.total（禁大体量拉数）。
 */
export function adminKpiQueueListFetchConfig(
  key: AdminHomeKpiChannelKey,
): AdminKpiQueueListFetchConfig {
  const limit = ADMIN_HOME_KPI_COUNT_ONLY_LIMIT;
  switch (key) {
    case "orders":
      return {
        scope: "orders",
        listUrl: `${routes.admin.orders({ limit })}`,
      };
    case "disputes":
      return {
        scope: "disputes",
        listUrl: `${routes.admin.disputes({ limit })}`,
      };
    case "guides":
      return {
        scope: "guides",
        listUrl: `${routes.admin.guides({ limit })}`,
      };
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export function adminKpiQueueListCacheKey(key: AdminHomeKpiChannelKey): string {
  const { scope, listUrl } = adminKpiQueueListFetchConfig(key);
  return adminListFetchCacheKey(scope, listUrl);
}
