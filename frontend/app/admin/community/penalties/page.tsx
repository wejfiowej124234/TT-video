"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { useTranslation } from "@/components/LocaleProvider";
import {
  type AdminFetchErrorKind,
  adminApiErrorUserText,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";
import { isUuidString } from "@/lib/isUuidString";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type Row = {
  id?: string;
  report_id?: string | null;
  subject_user_id?: string;
  action?: string;
  status?: string;
  reason?: string | null;
  created_by?: string;
  expires_at?: string | null;
  metadata?: unknown;
  created_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const PENALTY_STATUS = ["", "active", "lifted", "superseded"] as const;
const PENALTY_STATUS_URL = new Set(["active", "lifted", "superseded"]);
const PENALTY_ACTIONS = [
  "warn",
  "limit_feed",
  "mute",
  "ban",
  "shadow_ban",
  "content_remove",
  "other",
] as const;

type CreateRes = { status?: string; error?: string; id?: string };

function penaltyCreateErr(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "invalid_penalty_subject_user_id":
      return t("admin_penalties_createErrBadSubject");
    case "invalid_community_penalty_action":
      return t("admin_penalties_createErrBadAction");
    case "community_report_not_found_for_penalty":
      return t("admin_penalties_createErrReportMissing");
    case "invalid_penalty_report_id":
      return t("admin_penalties_createErrBadReport");
    case "invalid_penalty_expires_at":
      return t("admin_penalties_createErrBadExpires");
    default:
      return adminApiErrorUserText(code, t);
  }
}

function parsePenaltiesListQuery(sp: URLSearchParams): {
  limit: number;
  subjectUserId: string;
  reportId: string;
  status: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawS = (sp.get("subject_user_id") ?? "").trim();
  const subjectUserId = isUuidString(rawS) ? rawS : "";
  const rawR = (sp.get("report_id") ?? "").trim();
  const reportId = isUuidString(rawR) ? rawR : "";
  const rawSt = (sp.get("status") ?? "").trim();
  const status = PENALTY_STATUS_URL.has(rawSt) ? rawSt : "";
  return { limit, subjectUserId, reportId, status };
}

function buildPenaltiesListPath(q: {
  limit: number;
  subjectUserId: string;
  reportId: string;
  status: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.subjectUserId && isUuidString(q.subjectUserId)) sp.set("subject_user_id", q.subjectUserId.trim());
  if (q.reportId && isUuidString(q.reportId)) sp.set("report_id", q.reportId.trim());
  if (PENALTY_STATUS_URL.has(q.status)) sp.set("status", q.status);
  return `/admin/community/penalties?${sp.toString()}`;
}

function metaPreview(m: unknown, dash: string): string {
  if (m == null) return dash;
  try {
    const s = typeof m === "string" ? m : JSON.stringify(m);
    return s.length > 72 ? `${s.slice(0, 72)}…` : s;
  } catch {
    return dash;
  }
}

/** 160：社区处罚台账只读（须 admin + DB）。 */
function AdminCommunityPenaltiesPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const createDialogTitleId = useId();
  const createDialogDescId = useId();
  const createModalFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const limitInputId = useId();
  const subjectInputId = useId();
  const reportIdInputId = useId();
  const statusSelectId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parsePenaltiesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftSubject, setDraftSubject] = useState(listQ.subjectUserId);
  const [draftReportId, setDraftReportId] = useState(listQ.reportId);
  const [draftStatus, setDraftStatus] = useState(listQ.status);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftSubject(listQ.subjectUserId);
    setDraftReportId(listQ.reportId);
    setDraftStatus(listQ.status);
  }, [listQ]);

  const [showCreate, setShowCreate] = useState(false);
  const [cSubject, setCSubject] = useState("");
  const [cAction, setCAction] = useState<(typeof PENALTY_ACTIONS)[number]>("warn");
  const [cReportId, setCReportId] = useState("");
  const [cReason, setCReason] = useState("");
  const [cExpires, setCExpires] = useState("");
  const [cMetaJson, setCMetaJson] = useState("");
  const [cSubmitting, setCSubmitting] = useState(false);
  const [cError, setCError] = useState<string | null>(null);

  const closeCreate = useCallback(() => {
    setShowCreate(false);
    setCError(null);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-penalties-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.communityPenalties({
      limit: listQ.limit,
      subject_user_id: listQ.subjectUserId || undefined,
      report_id: listQ.reportId || undefined,
      status: listQ.status || undefined,
    });

    adminFetchJson<Res>("AdminCommunityPenaltiesPage", apiUrl(path), { headers })
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
        logAdminFetch("AdminCommunityPenaltiesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ, reloadTick]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const sTrim = draftSubject.trim();
    const nextSub = isUuidString(sTrim) ? sTrim : "";
    const rTrim = draftReportId.trim();
    const nextRep = isUuidString(rTrim) ? rTrim : "";
    router.push(
      buildPenaltiesListPath({
        limit: nextLimit,
        subjectUserId: nextSub,
        reportId: nextRep,
        status: PENALTY_STATUS_URL.has(draftStatus) ? draftStatus : "",
      }),
    );
  };

  const resetFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : listQ.limit;
    router.push(buildPenaltiesListPath({ limit: nextLimit, subjectUserId: "", reportId: "", status: "" }));
  };

  const hasActiveFilters =
    Boolean(listQ.subjectUserId) || Boolean(listQ.reportId) || Boolean(listQ.status);

  const openCreate = () => {
    setCError(null);
    setCSubject("");
    setCAction("warn");
    setCReportId("");
    setCReason("");
    setCExpires("");
    setCMetaJson("");
    setShowCreate(true);
  };

  const submitCreate = useCallback(() => {
    const sub = cSubject.trim();
    if (!sub) {
      setCError(t("admin_penalties_createNeedSubject"));
      return;
    }
    let metadata: unknown = undefined;
    const mj = cMetaJson.trim();
    if (mj) {
      try {
        metadata = JSON.parse(mj) as unknown;
      } catch {
        setCError(t("admin_penalties_createBadMeta"));
        return;
      }
    }
    setCSubmitting(true);
    setCError(null);
    let headers: Record<string, string>;
    try {
      headers = { ...writeRequestHeaders(), "Content-Type": "application/json" };
    } catch {
      setCError(t("admin_policies_publishAuth"));
      setCSubmitting(false);
      return;
    }
    const body: Record<string, unknown> = {
      subject_user_id: sub,
      action: cAction.trim(),
    };
    const rep = cReportId.trim();
    if (rep) body.report_id = rep;
    if (cReason.trim()) body.reason = cReason.trim();
    if (cExpires.trim()) body.expires_at = cExpires.trim();
    if (metadata !== undefined) body.metadata = metadata;

    void adminFetchJson<CreateRes>("AdminCommunityPenaltyCreate", apiUrl(routes.admin.communityPenaltyCreate), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if (res.status === 400 && err) {
          setCError(penaltyCreateErr(err, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityPenaltyCreate", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closeCreate();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityPenaltyCreate", e);
        const msg = e instanceof Error ? e.message : "";
        setCError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setCSubmitting(false));
  }, [cAction, cExpires, cMetaJson, cReason, cReportId, cSubject, closeCreate, t]);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_penalties_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_penalties_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              openCreate();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-travel-400 bg-travel-50 px-3 py-1 text-small font-medium text-travel-800 hover:bg-travel-100 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              {t("admin_penalties_createOpen")}
            </button>
          </form>
          <Link href="/admin/community/reports" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_penalties_linkReports")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_penalties_back")}
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-penalties-filter-form"
          className="space-y-3"
          aria-label={t("admin_penalties_filters")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_penalties_filters")}</p>
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[8rem]">
              <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
                {t("admin_penalties_limit")}
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
            <div className="min-w-[10rem] flex-1">
              <label htmlFor={subjectInputId} className="block text-small font-medium text-ink-600">
                {t("admin_penalties_subject")}
              </label>
              <input
                id={subjectInputId}
                type="text"
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
                className={`mt-1 w-full min-h-[44px] max-w-md rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_placeholder_uuid")}
                autoComplete="off"
              />
            </div>
            <div className="min-w-[10rem] flex-1">
              <label htmlFor={reportIdInputId} className="block text-small font-medium text-ink-600">
                {t("admin_penalties_reportId")}
              </label>
              <input
                id={reportIdInputId}
                type="text"
                value={draftReportId}
                onChange={(e) => setDraftReportId(e.target.value)}
                className={`mt-1 w-full min-h-[44px] max-w-md rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_placeholder_uuid")}
                autoComplete="off"
              />
            </div>
            <div className="min-w-[10rem]">
              <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
                {t("admin_penalties_status")}
              </label>
              <select
                id={statusSelectId}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {PENALTY_STATUS.map((v) => (
                  <option key={v || "all"} value={v}>
                    {v === "" ? t("admin_penalties_statusAll") : v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-penalties-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_penalties_apply")}
          </button>
          {hasActiveFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                resetFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_penalties_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_penalties_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_penalties_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_penalties_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_penalties_colAction")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_penalties_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_penalties_colSubject")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_penalties_colReport")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_penalties_colReason")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_penalties_colBy")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_penalties_colExpires")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_penalties_colMeta")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_penalties_colCreated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={9}>
                    {t("admin_penalties_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `pen-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta">{r.action ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.status ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.subject_user_id}>
                      {r.subject_user_id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.report_id ?? ""}>
                      {r.report_id ?? dash}
                    </td>
                    <td className="px-3 py-2 max-w-[10rem] truncate" title={r.reason ?? ""}>
                      {r.reason ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.created_by}>
                      {r.created_by ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.expires_at ?? dash}</td>
                    <td className="px-3 py-2 max-w-[10rem] font-mono text-meta">
                      <span className="block truncate" title={metaPreview(r.metadata, dash)}>
                        {metaPreview(r.metadata, dash)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {showCreate ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={createDialogTitleId}
          aria-describedby={createDialogDescId}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-medium">
            <h2 id={createDialogTitleId} className="text-body-l font-semibold text-ink-900">
              {t("admin_penalties_createTitle")}
            </h2>
            <p id={createDialogDescId} className="mt-1 text-meta text-ink-600">{t("admin_penalties_createSubtitle")}</p>
            <p id={createModalFilterHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
              {t("admin_penalties_create_filter_hint")}
            </p>

            <form
              aria-describedby={createModalFilterHintId}
              className="mt-4 space-y-3 text-small"
              onSubmit={(e) => {
                e.preventDefault();
                const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
                  closeCreate();
                  return;
                }
                submitCreate();
              }}
            >
              <label className="block text-ink-700">
                {t("admin_penalties_createSubject")}
                <input
                  type="text"
                  name="subject_user_id"
                  value={cSubject}
                  onChange={(e) => setCSubject(e.target.value)}
                  className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                  autoComplete="off"
                />
              </label>
              <label className="block text-ink-700">
                {t("admin_penalties_createAction")}
                <select
                  name="action"
                  value={cAction}
                  onChange={(e) => setCAction(e.target.value as (typeof PENALTY_ACTIONS)[number])}
                  className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono ${travelFocusRingCoreOffset2WhiteClasses}`}
                >
                  {PENALTY_ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-ink-700">
                {t("admin_penalties_createReportId")}
                <input
                  type="text"
                  name="report_id"
                  value={cReportId}
                  onChange={(e) => setCReportId(e.target.value)}
                  className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                  autoComplete="off"
                />
              </label>
              <label className="block text-ink-700">
                {t("admin_penalties_createReason")}
                <input
                  type="text"
                  name="reason"
                  value={cReason}
                  onChange={(e) => setCReason(e.target.value)}
                  className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
                />
              </label>
              <label className="block text-ink-700">
                {t("admin_penalties_createExpires")}
                <input
                  type="text"
                  name="expires_at"
                  value={cExpires}
                  onChange={(e) => setCExpires(e.target.value)}
                  className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                  placeholder={t("admin_reports_modPenaltyExpiresPh")}
                  autoComplete="off"
                />
              </label>
              <label className="block text-ink-700">
                {t("admin_penalties_createMeta")}
                <textarea
                  name="metadata"
                  value={cMetaJson}
                  onChange={(e) => setCMetaJson(e.target.value)}
                  rows={3}
                  className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                  placeholder={t("admin_placeholder_json_empty")}
                />
              </label>

            {cError ? (
              <p className="mt-3 rounded-[var(--radius-sm)] border border-danger/20 bg-danger/5 p-2 text-small text-danger" role="alert">
                {cError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="submit"
                name="admin_modal_intent"
                value="cancel"
                formNoValidate
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-bg-console ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_reports_modCancel")}
              </button>
              <button
                type="submit"
                disabled={cSubmitting}
                aria-busy={cSubmitting ? true : undefined}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-60 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {cSubmitting ? t("admin_penalties_createSubmitting") : t("admin_penalties_createSubmit")}
              </button>
            </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function AdminCommunityPenaltiesPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_penalties_title"
      backLinkLabelKey="admin_penalties_back"
    >
      <AdminCommunityPenaltiesPageInner />
    </AdminSearchParamsSuspense>
  );
}
