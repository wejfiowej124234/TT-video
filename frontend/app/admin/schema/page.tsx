"use client";

import Link from "next/link";
import { useEffect, useState, useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 max-h-72 overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

type SchemaMigrationsRes = {
  status?: string;
  error?: string;
  applied_filters?: Record<string, unknown>;
  items?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

/** 70 / 04 §3.5：Schema 迁移与台账只读（须 admin + PostgreSQL）。 */
export default function AdminSchemaPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const schemaBucketHeadingId = useId();
  const adminAppliedFiltersDescId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [itemsNotPlainObjectError, setItemsNotPlainObjectError] = useState(false);
  const [items, setItems] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setItemsNotPlainObjectError(false);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-schema-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    const path = routes.admin.schemaMigrations({ limit: 100 });

    adminFetchJson<SchemaMigrationsRes>("AdminSchemaPage", apiUrl(path), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then((json) => {
        const raw = json.items;
        if (raw == null) {
          setItems(null);
          setItemsNotPlainObjectError(false);
        } else if (Array.isArray(raw) || typeof raw !== "object") {
          if (typeof window !== "undefined") {
            console.error("AdminSchemaPage: items is not a plain object", raw);
          }
          setItems(null);
          setItemsNotPlainObjectError(true);
        } else {
          setItems(raw as Record<string, unknown>);
          setItemsNotPlainObjectError(false);
        }
        setMeta(isAdminMetaRecord(json.meta) ? json.meta : null);
        setAppliedFilters(json.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminSchemaPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  /** 仅当 items 已由成功响应确认为普通对象时才派生；null 表示响应未给出 items，不得当作「空桶」处理。 */
  const buckets: [string, unknown][] | null =
    items === null ? null : Object.entries(items).sort(([a], [b]) => a.localeCompare(b));

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_schema_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_schema_subtitle")}</p>
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

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-4">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_schema_migrations_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <section
        className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4"
        aria-label={t("admin_schema_migrations_panel_aria")}
        aria-describedby={
          [!loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ") ||
          undefined
        }
      >
        {loading ? (
          <LoadingText className="text-ink-600" />
        ) : error ? (
          <ApiErrorAlert message={adminErrorUserText(error, t)} />
        ) : itemsNotPlainObjectError ? (
          <p
            className="text-body text-ink-800 rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 p-3"
            role="alert"
          >
            {t("admin_schema_itemsNotPlainObject")}
          </p>
        ) : buckets === null ? (
          <p
            className="text-body text-ink-800 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/80 p-3"
            role="status"
          >
            {t("admin_schema_itemsAbsent")}
          </p>
        ) : buckets.length === 0 ? (
          <p className="text-body text-ink-500" role="status">
            {t("admin_schema_empty")}
          </p>
        ) : (
          <div className="space-y-8">
            {buckets.map(([key, value], i) => {
              const bucketHeadingId = `${schemaBucketHeadingId}-b${i}`;
              return (
                <Link
                  key={key}
                  href="/admin/observability"
                  className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 bg-bg-console/30 p-3 text-left text-ink-800 transition hover:border-travel-400 hover:text-travel-700 ${travelFocusRingOffset2Classes}`}
                  aria-labelledby={bucketHeadingId}
                >
                  <h2 id={bucketHeadingId} className="text-small font-semibold uppercase tracking-wide text-ink-500 font-mono">
                    {key}
                  </h2>
                  <JsonBlock value={value} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
