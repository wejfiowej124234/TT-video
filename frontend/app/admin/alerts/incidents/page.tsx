"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

const INCIDENT_Q = "incident_id";
const INCIDENT_MAX = 512;

function parseIncidentHubQuery(sp: URLSearchParams): { incidentId: string } {
  return { incidentId: (sp.get(INCIDENT_Q) ?? "").trim().slice(0, INCIDENT_MAX) };
}

function buildIncidentHubPath(incidentId: string): string {
  const id = incidentId.trim().slice(0, INCIDENT_MAX);
  if (!id) return "/admin/alerts/incidents";
  const sp = new URLSearchParams();
  sp.set(INCIDENT_Q, id);
  return `/admin/alerts/incidents?${sp.toString()}`;
}

const ADMIN_ALERT_INCIDENTS_HUB_FORM_ID = "admin-alert-incidents-hub-form";

/** 120 / 70：跳转打开 incident 详情（`GET …/alerts/incidents/:id`）；入口 **URL 同步** `incident_id`。 */
function AdminAlertIncidentsHubPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const hubFilterHintId = useId();
  const adminListApplyResetHintId = useId();
  const incidentIdInputId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminAlertIncidentsHubMetaBuild");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { incidentId: urlIncidentId } = useMemo(
    () => parseIncidentHubQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [draftId, setDraftId] = useState(urlIncidentId);

  useEffect(() => {
    setDraftId(urlIncidentId);
  }, [urlIncidentId]);

  const applyBookmark = () => {
    router.push(buildIncidentHubPath(draftId));
  };

  const resetBookmark = () => {
    setDraftId("");
    router.push("/admin/alerts/incidents");
  };

  const openDetail = () => {
    const raw = draftId.trim().slice(0, INCIDENT_MAX);
    if (!raw) return;
    router.push(`/admin/alerts/incidents/${encodeURIComponent(raw)}`);
  };

  const onHubFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sub = (e.nativeEvent as SubmitEvent).submitter;
    const action =
      sub instanceof HTMLButtonElement && typeof sub.value === "string" && sub.value
        ? sub.value
        : "open";
    if (action === "applyUrl") applyBookmark();
    else if (action === "reset") resetBookmark();
    else openDetail();
  };

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_alert_incident_hub_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_alert_incident_hub_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_schema_back")}
          </Link>
        </div>
      </header>

      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
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
              className={`mt-1 w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_alert_incident_idPh")}
              autoComplete="off"
            />
          </label>
          {urlIncidentId ? (
            <Link
              href={`/admin/alerts/incidents/${encodeURIComponent(urlIncidentId)}`}
              className={`${touchTargetLink44Classes} block rounded-[var(--radius-md)] border border-ink-200 bg-white/60 px-3 py-2 text-left text-small text-ink-600 font-mono break-all transition hover:border-travel-400 hover:text-travel-700 ${travelFocusRingCoreOffset2WhiteClasses}`}
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
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_alert_incident_open")}
          </button>
          <button
            form={ADMIN_ALERT_INCIDENTS_HUB_FORM_ID}
            type="submit"
            name="hubAction"
            value="applyUrl"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-ink-100 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-200 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_alert_incident_applyUrl")}
          </button>
          <button
            form={ADMIN_ALERT_INCIDENTS_HUB_FORM_ID}
            type="submit"
            name="hubAction"
            value="reset"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_alert_incident_resetUrl")}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function AdminAlertIncidentsHubPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_alert_incident_hub_title">
      <AdminAlertIncidentsHubPageInner />
    </AdminSearchParamsSuspense>
  );
}

