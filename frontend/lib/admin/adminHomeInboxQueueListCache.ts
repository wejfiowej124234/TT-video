import { adminListFetchCacheKey } from "@/lib/admin/adminListFetchCache";
import type { AdminHomeInboxKey } from "@/lib/admin/adminHomeModel";
import { routes } from "@/lib/api";

export type AdminInboxQueueListFetchConfig = {
  scope: string;
  listUrl: string;
};

/** 首页 Inbox 四通道 · 与列表页 SWR scope/url 对拍（ADM-P1-03）。 */
export function adminInboxQueueListFetchConfig(key: AdminHomeInboxKey): AdminInboxQueueListFetchConfig {
  switch (key) {
    case "provider":
      return {
        scope: "provider-applications",
        listUrl: `${routes.adminProviderApplications}?status=${encodeURIComponent("submitted")}`,
      };
    case "guide":
      return {
        scope: "guide-applications",
        listUrl: `${routes.adminGuideApplications}?status=${encodeURIComponent("pending")}`,
      };
    case "steward":
      return {
        scope: "steward-applications",
        listUrl: `${routes.adminStewardApplications}?status=${encodeURIComponent("stake_pending")}`,
      };
    case "approvals":
      return {
        scope: "approvals",
        listUrl: routes.admin.approvals({ limit: 100, status: "pending" }),
      };
    case "disputes":
      return {
        scope: "disputes",
        listUrl: routes.admin.disputes({ limit: 50, status: "open" }),
      };
    case "reports":
      return {
        scope: "community-reports",
        listUrl: routes.admin.communityReports({ limit: 50, status: "open" }),
      };
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export function adminInboxQueueListCacheKey(key: AdminHomeInboxKey): string {
  const { scope, listUrl } = adminInboxQueueListFetchConfig(key);
  return adminListFetchCacheKey(scope, listUrl);
}
