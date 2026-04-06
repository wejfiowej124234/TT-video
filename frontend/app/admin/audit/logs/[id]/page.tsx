"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useId } from "react";

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
import {
  adminAuditLogDetailFieldListHref,
  type AdminAuditDetailLinkField,
} from "@/lib/adminAuditLogsPath";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type AdminAuditLogDetailRes = {
  status?: string;
  error?: string;
  audit_log?: Record<string, unknown>;
  meta?: unknown;
};

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

/** 单条管理审计日志；须 admin + PostgreSQL（无 DB 时接口 503）。路由置于 `/admin/audit/logs/` 以免与 `operations` 冲突。 */
function AdminAuditLogDetailPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const logId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminAuditLogDetailRes | null>(null);

  useEffect(() => {
    if (!logId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-audit-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminAuditLogDetailRes>(
      "AdminAuditLogDetailPage",
      apiUrl(routes.admin.auditLogById(logId)),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminAuditLogDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [logId]);

  const row = body?.audit_log && typeof body.audit_log === "object" ? body.audit_log : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  const rows: { key: string; labelKey: string }[] = [
    { key: "id", labelKey: "admin_audit_detail_id" },
    { key: "action", labelKey: "admin_audit_list_colAction" },
    { key: "resource_type", labelKey: "admin_audit_list_resourceType" },
    { key: "resource_id", labelKey: "admin_audit_detail_resourceId" },
    { key: "actor_id", labelKey: "admin_audit_list_colActor" },
    { key: "request_id", labelKey: "admin_audit_list_colRequestId" },
    { key: "created_at", labelKey: "admin_audit_list_colCreated" },
    { key: "payload", labelKey: "admin_audit_list_colPayload" },
  ];

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_audit_detail_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600 font-mono text-meta break-all">
            {logId || t("admin_em_dash")}
          </p>
          <p className="mt-1 text-small text-ink-500">{t("admin_audit_detail_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/audit" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_audit_detail_back_list")}
          </Link>
          <Link href="/admin/audit/operations" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_audit_detail_link_ops")}
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

      <section className="mt-6 space-y-4" aria-label={t("admin_audit_detail_panel_aria")}>
        {!logId ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {t("admin_audit_detail_missingId")}
          </p>
        ) : loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_loading")}
          </p>
        ) : error ? (
          <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : !row ? (
          <p className="text-body text-ink-600">{t("admin_em_dash")}</p>
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft">
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_audit_detail_section")}
            </h2>
            <dl className="mt-3 grid gap-2 text-body sm:grid-cols-1">
              {rows.map(({ key, labelKey }) => {
                const raw = row[key];
                const display =
                  key === "created_at" && typeof raw === "string"
                    ? new Date(raw).toLocaleString()
                    : fmt(raw) || t("admin_em_dash");
                const linkField: AdminAuditDetailLinkField | null =
                  key === "action" || key === "actor_id" || key === "resource_type" ? key : null;
                const filterHref = linkField ? adminAuditLogDetailFieldListHref(linkField, raw) : null;
                const linkAria =
                  filterHref && linkField === "action" && typeof raw === "string"
                    ? t("admin_audit_filterByAction_aria").replace("{action}", raw.trim())
                    : filterHref && linkField === "actor_id" && typeof raw === "string"
                      ? t("admin_audit_filterByActor_aria").replace("{actor_id}", raw.trim())
                      : filterHref && linkField === "resource_type" && typeof raw === "string"
                        ? t("admin_audit_filterByResourceType_aria").replace(
                            "{resource_type}",
                            raw.trim(),
                          )
                        : "";
                return (
                  <div key={key} className="border-b border-ink-100 pb-2 last:border-0">
                    <dt className="text-meta text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-all font-mono text-meta text-ink-800">
                      {filterHref && linkAria ? (
                        <Link
                          href={filterHref}
                          className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                          aria-label={linkAria}
                        >
                          {typeof raw === "string" ? raw : display}
                        </Link>
                      ) : (
                        display
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
      </section>
    </main>
  );
}

export default function AdminAuditLogDetailPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_audit_detail_title">
      <AdminAuditLogDetailPageInner />
    </AdminSearchParamsSuspense>
  );
}

