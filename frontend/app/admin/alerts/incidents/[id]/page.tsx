"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type Res = {
  status?: string;
  error?: string;
  incident?: unknown;
  meta?: unknown;
};

/** 120 / 70：告警 incident 最小只读（须 admin）。 */
function AdminAlertIncidentDetailPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const incidentId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<Res | null>(null);

  useEffect(() => {
    if (!incidentId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-incident-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminAlertIncidentDetailPage",
      apiUrl(routes.admin.alertIncident(incidentId)),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminAlertIncidentDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [incidentId]);

  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_alert_incident_detail_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600 font-mono text-meta break-all">
            {incidentId || t("admin_em_dash")}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/alerts/incidents" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_alert_incident_backHub")}
          </Link>
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

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_alert_incident_detail_panel_aria")}>
        {!incidentId ? (
          <p className="text-body text-danger" role="alert">
            {t("admin_alert_incident_missingId")}
          </p>
        ) : loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_alert_incident_loading")}
          </p>
        ) : error ? (
          <p className="text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : (
          <pre className="max-h-[32rem] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
            {JSON.stringify(body?.incident ?? {}, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}

export default function AdminAlertIncidentDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_alert_incident_detail_title">
      <AdminAlertIncidentDetailPageInner />
    </AdminSearchParamsSuspense>
  );
}

