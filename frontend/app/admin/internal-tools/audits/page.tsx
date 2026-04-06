"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
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
  tool_id?: string;
  tool_name?: string | null;
  action_code?: string;
  actor_id?: string;
  approval_request_id?: string | null;
  resource_ref?: string | null;
  input_digest?: string | null;
  result_digest?: string | null;
  created_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const TOOL_ID_MAX = 128;
const ACTION_MAX = 128;
const ACTOR_MAX = 256;

function trunc(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function parseToolAuditsListQuery(sp: URLSearchParams): {
  limit: number;
  toolId: string;
  actionCode: string;
  actorId: string;
  approvalRequestId: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const toolId = (sp.get("tool_id") ?? "").trim().slice(0, TOOL_ID_MAX);
  const actionCode = (sp.get("action_code") ?? "").trim().slice(0, ACTION_MAX);
  const actorId = (sp.get("actor_id") ?? "").trim().slice(0, ACTOR_MAX);
  const rawAp = (sp.get("approval_request_id") ?? "").trim();
  const approvalRequestId = isUuidString(rawAp) ? rawAp : "";
  return { limit, toolId, actionCode, actorId, approvalRequestId };
}

function buildToolAuditsListPath(q: {
  limit: number;
  toolId: string;
  actionCode: string;
  actorId: string;
  approvalRequestId: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const tid = q.toolId.trim().slice(0, TOOL_ID_MAX);
  if (tid) sp.set("tool_id", tid);
  const ac = q.actionCode.trim().slice(0, ACTION_MAX);
  if (ac) sp.set("action_code", ac);
  const aid = q.actorId.trim().slice(0, ACTOR_MAX);
  if (aid) sp.set("actor_id", aid);
  if (q.approvalRequestId && isUuidString(q.approvalRequestId)) {
    sp.set("approval_request_id", q.approvalRequestId.trim());
  }
  return `/admin/internal-tools/audits?${sp.toString()}`;
}

/** 450 / 170：内部工具执行审计只读（须 admin + DB）。 */
function AdminInternalToolAuditsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const toolIdInputId = useId();
  const actionCodeInputId = useId();
  const actorIdInputId = useId();
  const approvalInputId = useId();
  const adminFilterHintId = useId();
  const toolAuditsActiveToolDescId = useId();
  const toolAuditsActiveActionDescId = useId();
  const toolAuditsActiveActorDescId = useId();
  const toolAuditsActiveApprovalDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, toolId, actionCode, actorId, approvalRequestId } = useMemo(
    () => parseToolAuditsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftToolId, setDraftToolId] = useState(toolId);
  const [draftActionCode, setDraftActionCode] = useState(actionCode);
  const [draftActorId, setDraftActorId] = useState(actorId);
  const [draftApproval, setDraftApproval] = useState(approvalRequestId);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftToolId(toolId);
    setDraftActionCode(actionCode);
    setDraftActorId(actorId);
    setDraftApproval(approvalRequestId);
  }, [limit, toolId, actionCode, actorId, approvalRequestId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-tool-audits-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminInternalToolAuditsPage",
      apiUrl(
        routes.admin.internalToolAudits({
          limit: effLimit,
          ...(toolId ? { tool_id: toolId } : {}),
          ...(actionCode ? { action_code: actionCode } : {}),
          ...(actorId ? { actor_id: actorId } : {}),
          ...(approvalRequestId ? { approval_request_id: approvalRequestId } : {}),
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
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminInternalToolAuditsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, toolId, actionCode, actorId, approvalRequestId]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const apTrim = draftApproval.trim();
    const ap = isUuidString(apTrim) ? apTrim : "";
    router.push(
      buildToolAuditsListPath({
        limit: nextLimit,
        toolId: draftToolId.trim().slice(0, TOOL_ID_MAX),
        actionCode: draftActionCode.trim().slice(0, ACTION_MAX),
        actorId: draftActorId.trim().slice(0, ACTOR_MAX),
        approvalRequestId: ap,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildToolAuditsListPath({
        limit: nextLimit,
        toolId: "",
        actionCode: "",
        actorId: "",
        approvalRequestId: "",
      }),
    );
  };

  const hasActiveFilters =
    Boolean(toolId) || Boolean(actionCode) || Boolean(actorId) || Boolean(approvalRequestId);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_tool_audits_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_tool_audits_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_tool_audits_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-tool-audits-filter-form"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          aria-label={t("admin_tool_audits_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              toolId ? toolAuditsActiveToolDescId : "",
              actionCode ? toolAuditsActiveActionDescId : "",
              actorId ? toolAuditsActiveActorDescId : "",
              approvalRequestId ? toolAuditsActiveApprovalDescId : "",
              appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="w-full text-meta text-ink-600 leading-relaxed sm:basis-full">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
        <div className="min-w-[8rem]">
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_tool_audits_limit")}
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
        <div className="min-w-[9rem] flex-1">
          <label htmlFor={toolIdInputId} className="block text-small font-medium text-ink-600">
            {t("admin_tool_audits_filter_tool_id")}
          </label>
          <input
            id={toolIdInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={TOOL_ID_MAX}
            value={draftToolId}
            onChange={(e) => setDraftToolId(e.target.value.slice(0, TOOL_ID_MAX))}
            placeholder={t("admin_tool_audits_filter_tool_id_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[8rem] flex-1">
          <label htmlFor={actionCodeInputId} className="block text-small font-medium text-ink-600">
            {t("admin_tool_audits_filter_action_code")}
          </label>
          <input
            id={actionCodeInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={ACTION_MAX}
            value={draftActionCode}
            onChange={(e) => setDraftActionCode(e.target.value.slice(0, ACTION_MAX))}
            placeholder={t("admin_tool_audits_filter_action_code_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[8rem] flex-1">
          <label htmlFor={actorIdInputId} className="block text-small font-medium text-ink-600">
            {t("admin_tool_audits_filter_actor_id")}
          </label>
          <input
            id={actorIdInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={ACTOR_MAX}
            value={draftActorId}
            onChange={(e) => setDraftActorId(e.target.value.slice(0, ACTOR_MAX))}
            placeholder={t("admin_tool_audits_filter_actor_id_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={approvalInputId} className="block text-small font-medium text-ink-600">
            {t("admin_tool_audits_filter_approval_id")}
          </label>
          <input
            id={approvalInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftApproval}
            onChange={(e) => setDraftApproval(e.target.value)}
            placeholder={t("admin_tool_audits_filter_approval_id_placeholder")}
            autoComplete="off"
          />
        </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-tool-audits-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_tool_audits_apply")}
          </button>
          {hasActiveFilters ? (
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
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_tool_audits_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_tool_audits_filter_hint")}
      </p>
      {toolId ? (
        <p id={toolAuditsActiveToolDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tool_audits_active_tool_id").replace("{id}", toolId)}
        </p>
      ) : null}
      {actionCode ? (
        <p id={toolAuditsActiveActionDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tool_audits_active_action").replace("{action}", actionCode)}
        </p>
      ) : null}
      {actorId ? (
        <p id={toolAuditsActiveActorDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tool_audits_active_actor").replace("{actor}", actorId)}
        </p>
      ) : null}
      {approvalRequestId ? (
        <p id={toolAuditsActiveApprovalDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tool_audits_active_approval").replace("{id}", approvalRequestId)}
        </p>
      ) : null}
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_tool_audits_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_tool_audits_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_tool_audits_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_tool_audits_colTime")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tool_audits_colTool")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tool_audits_colAction")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tool_audits_colActor")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tool_audits_colResource")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tool_audits_colApproval")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tool_audits_colDigest")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={7}>
                    {t("admin_tool_audits_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `ita-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[10rem]">
                      <span className="block truncate" title={`${r.tool_id ?? ""} ${r.tool_name ?? ""}`}>
                        {r.tool_id ?? dash}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.action_code ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.actor_id}>
                      {r.actor_id ?? dash}
                    </td>
                    <td className="px-3 py-2 max-w-xs font-mono text-meta">
                      <span className="block truncate" title={r.resource_ref ?? ""}>
                        {trunc(r.resource_ref, 64, dash)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.approval_request_id ?? ""}>
                      {r.approval_request_id ?? dash}
                    </td>
                    <td className="px-3 py-2 max-w-[10rem] font-mono text-meta">
                      <span
                        className="block truncate"
                        title={`in: ${r.input_digest ?? ""} out: ${r.result_digest ?? ""}`}
                      >
                        {trunc(r.input_digest, 24, dash)} / {trunc(r.result_digest, 24, dash)}
                      </span>
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

export default function AdminInternalToolAuditsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_tool_audits_title">
      <AdminInternalToolAuditsPageInner />
    </AdminSearchParamsSuspense>
  );
}

