import { invalidateAdminHomeOverviewCache } from "@/lib/admin/adminHomeOverviewFetchCache";
import { invalidateAdminListFetchCache } from "@/lib/admin/adminListFetchCache";

/** 列表/详情写成功后 · 通知首页队列与 KPI 重新拉取。 */
export const ADMIN_DATA_MUTATED_EVENT = "traveltrust:admin-data-mutated";

/** 写后统一失效：scope 前缀（`scope::`）或全量清空。 */
export function invalidateAdminCachesAfterWrite(scopePrefixes?: readonly string[]): void {
  if (scopePrefixes?.length) {
    for (const scope of scopePrefixes) {
      invalidateAdminListFetchCache(`${scope}::`);
    }
  } else {
    invalidateAdminListFetchCache();
  }
  invalidateAdminHomeOverviewCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_DATA_MUTATED_EVENT));
  }
}
