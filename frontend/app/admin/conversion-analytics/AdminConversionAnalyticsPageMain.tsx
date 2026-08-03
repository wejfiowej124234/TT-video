"use client";

import { useId } from "react";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { AdminOpsPlaneSidebarHint } from "@/components/admin/ops/AdminOpsPlaneSidebarHint";
import { ConversionFunnelDashboard } from "@/components/product-enhancement/ConversionFunnelDashboard";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { PES_WAVE3_ID } from "@/lib/conversionAnalyticsLayer";
import { adminPageNavLinkClass } from "@/lib/adminUi";

export default function AdminConversionAnalyticsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("pes3_admin_page_title")}
      subtitle={t("pes3_admin_page_subtitle")}
      mainDataAttrs={{ "data-tt-admin-conversion-analytics": "1", "data-tt-pes-wave3": PES_WAVE3_ID }}
    >
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.READ} />
      <AdminOpsPlaneSidebarHint />
      <AdminNoticeBanner tone="info" message={t("pes3_admin_client_only_notice")} className="mb-4" />
      <nav className="mb-6 flex flex-wrap gap-3" aria-label={t("pes3_admin_related_aria")}>
        <Link href="/admin/growth/analytics" className={adminPageNavLinkClass()}>
          {t("admin_shell_nav_growth_analytics")}
        </Link>
        <Link href="/admin/growth" className={adminPageNavLinkClass()}>
          {t("admin_shell_nav_growth_hub")}
        </Link>
      </nav>
      <AdminWarmL5Surface data-tt-admin-conversion-funnel="1">
        <ConversionFunnelDashboard variant="admin" />
      </AdminWarmL5Surface>
    </AdminDetailPageChrome>
  );
}
