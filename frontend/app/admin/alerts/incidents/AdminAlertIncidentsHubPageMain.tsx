"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_ALERT_INCIDENTS_HUB_FORM_ID, INCIDENT_MAX } from "./adminAlertIncidentsHubPageModel";
import { useAdminAlertIncidentsHubPage } from "./useAdminAlertIncidentsHubPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

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

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_alert_incident_hub_title")}
      subtitle={t("admin_alert_incident_hub_subtitle")}
      headerAside={
        <>
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
      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
        <p className="text-small font-medium text-ink-800">{t("admin_alert_incident_hub_panel_aria")}</p>
        <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
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
              className={`mt-1 w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_alert_incident_idPh")}
              autoComplete="off"
            />
          </label>
          {urlIncidentId ? (
            <Link
              href={`/admin/alerts/incidents/${encodeURIComponent(urlIncidentId)}`}
              className={`${touchTargetLink44Classes} block rounded-[var(--radius-md)] border border-ink-200 bg-white/60 px-3 py-2 text-left text-small text-ink-600 font-mono break-all transition hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              aria-label={t("admin_alert_incident_open")}
            >
              {t("admin_alert_incident_urlSynced")} <span className="text-ink-800">{urlIncidentId}</span>
            </Link>
          ) : null}
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
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
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-ink-100 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-200 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            {t("admin_alert_incident_applyUrl")}
          </button>
          <button
            form={ADMIN_ALERT_INCIDENTS_HUB_FORM_ID}
            type="submit"
            name="hubAction"
            value="reset"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            {t("admin_alert_incident_resetUrl")}
          </button>
        </div>
      </div>
    </AdminListPageChrome>
  );
}
