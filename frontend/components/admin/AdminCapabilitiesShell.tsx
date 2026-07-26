"use client";

import dynamic from "next/dynamic";
import { AdminCommandPaletteLazyGate } from "@/components/admin/AdminCommandPaletteLazyGate";
import { AdminShellPublishChrome } from "@/components/admin/AdminShellPublishChrome";
import { AdminLayoutSubpageNav } from "@/components/admin/AdminLayoutSubpageNav";
import { AdminRoutePermissionBanner } from "@/components/admin/AdminRoutePermissionBanner";
import { AdminListFetchCacheInvalidator } from "@/components/admin/AdminListFetchCacheInvalidator";
import { AdminL5ConfirmProvider } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminRoutePrefetcher } from "@/components/admin/AdminRoutePrefetcher";
import { AdminRecentVisitsTracker } from "@/components/admin/AdminRecentVisitsTracker";
import { AdminShellApproveBanner } from "@/components/admin/AdminShellApproveBanner";
import { AdminShellSidebar } from "@/components/admin/AdminShellSidebar";
import AdminShellBar from "@/components/admin/AdminShellBar";
import { AdminMainBootGate } from "@/components/admin/AdminMainBootGate";
import { AdminNavContentTransition } from "@/components/admin/AdminNavContentTransition";
import { AdminSessionCookieSync } from "@/components/admin/AdminSessionCookieSync";
import { AdminShellPreviewNotice } from "@/components/admin/AdminShellPreviewNotice";
import { AdminHomeQueuesProvider } from "@/lib/admin/adminHomeQueuesProvider";
import { AdminConsoleActorGate } from "@/components/admin/AdminConsoleActorGate";
import { AdminCapabilitiesProvider } from "@/lib/admin/useAdminCapabilities";
import { ADMIN_MAIN_CONTENT_COLUMN_CLASS, ADMIN_ZONE_CONTENT_STACK_CLASS, TT_ADMIN_ZONE_ROOT } from "@/lib/adminUi";

const AdminZoneAmbientBackdrop = dynamic(
  () => import("@/components/admin/AdminZoneAmbientBackdrop"),
  { ssr: false },
);

const AdminDevChunkRecoveryNotice = dynamic(
  () =>
    import("@/components/admin/AdminDevChunkRecoveryNotice").then((mod) => ({
      default: mod.AdminDevChunkRecoveryNotice,
    })),
  { ssr: false },
);

/** Admin 子树：单例 capabilities + 工作台队列请求 + 壳层（避免 N× 并行列表 429）。 */
export function AdminCapabilitiesShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminCapabilitiesProvider>
      <AdminConsoleActorGate>
      <AdminHomeQueuesProvider>
      <AdminL5ConfirmProvider>
      <div
        className={`${TT_ADMIN_ZONE_ROOT} flex min-h-screen flex-col`}
        data-tt-admin-zone-root="1"
      >
      <AdminZoneAmbientBackdrop />
      <div className={ADMIN_ZONE_CONTENT_STACK_CLASS} data-tt-admin-zone-content-stack="1">
      <AdminDevChunkRecoveryNotice />
      <AdminRoutePrefetcher />
      <AdminListFetchCacheInvalidator />
      <AdminRecentVisitsTracker />
      <AdminSessionCookieSync />
      <AdminShellBar />
      {/* Batch-8 WP-02：运营发布面不渲染说教横幅/展开说明；维护者诊断走 AdminShellPublishChrome */}
      <AdminShellPublishChrome />
      <AdminShellPreviewNotice />
      <AdminShellApproveBanner />
      <AdminCommandPaletteLazyGate />
      <div className="flex min-h-0 flex-1">
        <AdminShellSidebar />
        <div className={ADMIN_MAIN_CONTENT_COLUMN_CLASS} data-tt-admin-main-content="1">
          <AdminLayoutSubpageNav />
          <AdminRoutePermissionBanner />
          <div className="relative min-h-0 flex-1">
            <AdminMainBootGate>
              <AdminNavContentTransition>{children}</AdminNavContentTransition>
            </AdminMainBootGate>
          </div>
        </div>
      </div>
      </div>
      </div>
      </AdminL5ConfirmProvider>
      </AdminHomeQueuesProvider>
      </AdminConsoleActorGate>
    </AdminCapabilitiesProvider>
  );
}
