"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOpsPlanePermissionBanners } from "@/components/admin/ops/AdminOpsPlanePermissionBanners";
import { AdminOpsHubNavTiles } from "@/components/admin/ops/AdminOpsHubNavTiles";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_SHELL_OFFICIAL_OPS_NAV_LINKS } from "@/lib/admin/adminShellOfficialOpsNavLinks";
import { OFFICIAL_OPS_L5_PROBE } from "@/lib/admin/officialOpsL5";
import { AdminOfficialOpsHubDashboard } from "./AdminOfficialOpsHubDashboard";
import { useAdminOfficialOpsHubPage } from "./useAdminOfficialOpsHubPage";

export default function AdminOfficialOpsHubPage() {
  const { t } = useTranslation();
  const titleId = useId();
  const { stats, loading, error, reload } = useAdminOfficialOpsHubPage();

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_official_hub_title")}
      subtitle={t("admin_official_hub_subtitle_ops")}
      mainDataAttrs={{
        "data-tt-admin-official-hub-page": "1",
        "data-tt-official-ops-l5-probe": OFFICIAL_OPS_L5_PROBE,
      }}
    >
      <AdminOpsPlanePermissionBanners
        read={ADMIN_PERM.OFFICIAL_READ}
        write={ADMIN_PERM.OFFICIAL_WRITE}
        publish={ADMIN_PERM.OFFICIAL_PUBLISH}
      />
      <AdminOpsHubNavTiles
        links={ADMIN_SHELL_OFFICIAL_OPS_NAV_LINKS}
        dataTtAttr="data-tt-admin-official-hub-link"
      />
      <AdminOfficialOpsHubDashboard
        stats={stats}
        loading={loading}
        error={error}
        onRetry={() => void reload()}
      />
    </AdminDetailPageChrome>
  );
}
