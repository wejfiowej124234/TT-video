"use client";

import { AdminActorCapabilityStrip } from "@/components/admin/AdminActorCapabilityStrip";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import { AdminLayoutSubpageNav } from "@/components/admin/AdminLayoutSubpageNav";
import { AdminRoutePermissionBanner } from "@/components/admin/AdminRoutePermissionBanner";
import { AdminRecentVisitsTracker } from "@/components/admin/AdminRecentVisitsTracker";
import { AdminShellApproveBanner } from "@/components/admin/AdminShellApproveBanner";
import { AdminShellSidebar } from "@/components/admin/AdminShellSidebar";
import AdminShellBar from "@/components/admin/AdminShellBar";
import { AdminCapabilitiesProvider } from "@/lib/admin/useAdminCapabilities";
import { TT_ADMIN_ZONE_ROOT } from "@/lib/adminUi";

/** Admin 子树：单例 capabilities 请求 + 壳层（避免 9× GET /admin/capabilities）。 */
export function AdminCapabilitiesShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminCapabilitiesProvider>
      <div
        className={`${TT_ADMIN_ZONE_ROOT} flex min-h-screen flex-col`}
        data-tt-admin-zone-root="1"
      >
      <AdminRecentVisitsTracker />
      <AdminShellBar />
      <AdminShellApproveBanner />
      <AdminActorCapabilityStrip />
      <AdminCommandPalette />
      <div className="flex min-h-0 flex-1">
        <AdminShellSidebar />
        <div className="min-w-0 flex-1">
          <AdminLayoutSubpageNav />
          <AdminRoutePermissionBanner />
          {children}
        </div>
      </div>
      </div>
    </AdminCapabilitiesProvider>
  );
}
