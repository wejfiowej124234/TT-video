"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

type Props = {
  pageTitleId: string;
};

export function AdminObservabilityPageHeader({ pageTitleId }: Props) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_observability_title")}
        </h1>
        <p className="mt-1 text-body text-ink-600">{t("admin_observability_subtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
        <Link
          href="/admin/audit"
          className={adminPageNavLinkClass()}
        >
          {t("admin_observability_linkAuditLogs")}
        </Link>
        <Link
          href="/admin/audit/operations"
          className={adminPageNavLinkClass()}
        >
          {t("admin_observability_linkAuditOps")}
        </Link>
        <Link
          href="/admin/indexer/reconcile-reports"
          className={adminPageNavLinkClass()}
        >
          {t("admin_observability_linkReconcileReports")}
        </Link>
        <Link
          href="/admin/alerts/incidents"
          className={adminPageNavLinkClass()}
        >
          {t("admin_observability_linkIncidents")}
        </Link>
        <Link
          href="/admin/trust-growth"
          className={adminPageNavLinkClass()}
        >
          {t("admin_shell_nav_trust_growth")}
        </Link>
        <Link
          href="/admin"
          className={adminPageNavLinkClass()}
        >
          {t("admin_schema_back")}
        </Link>
      </div>
    </header>
  );
}
