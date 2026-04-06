"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { useTranslation } from "@/components/LocaleProvider";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { isUuidString } from "@/lib/isUuidString";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type Row = {
  id?: string;
  report_id?: string;
  actor_id?: string;
  status_before?: string;
  status_after?: string;
  admin_notes_snapshot?: string | null;
  disposition_snapshot?: string | null;
  penalty_id?: string | null;
  created_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const SB_MAX = 64;
const SA_MAX = 64;

function trunc(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function parseModCasesQuery(sp: URLSearchParams): {
  limit: number;
  reportId: string;
  actorId: string;
  statusBefore: string;
  statusAfter: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawR = (sp.get("report_id") ?? "").trim();
  const reportId = isUuidString(rawR) ? rawR : "";
  const rawA = (sp.get("actor_id") ?? "").trim();
  const actorId = isUuidString(rawA) ? rawA : "";
  const statusBefore = (sp.get("status_before") ?? "").trim().slice(0, SB_MAX);
  const statusAfter = (sp.get("status_after") ?? "").trim().slice(0, SA_MAX);
  return { limit, reportId, actorId, statusBefore, statusAfter };
}

function buildModCasesPath(q: {
  limit: number;
  reportId: string;
  actorId: string;
  statusBefore: string;
  statusAfter: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.reportId && isUuidString(q.reportId)) sp.set("report_id", q.reportId.trim());
  if (q.actorId && isUuidString(q.actorId)) sp.set("actor_id", q.actorId.trim());
  const sb = q.statusBefore.trim().slice(0, SB_MAX);
  if (sb) sp.set("status_before", sb);
  const sa = q.statusAfter.trim().slice(0, SA_MAX);
  if (sa) sp.set("status_after", sa);
  return `/admin/community/moderation/cases?${sp.toString()}`;
}

/** 160：社区审核审计行只读（须 admin + DB）。 */
function AdminCommunityModerationCasesPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseModCasesQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftReportId, setDraftReportId] = useState(listQ.reportId);
  const [draftActorId, setDraftActorId] = useState(listQ.actorId);
  const [draftStatusBefore, setDraftStatusBefore] = useState(listQ.statusBefore);
  const [draftStatusAfter, setDraftStatusAfter] = useState(listQ.statusAfter);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftReportId(listQ.reportId);
    setDraftActorId(listQ.actorId);
    setDraftStatusBefore(listQ.statusBefore);
    setDraftStatusAfter(listQ.statusAfter);
  }, [listQ]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-mod-cases-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.communityModerationCases({
      limit: listQ.limit,
      report_id: listQ.reportId || undefined,
      actor_id: listQ.actorId || undefined,
      status_before: listQ.statusBefore || undefined,
      status_after: listQ.statusAfter || undefined,
    });

    adminFetchJson<Res>("AdminCommunityModerationCasesPage", apiUrl(path), { headers })
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
        logAdminFetch("AdminCommunityModerationCasesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const rTrim = draftReportId.trim();
    const nextRep = isUuidString(rTrim) ? rTrim : "";
    const aTrim = draftActorId.trim();
    const nextAct = isUuidString(aTrim) ? aTrim : "";
    router.push(
      buildModCasesPath({
        limit: nextLimit,
        reportId: nextRep,
        actorId: nextAct,
        statusBefore: draftStatusBefore.trim().slice(0, SB_MAX),
        statusAfter: draftStatusAfter.trim().slice(0, SA_MAX),
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : listQ.limit;
    router.push(
      buildModCasesPath({
        limit: nextLimit,
        reportId: "",
        actorId: "",
        statusBefore: "",
        statusAfter: "",
      }),
    );
  };

  const hasExtraFilters =
    Boolean(listQ.reportId) ||
    Boolean(listQ.actorId) ||
    Boolean(listQ.statusBefore) ||
    Boolean(listQ.statusAfter);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_mod_cases_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_mod_cases_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/community/reports" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_mod_cases_backReports")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_mod_cases_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-mod-cases-filter-form"
          className="space-y-3"
          aria-label={t("admin_mod_cases_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
        <p className="text-small font-medium text-ink-800">{t("admin_mod_cases_filters")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-small text-ink-700">
            {t("admin_mod_cases_limit")}
            <input
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
            />
          </label>
          <label className="text-small text-ink-700 min-w-[10rem] flex-1">
            {t("admin_mod_cases_reportId")}
            <input
              type="text"
              value={draftReportId}
              onChange={(e) => setDraftReportId(e.target.value)}
              className={`ml-2 w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_mod_cases_reportIdPh")}
              autoComplete="off"
            />
          </label>
          <label className="text-small text-ink-700 min-w-[10rem] flex-1">
            {t("admin_mod_cases_actorId")}
            <input
              type="text"
              value={draftActorId}
              onChange={(e) => setDraftActorId(e.target.value)}
              className={`ml-2 w-full max-w-md min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_mod_cases_actorIdPh")}
              autoComplete="off"
            />
          </label>
          <label className="text-small text-ink-700 min-w-[8rem] flex-1">
            {t("admin_mod_cases_statusBefore")}
            <input
              type="text"
              value={draftStatusBefore}
              onChange={(e) => setDraftStatusBefore(e.target.value.slice(0, SB_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_mod_cases_statusBeforePh")}
              autoComplete="off"
            />
          </label>
          <label className="text-small text-ink-700 min-w-[8rem] flex-1">
            {t("admin_mod_cases_statusAfter")}
            <input
              type="text"
              value={draftStatusAfter}
              onChange={(e) => setDraftStatusAfter(e.target.value.slice(0, SA_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_mod_cases_statusAfterPh")}
              autoComplete="off"
            />
          </label>
        </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-mod-cases-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_mod_cases_apply")}
          </button>
          {hasExtraFilters ? (
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
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_mod_cases_clear_extra")}
              </button>
            </form>
          ) : null}
        </div>
        {appliedFilters ? (
          <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline">
            {t("admin_mod_cases_applied")}: {JSON.stringify(appliedFilters)}
          </AdminAppliedFiltersBanner>
        ) : null}
      </div>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_mod_cases_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_mod_cases_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_mod_cases_colCreated")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_mod_cases_colReport")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_mod_cases_colActor")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_mod_cases_colBefore")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_mod_cases_colAfter")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_mod_cases_colNotes")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_mod_cases_colPenalty")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={7}>
                    {t("admin_mod_cases_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `mc-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[9rem] truncate" title={r.report_id}>
                      {r.report_id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[9rem] truncate" title={r.actor_id}>
                      {r.actor_id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.status_before ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.status_after ?? dash}</td>
                    <td className="px-3 py-2 max-w-xs">
                      <span className="block truncate" title={r.admin_notes_snapshot ?? ""}>
                        {trunc(r.admin_notes_snapshot, 120, dash)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.penalty_id ?? ""}>
                      {r.penalty_id ?? dash}
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

export default function AdminCommunityModerationCasesPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_mod_cases_title"
      backLinkLabelKey="admin_mod_cases_back"
    >
      <AdminCommunityModerationCasesPageInner />
    </AdminSearchParamsSuspense>
  );
}
