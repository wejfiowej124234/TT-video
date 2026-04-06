"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

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

type Sla = { due_at?: string; seconds_until_due?: number; overdue?: boolean };

type DsarRow = {
  id?: string;
  request_ref?: string;
  subject_id?: string;
  request_type?: string;
  status?: string;
  due_at?: string | null;
  sla_hours?: number | null;
  sla?: Sla;
  jurisdiction?: string | null;
  notes?: string | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: DsarRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const REF_MAX = 256;
const SUBJECT_MAX = 256;
const JURIS_MAX = 128;

const TYPE_URL = new Set(["export", "erasure"]);
const STATUS_URL = new Set(["open", "in_progress", "completed", "rejected", "cancelled"]);

function parseComplianceRequestsListQuery(sp: URLSearchParams): {
  limit: number;
  requestRef: string;
  subjectId: string;
  requestType: string;
  status: string;
  jurisdiction: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const requestRef = (sp.get("request_ref") ?? "").trim().slice(0, REF_MAX);
  const subjectId = (sp.get("subject_id") ?? "").trim().slice(0, SUBJECT_MAX);
  const rawType = (sp.get("request_type") ?? "").trim().toLowerCase();
  const requestType = TYPE_URL.has(rawType) ? rawType : "";
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status = STATUS_URL.has(rawSt) ? rawSt : "";
  const jurisdiction = (sp.get("jurisdiction") ?? "").trim().slice(0, JURIS_MAX);
  return { limit, requestRef, subjectId, requestType, status, jurisdiction };
}

function buildComplianceRequestsListPath(q: {
  limit: number;
  requestRef: string;
  subjectId: string;
  requestType: string;
  status: string;
  jurisdiction: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const rr = q.requestRef.trim().slice(0, REF_MAX);
  if (rr) sp.set("request_ref", rr);
  const sid = q.subjectId.trim().slice(0, SUBJECT_MAX);
  if (sid) sp.set("subject_id", sid);
  if (q.requestType === "export" || q.requestType === "erasure") {
    sp.set("request_type", q.requestType);
  }
  if (STATUS_URL.has(q.status)) sp.set("status", q.status);
  const jur = q.jurisdiction.trim().slice(0, JURIS_MAX);
  if (jur) sp.set("jurisdiction", jur);
  return `/admin/compliance/requests?${sp.toString()}`;
}

function slaHint(sla: Sla | undefined, dash: string): string {
  if (!sla || typeof sla !== "object") return dash;
  if (sla.overdue) return "overdue";
  if (sla.seconds_until_due != null) return `${sla.seconds_until_due}s`;
  return sla.due_at ?? dash;
}

/** 500：DSAR 请求台账只读（须 admin + DB）。 */
function AdminComplianceRequestsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const refInputId = useId();
  const subjectInputId = useId();
  const typeInputId = useId();
  const statusInputId = useId();
  const jurisInputId = useId();
  const adminFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, requestRef, subjectId, requestType, status, jurisdiction } = useMemo(
    () => parseComplianceRequestsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<DsarRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftRequestRef, setDraftRequestRef] = useState(requestRef);
  const [draftSubjectId, setDraftSubjectId] = useState(subjectId);
  const [draftRequestType, setDraftRequestType] = useState(requestType);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftJurisdiction, setDraftJurisdiction] = useState(jurisdiction);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftRequestRef(requestRef);
    setDraftSubjectId(subjectId);
    setDraftRequestType(requestType);
    setDraftStatus(status);
    setDraftJurisdiction(jurisdiction);
  }, [limit, requestRef, subjectId, requestType, status, jurisdiction]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-dsar-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminComplianceRequestsPage",
      apiUrl(
        routes.admin.complianceDataRequests({
          limit: effLimit,
          ...(requestRef ? { request_ref: requestRef } : {}),
          ...(subjectId ? { subject_id: subjectId } : {}),
          ...(requestType ? { request_type: requestType } : {}),
          ...(status ? { status } : {}),
          ...(jurisdiction ? { jurisdiction } : {}),
        }),
      ),
      { headers },
    )
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
        logAdminFetch("AdminComplianceRequestsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, requestRef, subjectId, requestType, status, jurisdiction]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const rt = draftRequestType.trim().toLowerCase();
    const nextType = TYPE_URL.has(rt) ? rt : "";
    const st = draftStatus.trim().toLowerCase();
    const nextStatus = STATUS_URL.has(st) ? st : "";
    router.push(
      buildComplianceRequestsListPath({
        limit: nextLimit,
        requestRef: draftRequestRef.trim().slice(0, REF_MAX),
        subjectId: draftSubjectId.trim().slice(0, SUBJECT_MAX),
        requestType: nextType,
        status: nextStatus,
        jurisdiction: draftJurisdiction.trim().slice(0, JURIS_MAX),
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildComplianceRequestsListPath({
        limit: nextLimit,
        requestRef: "",
        subjectId: "",
        requestType: "",
        status: "",
        jurisdiction: "",
      }),
    );
  };

  const hasActiveFilters =
    Boolean(requestRef) ||
    Boolean(subjectId) ||
    Boolean(requestType) ||
    Boolean(status) ||
    Boolean(jurisdiction);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_compliance_requests_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_compliance_requests_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_compliance_requests_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-compliance-requests-filter-form"
          className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
          aria-label={t("admin_compliance_requests_filters")}
          aria-describedby={
            [adminListApplyResetHintId, adminFilterHintId, appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="w-full text-meta text-ink-600 leading-relaxed lg:basis-full">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
        <div className="min-w-[8rem]">
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_compliance_requests_limit")}
          </label>
          <input
            id={limitInputId}
            type="text"
            inputMode="numeric"
            value={draftLimit}
            onChange={(e) => setDraftLimit(e.target.value)}
            className={`mt-1 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 ${travelFocusRingCoreOffset2WhiteClasses}`}
          />
        </div>
        <div className="min-w-[9rem] flex-1">
          <label htmlFor={refInputId} className="block text-small font-medium text-ink-600">
            {t("admin_compliance_requests_filter_request_ref")}
          </label>
          <input
            id={refInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={REF_MAX}
            value={draftRequestRef}
            onChange={(e) => setDraftRequestRef(e.target.value.slice(0, REF_MAX))}
            placeholder={t("admin_compliance_requests_filter_request_ref_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={subjectInputId} className="block text-small font-medium text-ink-600">
            {t("admin_compliance_requests_filter_subject_id")}
          </label>
          <input
            id={subjectInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={SUBJECT_MAX}
            value={draftSubjectId}
            onChange={(e) => setDraftSubjectId(e.target.value.slice(0, SUBJECT_MAX))}
            placeholder={t("admin_compliance_requests_filter_subject_id_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[8rem]">
          <label htmlFor={typeInputId} className="block text-small font-medium text-ink-600">
            {t("admin_compliance_requests_filter_request_type")}
          </label>
          <select
            id={typeInputId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftRequestType}
            onChange={(e) => setDraftRequestType(e.target.value)}
          >
            <option value="">{t("admin_compliance_requests_filter_any")}</option>
            <option value="export">export</option>
            <option value="erasure">erasure</option>
          </select>
        </div>
        <div className="min-w-[10rem]">
          <label htmlFor={statusInputId} className="block text-small font-medium text-ink-600">
            {t("admin_compliance_requests_filter_status")}
          </label>
          <select
            id={statusInputId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
          >
            <option value="">{t("admin_compliance_requests_filter_any")}</option>
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="rejected">rejected</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>
        <div className="min-w-[8rem] flex-1">
          <label htmlFor={jurisInputId} className="block text-small font-medium text-ink-600">
            {t("admin_compliance_requests_filter_jurisdiction")}
          </label>
          <input
            id={jurisInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={JURIS_MAX}
            value={draftJurisdiction}
            onChange={(e) => setDraftJurisdiction(e.target.value.slice(0, JURIS_MAX))}
            placeholder={t("admin_compliance_requests_filter_jurisdiction_placeholder")}
            autoComplete="off"
          />
        </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-compliance-requests-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_compliance_requests_apply")}
          </button>
          {hasActiveFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                clearNonLimitFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_compliance_requests_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_compliance_requests_filter_hint")}
      </p>
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_compliance_requests_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_compliance_requests_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_compliance_requests_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_compliance_requests_colRef")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_compliance_requests_colType")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_compliance_requests_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_compliance_requests_colSla")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_compliance_requests_colVer")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_compliance_requests_colEvents")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_compliance_requests_colUpdate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={7}>
                    {t("admin_compliance_requests_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const id = r.id?.trim();
                const dash = t("admin_em_dash");
                return (
                  <tr key={id ?? `dsar-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta max-w-[12rem] truncate" title={r.request_ref}>
                      {r.request_ref ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.request_type ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.status ?? dash}</td>
                    <td
                      className={`px-3 py-2 font-mono text-meta ${r.sla?.overdue ? "text-danger font-semibold" : ""}`}
                      title={r.due_at ?? ""}
                    >
                      {slaHint(r.sla, dash)}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.version ?? dash}</td>
                    <td className="px-3 py-2">
                      {id ? (
                        <Link
                          href={`/admin/compliance/requests/${encodeURIComponent(id)}/events`}
                          className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                        >
                          {t("admin_compliance_requests_openEvents")}
                        </Link>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {id ? (
                        <Link
                          href={`/admin/compliance/requests/${encodeURIComponent(id)}/update?v=${encodeURIComponent(String(r.version ?? ""))}`}
                          className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                        >
                          {t("admin_compliance_requests_openUpdate")}
                        </Link>
                      ) : (
                        dash
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default function AdminComplianceRequestsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_compliance_requests_title">
      <AdminComplianceRequestsPageInner />
    </AdminSearchParamsSuspense>
  );
}

