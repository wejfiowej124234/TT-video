"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type EventRow = {
  id?: string;
  request_id?: string;
  event_type?: string;
  event_detail?: string | null;
  occurred_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: EventRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const EVENT_TYPE_MAX = 128;

function trunc(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function parseComplianceEventsQuery(sp: URLSearchParams): { limit: number; eventType: string } {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const eventType = (sp.get("event_type") ?? "").trim().slice(0, EVENT_TYPE_MAX);
  return { limit, eventType };
}

function buildComplianceEventsPath(requestId: string, q: { limit: number; eventType: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const et = q.eventType.trim().slice(0, EVENT_TYPE_MAX);
  if (et) sp.set("event_type", et);
  const base = `/admin/compliance/requests/${encodeURIComponent(requestId)}/events`;
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/** 500：DSAR 事件轴只读（须 admin + DB）。 */
function AdminComplianceRequestEventsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const eventTypeInputId = useId();
  const adminAppliedFiltersDescId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const requestId = useMemo(() => {
    const raw = params?.requestId;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const { limit, eventType } = useMemo(
    () => parseComplianceEventsQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<EventRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftEventType, setDraftEventType] = useState(eventType);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftEventType(eventType);
  }, [limit, eventType]);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      setError(null);
      setItems([]);
      setMeta(null);
      setAppliedFilters(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = {
      "x-request-id": `admin-dsar-ev-${requestId}-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.complianceDataRequestEvents(requestId, {
      limit: effLimit,
      ...(eventType ? { event_type: eventType } : {}),
    });

    adminFetchJson<Res>("AdminComplianceRequestEventsPage", apiUrl(path), { headers })
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminComplianceRequestEventsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [requestId, limit, eventType]);

  const apply = () => {
    if (!requestId) return;
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildComplianceEventsPath(requestId, {
        limit: nextLimit,
        eventType: draftEventType.trim().slice(0, EVENT_TYPE_MAX),
      }),
    );
  };

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_compliance_events_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_compliance_events_subtitle")}</p>
          {requestId ? (
            <p className="mt-2 font-mono text-small text-ink-500 break-all">
              {t("admin_compliance_events_requestId")}: {requestId}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          {requestId ? (
            <Link
              href={`/admin/compliance/requests/${encodeURIComponent(requestId)}/update`}
              className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_compliance_requests_openUpdate")}
            </Link>
          ) : null}
          <Link href="/admin/compliance/requests" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_compliance_events_backList")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_compliance_events_back")}
          </Link>
        </div>
      </header>

      {!requestId ? (
        <p className="mt-6 text-body text-danger" role="alert">
          {t("admin_compliance_events_missingId")}
        </p>
      ) : (
        <>
          <form
            className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            aria-label={t("admin_compliance_events_filters")}
            aria-describedby={appliedFilters ? adminAppliedFiltersDescId : undefined}
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
          >
            <div className="min-w-[8rem]">
              <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
                {t("admin_compliance_events_limit")}
              </label>
              <input
                id={limitInputId}
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`mt-1 min-h-[44px] w-24 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              />
            </div>
            <div className="min-w-[12rem] flex-1">
              <label htmlFor={eventTypeInputId} className="block text-small font-medium text-ink-600">
                {t("admin_compliance_events_eventType")}
              </label>
              <input
                id={eventTypeInputId}
                type="text"
                value={draftEventType}
                onChange={(e) => setDraftEventType(e.target.value.slice(0, EVENT_TYPE_MAX))}
                className={`mt-1 w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 text-small font-mono ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_compliance_events_eventType_ph")}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              {t("admin_compliance_events_apply")}
            </button>
          </form>

          {appliedFilters ? (
            <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
              {t("admin_compliance_events_applied")}: {JSON.stringify(appliedFilters)}
            </AdminAppliedFiltersBanner>
          ) : null}

          <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

          {meta?.note ? (
            <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
          ) : null}

          {loading && (
            <p className="mt-6 text-body text-ink-500" role="status">
              {t("admin_compliance_events_loading")}
            </p>
          )}
          {error && (
            <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
              {adminErrorUserText(error, t)}
            </p>
          )}

          {!loading && !error && (
            <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_compliance_events_table_aria")}>
              <table className="min-w-full divide-y divide-ink-100 text-left text-small">
                <thead className="bg-bg-console text-ink-700">
                  <tr>
                    <th className="px-3 py-3 font-medium">{t("admin_compliance_events_colTime")}</th>
                    <th className="px-3 py-3 font-medium">{t("admin_compliance_events_colType")}</th>
                    <th className="px-3 py-3 font-medium">{t("admin_compliance_events_colDetail")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 text-ink-700">
                  {items.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-ink-500" colSpan={3}>
                        {t("admin_compliance_events_empty")}
                      </td>
                    </tr>
                  )}
                  {items.map((r, idx) => {
                    const dash = t("admin_em_dash");
                    return (
                      <tr key={r.id ?? `ev-${idx}`}>
                        <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.occurred_at ?? dash}</td>
                        <td className="px-3 py-2 font-mono text-meta">{r.event_type ?? dash}</td>
                        <td className="px-3 py-2 max-w-xl font-mono text-meta">
                          <span className="block truncate" title={r.event_detail ?? ""}>
                            {trunc(r.event_detail, 200, dash)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default function AdminComplianceRequestEventsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_compliance_events_title">
      <AdminComplianceRequestEventsPageInner />
    </AdminSearchParamsSuspense>
  );
}

