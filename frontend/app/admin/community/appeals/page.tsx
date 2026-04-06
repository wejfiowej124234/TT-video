"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
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
  appellant_id?: string;
  body?: string;
  status?: string;
  reviewer_note?: string | null;
  version?: number;
  created_at?: string;
  reviewed_at?: string | null;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const APPEAL_STATUS = ["", "pending", "accepted", "rejected"] as const;
const APPEAL_STATUS_URL = new Set(["pending", "accepted", "rejected"]);

function bodyPreview(s: string | undefined, dash: string): string {
  const text = s?.trim() || "";
  if (!text) return dash;
  return text.length > 96 ? `${text.slice(0, 96)}…` : text;
}

function parseAppealsListQuery(sp: URLSearchParams): {
  limit: number;
  reportId: string;
  status: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawR = (sp.get("report_id") ?? "").trim();
  const reportId = isUuidString(rawR) ? rawR : "";
  const rawSt = (sp.get("status") ?? "").trim();
  const status = APPEAL_STATUS_URL.has(rawSt) ? rawSt : "";
  return { limit, reportId, status };
}

function buildAppealsListPath(q: { limit: number; reportId: string; status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.reportId && isUuidString(q.reportId)) sp.set("report_id", q.reportId.trim());
  if (APPEAL_STATUS_URL.has(q.status)) sp.set("status", q.status);
  return `/admin/community/appeals?${sp.toString()}`;
}

/** 160：社区申诉台账只读（须 admin + DB）。 */
function AdminCommunityAppealsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseAppealsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftReportId, setDraftReportId] = useState(listQ.reportId);
  const [draftStatus, setDraftStatus] = useState(listQ.status);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftReportId(listQ.reportId);
    setDraftStatus(listQ.status);
  }, [listQ]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-appeals-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.communityAppeals({
      limit: listQ.limit,
      report_id: listQ.reportId || undefined,
      status: listQ.status || undefined,
    });

    adminFetchJson<Res>("AdminCommunityAppealsPage", apiUrl(path), { headers })
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
        logAdminFetch("AdminCommunityAppealsPage", e);
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
    router.push(
      buildAppealsListPath({
        limit: nextLimit,
        reportId: nextRep,
        status: APPEAL_STATUS_URL.has(draftStatus) ? draftStatus : "",
      }),
    );
  };

  const resetFilters = () => {
    router.push(buildAppealsListPath({ limit: 50, reportId: "", status: "" }));
  };

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_appeals_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_appeals_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
          <Link href="/admin/community/appeals/review" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_appeals_linkReview")}
          </Link>
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
            {t("admin_community_reports_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-appeals-filter-form"
          aria-label={t("admin_appeals_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_appeals_filters")}</p>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-small text-ink-700">
              {t("admin_appeals_limit")}
              <input
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_appeals_reportId")}
              <input
                type="text"
                value={draftReportId}
                onChange={(e) => setDraftReportId(e.target.value)}
                className={`ml-2 min-h-[44px] w-44 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_placeholder_uuid")}
                autoComplete="off"
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_appeals_status")}
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                className={`ml-2 inline-flex min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {APPEAL_STATUS.map((v) => (
                  <option key={v || "all"} value={v}>
                    {v === "" ? t("admin_appeals_statusAll") : v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {appliedFilters ? (
            <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline">
              {t("admin_appeals_applied")}: {JSON.stringify(appliedFilters)}
            </AdminAppliedFiltersBanner>
          ) : null}
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <button
            form="admin-appeals-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_appeals_apply")}
          </button>
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
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              {t("admin_appeals_reset")}
            </button>
          </form>
        </div>
      </div>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_appeals_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_appeals_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_appeals_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_appeals_colReport")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_appeals_colAppellant")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_appeals_colBody")}</th>
                <th className="px-3 py-3 font-medium">v</th>
                <th className="px-3 py-3 font-medium">{t("admin_appeals_colCreated")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_appeals_colReviewed")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_appeals_colReview")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={8}>
                    {t("admin_appeals_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const id = r.id?.trim();
                const ver = r.version;
                const reviewHref =
                  id != null && ver != null
                    ? `/admin/community/appeals/review?appeal_id=${encodeURIComponent(id)}&expected_version=${encodeURIComponent(String(ver))}`
                    : null;
                return (
                  <tr key={id ?? `ap-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta">{r.status ?? t("admin_em_dash")}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.report_id}>
                      {r.report_id ?? t("admin_em_dash")}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.appellant_id}>
                      {r.appellant_id ?? t("admin_em_dash")}
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <span className="block truncate" title={r.body}>
                        {bodyPreview(r.body, t("admin_em_dash"))}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.version ?? t("admin_em_dash")}</td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                      {r.created_at ?? t("admin_em_dash")}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                      {r.reviewed_at ?? t("admin_em_dash")}
                    </td>
                    <td className="px-3 py-2">
                      {reviewHref && r.status === "pending" ? (
                        <Link
                          href={reviewHref}
                          className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-mono text-meta ${travelFocusRingOffset2Classes}`}
                        >
                          {t("admin_appeals_rowReview")}
                        </Link>
                      ) : (
                        t("admin_em_dash")
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

export default function AdminCommunityAppealsPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_appeals_title"
      backLinkLabelKey="admin_community_reports_back"
    >
      <AdminCommunityAppealsPageInner />
    </AdminSearchParamsSuspense>
  );
}
