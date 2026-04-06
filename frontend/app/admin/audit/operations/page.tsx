"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { adminAuditListPathForAction } from "@/lib/adminAuditNav";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type Res = {
  status?: string;
  error?: string;
  operations?: unknown[];
  catalog_total?: number;
  returned?: number;
  note?: string;
  meta?: unknown;
  applied_filters?: Record<string, unknown>;
};

function isAuditOpRow(v: unknown): v is { code: string; mutating: boolean } {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.code === "string" && typeof o.mutating === "boolean";
}

function clampOpsLimit(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(200, Math.max(1, Math.floor(n)));
}

function parseOpsListQuery(sp: URLSearchParams): { limit: number } {
  return { limit: clampOpsLimit(Number.parseInt(sp.get("limit") ?? "50", 10)) };
}

function buildOpsListPath(q: { limit: number }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampOpsLimit(q.limit)));
  return `/admin/audit/operations?${sp.toString()}`;
}

/** 120 / 70：运维审计动作检索最小只读（须 admin）。 */
function AdminAuditOperationsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit } = useMemo(
    () => parseOpsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<Res | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));

  useEffect(() => {
    setDraftLimit(String(limit));
  }, [limit]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-audit-ops-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>("AdminAuditOperationsPage", apiUrl(routes.admin.auditOperations({ limit })), { headers })
      .then(({ res, body: json }) => {
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminAuditOperationsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampOpsLimit(Number.parseInt(draftLimit.trim(), 10));
    router.push(buildOpsListPath({ limit: lim }));
  };

  const reset = () => {
    router.push(buildOpsListPath({ limit: 50 }));
  };

  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  const operationRows = useMemo(() => {
    const raw = body?.operations;
    if (!Array.isArray(raw)) return [];
    return raw.filter(isAuditOpRow);
  }, [body?.operations]);

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_audit_ops_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_audit_ops_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/audit" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_audit_ops_linkLogs")}
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

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-audit-operations-filter-form"
          aria-label={t("admin_audit_ops_filters_aria")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && body?.applied_filters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className="text-body font-medium text-ink-800">{t("admin_audit_ops_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-small text-ink-700">
              {t("admin_audit_ops_limit_label")}
              <input
                className={`mt-1 block min-h-[44px] w-24 rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                type="number"
                min={1}
                max={200}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-audit-operations-filter-form"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-3 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            type="submit"
          >
            {t("admin_audit_ops_apply")}
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
              {t("admin_audit_ops_reset")}
            </button>
          </form>
        </div>
      </div>

      <section className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-4" aria-label={t("admin_audit_ops_panel_aria")}>
        {loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_audit_ops_loading")}
          </p>
        ) : error ? (
          <p className="text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : (
          <>
            {body?.applied_filters && (
              <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="panel">
                {t("admin_audit_ops_applied")} {JSON.stringify(body.applied_filters)}
              </AdminAppliedFiltersBanner>
            )}
            {body?.note ? (
              <AdminMetaNoteLink className="mt-2">{body.note}</AdminMetaNoteLink>
            ) : null}
            {typeof body?.catalog_total === "number" && typeof body?.returned === "number" ? (
              <p className="text-small text-ink-600">
                {t("admin_audit_ops_catalog_counts")
                  .replace("{total}", String(body.catalog_total))
                  .replace("{returned}", String(body.returned))}
              </p>
            ) : null}
            <div>
              <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_audit_ops_operations")}
              </h2>
              {operationRows.length === 0 ? (
                <p className="mt-2 text-body text-ink-600" role="status">
                  {t("admin_audit_ops_empty")}
                </p>
              ) : (
                <div className="mt-2 max-h-[28rem] overflow-auto rounded-[var(--radius-md)] border border-ink-700/50 bg-ink-900/90">
                  <table className="w-full min-w-[min(100%,36rem)] border-collapse text-left text-meta text-ink-100">
                    <thead className="sticky top-0 z-[1] bg-ink-900/95 backdrop-blur-sm">
                      <tr className="border-b border-ink-700/60">
                        <th scope="col" className="px-3 py-2 font-semibold text-ink-300">
                          {t("admin_audit_ops_col_code")}
                        </th>
                        <th scope="col" className="px-3 py-2 font-semibold text-ink-300 w-[6.5rem]">
                          {t("admin_audit_ops_col_kind")}
                        </th>
                        <th scope="col" className="px-3 py-2 font-semibold text-ink-300 w-[7.5rem] text-right">
                          {t("admin_audit_ops_col_nav")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {operationRows.map((row) => {
                        const href = adminAuditListPathForAction(row.code, limit);
                        return (
                          <tr key={row.code} className="border-b border-ink-800/80 last:border-b-0">
                            <td className="px-3 py-2 font-mono text-[0.8125rem] break-all text-ink-100">
                              {row.code}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  row.mutating
                                    ? "inline-flex rounded-[var(--radius-sm)] bg-warning/20 px-2 py-0.5 text-warning"
                                    : "inline-flex rounded-[var(--radius-sm)] bg-ink-700/60 px-2 py-0.5 text-ink-300"
                                }
                              >
                                {row.mutating ? t("admin_audit_ops_kind_write") : t("admin_audit_ops_kind_read")}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right align-middle">
                              <Link
                                href={href}
                                className={`${touchTargetLink44Classes} inline-flex text-travel-300 hover:underline ${travelFocusRingOffset2Classes}`}
                                aria-label={t("admin_audit_ops_link_logs_aria").replace("{code}", row.code)}
                              >
                                {t("admin_audit_ops_link_logs")}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default function AdminAuditOperationsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_audit_ops_title">
      <AdminAuditOperationsPageInner />
    </AdminSearchParamsSuspense>
  );
}

