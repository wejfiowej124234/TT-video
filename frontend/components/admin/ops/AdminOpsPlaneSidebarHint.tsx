"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";

/** Ops plane hub · 侧栏为导航 SSOT（Hub 仅 KPI + 说明，不重复入口）。 */
export function AdminOpsPlaneSidebarHint() {
  const { t } = useTranslation();
  return (
    <AdminNoticeBanner
      tone="info"
      size="md"
      className="mb-4"
      message={t("admin_ops_plane_sidebar_nav_hint")}
      dataAttrs={{ "data-tt-admin-ops-plane-sidebar-hint": "1" }}
    />
  );
}
