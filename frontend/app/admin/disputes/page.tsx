"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
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
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type AdminDispute = {
  id: string;
  order_id: string;
  status: string;
  arbitrator_id?: string;
  refund_ratio?: number | null;
  slash_guide?: boolean | null;
  created_at?: string;
};

type AdminDisputesRes = {
  status?: string;
  items?: AdminDispute[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

const STATUS_MAX = 128;

function clampDisputeLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

function parseDisputesListQuery(sp: URLSearchParams): { limit: number; status: string } {
  const limit = clampDisputeLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const status = (sp.get("status") ?? "").trim().slice(0, STATUS_MAX);
  return { limit, status };
}

function buildDisputesListPath(q: { limit: number; status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampDisputeLimit(q.limit)));
  const st = q.status.trim().slice(0, STATUS_MAX);
  if (st) sp.set("status", st);
  return `/admin/disputes?${sp.toString()}`;
}

/** 70：争议运营列表（GET /api/v1/admin/disputes） */
function AdminDisputesPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, status } = useMemo(
    () => parseDisputesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminDispute[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftStatus(status);
  }, [limit, status]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-disputes-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminDisputesRes>(
      "AdminDisputesPage",
      apiUrl(
        routes.admin.disputes({
          limit,
          ...(status ? { status } : {}),
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
        setAppliedFilters(body.applied_filters ?? null);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminDisputesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampDisputeLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftStatus.trim().slice(0, STATUS_MAX);
    router.push(buildDisputesListPath({ limit: lim, status: st }));
  };

  const reset = () => {
    router.push(buildDisputesListPath({ limit: 100, status: "" }));
  };

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_disputes_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_disputes_subtitle")}</p>
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

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-disputes-filter-form"
          aria-label={t("admin_disputes_filters_aria")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className="text-body font-medium text-ink-800">{t("admin_disputes_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-small text-ink-700">
              {t("admin_disputes_limit_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
                type="number"
                min={1}
                max={500}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_disputes_status_filter_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                placeholder={t("admin_disputes_status_placeholder")}
              />
            </label>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-disputes-filter-form"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-3 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            type="submit"
          >
            {t("admin_disputes_apply")}
          </button>
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <button
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              type="submit"
            >
              {t("admin_disputes_reset")}
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_loading")}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && appliedFilters && (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
          {t("admin_disputes_applied")} {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && (
        <section className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_disputes_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin_disputes_colDisputeId")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_disputes_colOrderId")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_disputes_colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_disputes_colArbitrator")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_disputes_colResolution")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_disputes_colCreated")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_disputes_colOps")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-ink-500" colSpan={7}>
                    {t("admin_empty_table")}
                  </td>
                </tr>
              )}
              {items.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">{d.id}</td>
                  <td className="px-4 py-3">{d.order_id}</td>
                  <td className="px-4 py-3 font-mono text-meta">{d.status}</td>
                  <td className="px-4 py-3">{d.arbitrator_id ?? t("admin_em_dash")}</td>
                  <td className="px-4 py-3">
                    {d.refund_ratio != null || d.slash_guide != null
                      ? `refund=${d.refund_ratio ?? t("admin_em_dash")}, slash=${String(d.slash_guide ?? t("admin_em_dash"))}`
                      : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    {d.created_at ? new Date(d.created_at).toLocaleString() : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/disputes/${encodeURIComponent(d.id)}`}
                      className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                    >
                      {t("admin_disputes_opsOpen")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default function AdminDisputesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_disputes_title">
      <AdminDisputesPageInner />
    </AdminSearchParamsSuspense>
  );
}

