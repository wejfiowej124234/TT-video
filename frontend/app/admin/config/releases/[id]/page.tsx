"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

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
import { releasesListHrefFromRelistParam } from "@/lib/adminConfigReleasesNav";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type Release = {
  id?: string;
  release_key?: string;
  version_label?: string;
  status?: string;
  effective_from?: string | null;
  rolled_back_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  release?: Release;
  meta?: Record<string, unknown>;
};

/** 220 / 70：配置发布单条只读（须 admin + DB）。 */
function AdminConfigReleaseDetailPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const params = useParams();
  const searchParams = useSearchParams();
  const releasesListHref = useMemo(
    () => releasesListHrefFromRelistParam(searchParams.get("relist")),
    [searchParams],
  );
  const releaseId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [data, setData] = useState<Res | null>(null);

  useEffect(() => {
    if (!releaseId) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {
      "x-request-id": `admin-config-release-${releaseId}-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 below
    }

    adminFetchJson<Res>(
      "AdminConfigReleaseDetailPage",
      apiUrl(routes.admin.configRelease(releaseId)),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setData)
      .catch((e: unknown) => {
        logAdminFetch("AdminConfigReleaseDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [releaseId]);

  const r = data?.release;
  const meta = data && isAdminMetaRecord(data.meta) ? data.meta : null;

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_config_release_detail_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_config_release_detail_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href={releasesListHref} className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_config_release_detail_back_list")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_config_releases_back")}
          </Link>
        </div>
      </header>

      {!releaseId && (
        <p className="mt-6 text-body text-ink-600" role="status">
          {t("admin_config_release_detail_missing_id")}
        </p>
      )}

      {releaseId && loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_config_release_detail_loading")}
        </p>
      )}

      {releaseId && error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      <AdminMetaBuildSection meta={meta} loading={Boolean(releaseId) && loading} error={releaseId ? error : null} />

      {releaseId && !loading && !error && r && (
        <section
          className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft"
          aria-label={t("admin_config_release_detail_section_aria")}
        >
          <p className="text-meta text-ink-500">
            {t("admin_config_release_detail_id_label")}:{" "}
            <span className="font-mono text-ink-800">{r.id ?? releaseId}</span>
          </p>
          <dl className="mt-4 grid gap-3 text-body text-ink-800 sm:grid-cols-2">
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colKey")}</dt>
              <dd className="font-mono text-small">{r.release_key ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colLabel")}</dt>
              <dd className="font-mono text-small">{r.version_label ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colStatus")}</dt>
              <dd className="font-mono text-small">{r.status ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colEffective")}</dt>
              <dd className="font-mono text-small">{r.effective_from ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_releases_colRollback")}</dt>
              <dd className="font-mono text-small">{r.rolled_back_at ?? t("admin_em_dash")}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">{t("admin_config_release_detail_created")}</dt>
              <dd className="font-mono text-small">{r.created_at ?? t("admin_em_dash")}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("admin_config_release_detail_updated")}</dt>
              <dd className="font-mono text-small">{r.updated_at ?? t("admin_em_dash")}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-ink-500">{t("admin_config_release_detail_notes")}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-small text-ink-700">
                {r.notes?.trim() ? r.notes : t("admin_em_dash")}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </main>
  );
}

export default function AdminConfigReleaseDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_config_release_detail_title">
      <AdminConfigReleaseDetailPageInner />
    </AdminSearchParamsSuspense>
  );
}

