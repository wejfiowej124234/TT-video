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
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type AdminGuideRow = {
  id: string;
  user_id: string;
  city?: string;
  country_code?: string;
  status?: string;
  stake_amount?: string;
  wallet_address?: string | null;
  id_photo_url?: string | null;
  language_cert_url?: string | null;
  guide_license_url?: string | null;
  updated_at?: string;
};

type AdminGuidesRes = {
  status?: string;
  items?: AdminGuideRow[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

const STATUS_MAX = 128;

function clampGuideLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

function parseGuidesListQuery(sp: URLSearchParams): { limit: number; status: string } {
  const limit = clampGuideLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const status = (sp.get("status") ?? "").trim().slice(0, STATUS_MAX);
  return { limit, status };
}

function buildGuidesListPath(q: { limit: number; status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampGuideLimit(q.limit)));
  const st = q.status.trim().slice(0, STATUS_MAX);
  if (st) sp.set("status", st);
  return `/admin/guides?${sp.toString()}`;
}

/** 70：向导入驻台账（GET /api/v1/admin/guides） */
function AdminGuidesPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, status } = useMemo(
    () => parseGuidesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminGuideRow[]>([]);
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

    const headers: Record<string, string> = { "x-request-id": `admin-guides-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminGuidesRes>(
      "AdminGuidesPage",
      apiUrl(
        routes.admin.guides({
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
        logAdminFetch("AdminGuidesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampGuideLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftStatus.trim().slice(0, STATUS_MAX);
    router.push(buildGuidesListPath({ limit: lim, status: st }));
  };

  const reset = () => {
    router.push(buildGuidesListPath({ limit: 100, status: "" }));
  };

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_guides_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_guides_subtitle")}</p>
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
          id="admin-guides-filter-form"
          aria-label={t("admin_guides_filters_aria")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className="text-body font-medium text-ink-800">{t("admin_guides_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-small text-ink-700">
              {t("admin_guides_limit_label")}
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
              {t("admin_guides_status_filter_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                placeholder={t("admin_guides_status_placeholder")}
              />
            </label>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-guides-filter-form"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-3 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            type="submit"
          >
            {t("admin_guides_apply")}
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
              {t("admin_guides_reset")}
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
          {t("admin_guides_applied")} {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && (
        <section className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_guides_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colGuideId")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colUserId")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colCity")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colCountry")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colStake")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colWallet")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colDocs")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colUpdated")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_colOps")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_guides_linkPublic")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-800">
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-ink-500" colSpan={11}>
                    {t("admin_guides_empty")}
                  </td>
                </tr>
              )}
              {items.map((row) => {
                const w = row.wallet_address?.trim();
                const hasDocs =
                  !!(row.id_photo_url?.trim() || row.language_cert_url?.trim() || row.guide_license_url?.trim());
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-2 font-mono text-meta">{row.id}</td>
                    <td className="px-4 py-2 font-mono text-meta">{row.user_id}</td>
                    <td className="px-4 py-2">{row.city ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2">{row.country_code ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2">{row.status ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2 tabular-nums">{row.stake_amount ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2 font-mono text-meta">
                      {w ? shortEvmAddress(w) : t("admin_em_dash")}
                    </td>
                    <td className="px-4 py-2 text-meta">{hasDocs ? t("admin_guides_docsPresent") : t("admin_guides_docsMissing")}</td>
                    <td className="px-4 py-2 text-meta whitespace-nowrap">{row.updated_at ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/guides/${encodeURIComponent(row.id)}`}
                        className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                      >
                        {t("admin_ops_guideDetailAdmin")}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/guides/${encodeURIComponent(row.id)}`} className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                        {t("admin_guides_linkPublic")}
                      </Link>
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

export default function AdminGuidesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_guides_title">
      <AdminGuidesPageInner />
    </AdminSearchParamsSuspense>
  );
}

