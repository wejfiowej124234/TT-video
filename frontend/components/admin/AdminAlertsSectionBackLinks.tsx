"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** 告警 incident 子域顶栏：任务收件箱 → incident 枢纽 → 页内操作 → 可观测枢纽。 */
export function AdminAlertsSectionBackLinks({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      <AdminInboxQueueBackLinks />
      <Link
        href="/admin/alerts/incidents"
        className={adminPageNavLinkClass()}
        data-tt-admin-back-alerts-hub="1"
      >
        {t("admin_alert_incident_backHub")}
      </Link>
      {children}
      <Link
        href="/admin/observability"
        className={adminPageNavLinkClass()}
        data-tt-admin-back-observability-hub="1"
      >
        {t("admin_observability_title")}
      </Link>
    </>
  );
}
