"use client";

import Link from "next/link";

import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
type AdminComplianceRequestsPageHeaderProps = {
  pageTitleId: string;
};

export function AdminComplianceRequestsPageHeader({ pageTitleId }: AdminComplianceRequestsPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_compliance_requests_title")}
        </h1>
        <p className="mt-1 text-body text-ink-600">{t("admin_compliance_requests_subtitle_l5")}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
        <Link
          href="/admin/observability" data-tt-admin-back-observability-hub="1"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_observability_title")}
        </Link>
        <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
          {t("admin_compliance_requests_back")}
        </Link>
      </div>
    </header>
  );
}
