"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminAlertIncidentDetailPage } from "./useAdminAlertIncidentDetailPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
/** 120 / 70：告警 incident 最小只读（须 admin）。 */
export function AdminAlertIncidentDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { incidentId, loading, error, body, meta } = useAdminAlertIncidentDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_alert_incident_detail_title")}
      subtitle={
        <p className="font-mono text-meta break-all">{incidentId || t("admin_em_dash")}</p>
      }
      headerAside={
        <>
          <Link href="/admin/alerts/incidents" className={`${adminPageNavLinkClass()}`}>
            {t("admin_alert_incident_backHub")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_alert_incident_detail_panel_aria")}>
        {!incidentId ? (
          <AdminAlertError message={t("admin_alert_incident_missingId")} />
        ) : loading ? (
            <AdminListLoadingStatus message={t("admin_alert_incident_loading")} className="text-body text-ink-600" />
          ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : (
          <pre className="max-h-[32rem] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
            {JSON.stringify(body?.incident ?? {}, null, 2)}
          </pre>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
