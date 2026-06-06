"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminAlertsSectionBackLinks } from "@/components/admin/AdminAlertsSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { useAdminAlertIncidentDetailPage } from "./useAdminAlertIncidentDetailPage";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_CONSOLE_JSON_BLOCK_CLASS, ADMIN_LIST_REFRESHING_SURFACE_CLASS,} from "@/lib/adminUi";
import { ALERT_INCIDENT_DETAIL_RELATED_FOLD_LINKS } from "@/lib/admin/adminAlertIncidentDetailRelatedFoldLinks";
/** 120 / 70：告警 incident 最小只读（须 admin）。 */
export function AdminAlertIncidentDetailPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { incidentId, loading, refreshing, error, body, meta } = useAdminAlertIncidentDetailPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_alert_incident_detail_title")}
      subtitle={
        <p className="font-mono text-small text-ink-800 break-all">{incidentId || t("admin_em_dash")}</p>
      }
      headerAside={<AdminAlertsSectionBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={ALERT_INCIDENT_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_alert_incident_detail_related_aria"
        foldSummaryKey="admin_alert_incident_detail_related_fold"
        dataTtFold="alert-incident-detail"
      />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminWarmL5Surface as="section" className="mt-6" aria-label={t("admin_alert_incident_detail_panel_aria")}>
        {!incidentId ? (
          <AdminAlertError message={t("admin_alert_incident_missingId")} />
        ) : loading && !body ? (
            <AdminListLoadingStatus message={t("admin_alert_incident_loading")} className="text-body text-ink-600" />
          ) : error && !body ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : (
          <pre
            className={`max-h-[32rem] overflow-auto ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
            data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
          >
            {JSON.stringify(body?.incident ?? {}, null, 2)}
          </pre>
        )}
      </AdminWarmL5Surface>
    </AdminDetailPageChrome>
  );
}
