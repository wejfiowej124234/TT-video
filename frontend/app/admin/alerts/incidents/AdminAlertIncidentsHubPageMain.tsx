"use client";

import Link from "next/link";
import { useId, useMemo } from "react";

import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminAlertIncidentsHubSnapshot } from "@/lib/admin/adminAlertIncidentsHubSnapshot";
import { observabilityPeerRelatedFoldLinks } from "@/lib/admin/adminObservabilityRelatedFoldLinks";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminObservabilitySectionBackLinks } from "@/components/admin/AdminObservabilitySectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_ALERT_INCIDENTS_HUB_FORM_ID, INCIDENT_MAX } from "./adminAlertIncidentsHubPageModel";
import { useAdminAlertIncidentsHubPage } from "./useAdminAlertIncidentsHubPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_HUB_SYNCED_LINK_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, ADMIN_SHELL_SECONDARY_BTN_CLASS, adminPageNavLinkClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_HINT_CLASS} from "@/lib/adminUi";

/** 120 / 70：跳转打开 incident 详情（`GET …/alerts/incidents/:id`）；入口 **URL 同步** `incident_id`。 */
export function AdminAlertIncidentsHubPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const hubFilterHintId = useId();
  const adminListApplyResetHintId = useId();
  const incidentIdInputId = useId();
  const {
    buildMeta,
    buildLoading,
    buildError,
    urlIncidentId,
    draftId,
    setDraftId,
    onHubFormSubmit,
  } = useAdminAlertIncidentsHubPage();

  const hubSnapshot = useMemo(
    () =>
      adminAlertIncidentsHubSnapshot({
        urlIncidentId,
        buildLoading,
      }),
    [urlIncidentId, buildLoading],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_alert_incident_hub_title")}
      subtitle={t("admin_alert_incident_hub_subtitle_l5")}
      headerAside={<AdminObservabilitySectionBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={observabilityPeerRelatedFoldLinks("/admin/alerts/incidents")}
        ariaLabelKey="admin_observability_hub_related_aria"
        foldSummaryKey="admin_observability_hub_related_fold"
        dataTtFold="obs-alerts-hub"
      />
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.READ} messageKey="admin_perm_denied_read" />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        alertIncidents={{
          syncedIncidentId: hubSnapshot.syncedIncidentId,
          hasSyncedIncident: hubSnapshot.hasSyncedIncident,
          loading: buildLoading,
          error: Boolean(buildError),
        }}
      />
      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
        <p className="text-small font-medium text-ink-800">{t("admin_alert_incident_hub_panel_aria")}</p>
        <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <p id={hubFilterHintId} className="mt-2 text-meta text-ink-600">
          {t("admin_alert_incident_hub_filter_hint")}
        </p>
        <form
          id={ADMIN_ALERT_INCIDENTS_HUB_FORM_ID}
          className="mt-3 space-y-3"
          aria-label={t("admin_alert_incident_hub_panel_aria")}
          aria-describedby={[adminListApplyResetHintId, hubFilterHintId].filter(Boolean).join(" ")}
          onSubmit={onHubFormSubmit}
        >
          <label htmlFor={incidentIdInputId} className="block text-small font-medium text-ink-700">
            {t("admin_alert_incident_idField")}
            <input
              id={incidentIdInputId}
              type="text"
              name="incident_id"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value.slice(0, INCIDENT_MAX))}
              className={`mt-1 w-full max-w-md min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small text-ink-800 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_alert_incident_idPh")}
              autoComplete="off"
            />
          </label>
          {urlIncidentId ? (
            <Link
              href={`/admin/alerts/incidents/${encodeURIComponent(urlIncidentId)}`}
              className={`${touchTargetLink44Classes} ${ADMIN_HUB_SYNCED_LINK_CARD_CLASS} text-ink-600 transition hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              aria-label={t("admin_alert_incident_open")}
            >
              {t("admin_alert_incident_urlSynced")} <span className="text-ink-800">{urlIncidentId}</span>
            </Link>
          ) : null}
        </form>
        <div className={ADMIN_FILTER_ACTIONS_CLASS}>
          <button
            form={ADMIN_ALERT_INCIDENTS_HUB_FORM_ID}
            type="submit"
            name="hubAction"
            value="open"
            className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          >
            {t("admin_alert_incident_open")}
          </button>
          <button
            form={ADMIN_ALERT_INCIDENTS_HUB_FORM_ID}
            type="submit"
            name="hubAction"
            value="applyUrl"
            className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} px-4 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            {t("admin_alert_incident_applyUrl")}
          </button>
          <button
            form={ADMIN_ALERT_INCIDENTS_HUB_FORM_ID}
            type="submit"
            name="hubAction"
            value="reset"
            className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            {t("admin_alert_incident_resetUrl")}
          </button>
        </div>
      </div>
    </AdminListPageChrome>
  );
}
