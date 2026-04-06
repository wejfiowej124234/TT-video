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
import { buildAdminAuditLogsPath, clampAdminAuditLimit } from "@/lib/adminAuditLogsPath";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type AdminAuditLog = {
  id?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  actor_id?: string;
  request_id?: string;
  payload?: unknown;
  created_at?: string;
};

type AdminAuditLogsRes = {
  status?: string;
  items?: AdminAuditLog[];
  note?: string;
  meta?: unknown;
  applied_filters?: Record<string, unknown>;
  error?: string;
};

function parseAuditListQuery(sp: URLSearchParams): {
  limit: number;
  actor_id: string;
  action: string;
  resource_type: string;
} {
  const limit = clampAdminAuditLimit(Number.parseInt(sp.get("limit") ?? "50", 10));
  return {
    limit,
    actor_id: (sp.get("actor_id") ?? "").trim(),
    action: (sp.get("action") ?? "").trim(),
    resource_type: (sp.get("resource_type") ?? "").trim(),
  };
}

function AdminAuditPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseAuditListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminAuditLog[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftActorId, setDraftActorId] = useState(listQ.actor_id);
  const [draftAction, setDraftAction] = useState(listQ.action);
  const [draftResourceType, setDraftResourceType] = useState(listQ.resource_type);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftActorId(listQ.actor_id);
    setDraftAction(listQ.action);
    setDraftResourceType(listQ.resource_type);
  }, [listQ.limit, listQ.actor_id, listQ.action, listQ.resource_type]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNote(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-audit-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminAuditLogsRes>(
      "AdminAuditPage",
      apiUrl(
        routes.admin.auditLogs({
          limit: listQ.limit,
          ...(listQ.actor_id ? { actor_id: listQ.actor_id } : {}),
          ...(listQ.action ? { action: listQ.action } : {}),
          ...(listQ.resource_type ? { resource_type: listQ.resource_type } : {}),
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
        setNote(typeof body.note === "string" ? body.note : null);
        setAppliedFilters(body.applied_filters ?? null);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminAuditPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ.limit, listQ.actor_id, listQ.action, listQ.resource_type]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampAdminAuditLimit(Number.parseInt(draftLimit.trim(), 10));
    router.push(
      buildAdminAuditLogsPath({
        limit: lim,
        actor_id: draftActorId,
        action: draftAction,
        resource_type: draftResourceType,
      }),
    );
  };

  const reset = () => {
    router.push(buildAdminAuditLogsPath({ limit: 50, actor_id: "", action: "", resource_type: "" }));
  };

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_audit_list_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_audit_list_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/audit/operations"
            className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_audit_link_operations")}
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

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-audit-filter-form"
          aria-label={t("admin_audit_list_filters")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className="text-body font-medium text-ink-800">{t("admin_audit_list_filters")}</h2>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-small text-ink-700">
              {t("admin_audit_list_actorId")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftActorId}
                onChange={(e) => setDraftActorId(e.target.value)}
                placeholder={t("admin_audit_list_phActor")}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_audit_list_action")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftAction}
                onChange={(e) => setDraftAction(e.target.value)}
                placeholder={t("admin_audit_list_phAction")}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_audit_list_resourceType")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftResourceType}
                onChange={(e) => setDraftResourceType(e.target.value)}
                placeholder={t("admin_audit_list_phResourceType")}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_audit_list_limit")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
                type="number"
                min={1}
                max={200}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                placeholder={t("admin_audit_list_phLimit")}
              />
            </label>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-audit-filter-form"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-3 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            type="submit"
          >
            {t("admin_audit_list_apply")}
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
              {t("admin_audit_list_reset")}
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

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && note ? <AdminMetaNoteLink className="mt-3">{note}</AdminMetaNoteLink> : null}

      {!loading && !error && appliedFilters && (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
          {t("admin_audit_list_appliedPrefix")} {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_audit_list_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin_audit_list_colAction")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_audit_list_colResource")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_audit_list_colActor")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_audit_list_colRequestId")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_audit_list_colPayload")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_audit_list_colCreated")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_audit_list_colOps")}</th>
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
              {items.map((row, idx) => (
                <tr key={row.id ?? `${row.request_id ?? "req"}-${idx}`}>
                  <td className="px-4 py-3 font-mono text-meta">
                    {row.action ? (
                      <Link
                        href={buildAdminAuditLogsPath({
                          limit: listQ.limit,
                          actor_id: listQ.actor_id,
                          action: row.action,
                          resource_type: listQ.resource_type,
                        })}
                        className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                        aria-label={t("admin_audit_filterByAction_aria").replace("{action}", row.action)}
                      >
                        {row.action}
                      </Link>
                    ) : (
                      t("admin_em_dash")
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.resource_type?.trim() ? (
                      <Link
                        href={buildAdminAuditLogsPath({
                          limit: listQ.limit,
                          actor_id: listQ.actor_id,
                          action: listQ.action,
                          resource_type: row.resource_type.trim(),
                        })}
                        className={`${touchTargetLink44Classes} font-mono text-meta text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                        aria-label={t("admin_audit_filterByResourceType_aria").replace(
                          "{resource_type}",
                          row.resource_type.trim(),
                        )}
                      >
                        {row.resource_type}:{row.resource_id ?? t("admin_em_dash")}
                      </Link>
                    ) : (
                      <>
                        {row.resource_type ?? t("admin_em_dash")}:{row.resource_id ?? t("admin_em_dash")}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.actor_id?.trim() ? (
                      <Link
                        href={buildAdminAuditLogsPath({
                          limit: listQ.limit,
                          actor_id: row.actor_id.trim(),
                          action: listQ.action,
                          resource_type: listQ.resource_type,
                        })}
                        className={`${touchTargetLink44Classes} font-mono text-meta text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                        aria-label={t("admin_audit_filterByActor_aria").replace(
                          "{actor_id}",
                          row.actor_id.trim(),
                        )}
                      >
                        {row.actor_id}
                      </Link>
                    ) : (
                      t("admin_em_dash")
                    )}
                  </td>
                  <td className="px-4 py-3">{row.request_id ?? t("admin_em_dash")}</td>
                  <td className="max-w-sm truncate px-4 py-3" title={JSON.stringify(row.payload ?? {})}>
                    {JSON.stringify(row.payload ?? {})}
                  </td>
                  <td className="px-4 py-3">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    {row.id ? (
                      <Link
                        href={`/admin/audit/logs/${encodeURIComponent(row.id)}`}
                        className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                      >
                        {t("admin_ops_auditLogDetailAdmin")}
                      </Link>
                    ) : (
                      t("admin_em_dash")
                    )}
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

export default function AdminAuditPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_audit_list_title">
      <AdminAuditPageInner />
    </AdminSearchParamsSuspense>
  );
}

