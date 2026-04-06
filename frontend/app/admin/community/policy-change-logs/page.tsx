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
  actor_id?: string | null;
  scope?: string;
  summary?: string | null;
  before_snapshot?: unknown;
  after_snapshot?: unknown;
  source?: string | null;
  created_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const SCOPE_MAX = 128;
const SUMMARY_MAX = 256;
const SOURCE_MAX = 128;

function snapPreview(v: unknown, dash: string): string {
  if (v == null) return dash;
  try {
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return s.length > 64 ? `${s.slice(0, 64)}…` : s;
  } catch {
    return dash;
  }
}

function parsePolicyLogsQuery(sp: URLSearchParams): {
  limit: number;
  scope: string;
  summary: string;
  source: string;
  actorId: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const scope = (sp.get("scope") ?? "").trim().slice(0, SCOPE_MAX);
  const summary = (sp.get("summary") ?? "").trim().slice(0, SUMMARY_MAX);
  const source = (sp.get("source") ?? "").trim().slice(0, SOURCE_MAX);
  const rawA = (sp.get("actor_id") ?? "").trim();
  const actorId = isUuidString(rawA) ? rawA : "";
  return { limit, scope, summary, source, actorId };
}

function buildPolicyLogsPath(q: {
  limit: number;
  scope: string;
  summary: string;
  source: string;
  actorId: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const sc = q.scope.trim().slice(0, SCOPE_MAX);
  if (sc) sp.set("scope", sc);
  const su = q.summary.trim().slice(0, SUMMARY_MAX);
  if (su) sp.set("summary", su);
  const so = q.source.trim().slice(0, SOURCE_MAX);
  if (so) sp.set("source", so);
  if (q.actorId && isUuidString(q.actorId)) sp.set("actor_id", q.actorId.trim());
  return `/admin/community/policy-change-logs?${sp.toString()}`;
}

/** 160 §5：社区策略变更审计只读（须 admin + DB）。 */
function AdminCommunityPolicyChangeLogsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parsePolicyLogsQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftScope, setDraftScope] = useState(listQ.scope);
  const [draftSummary, setDraftSummary] = useState(listQ.summary);
  const [draftSource, setDraftSource] = useState(listQ.source);
  const [draftActorId, setDraftActorId] = useState(listQ.actorId);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftScope(listQ.scope);
    setDraftSummary(listQ.summary);
    setDraftSource(listQ.source);
    setDraftActorId(listQ.actorId);
  }, [listQ]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-policy-logs-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminCommunityPolicyChangeLogsPage",
      apiUrl(
        routes.admin.communityPolicyChangeLogs({
          limit: listQ.limit,
          ...(listQ.scope ? { scope: listQ.scope } : {}),
          ...(listQ.summary ? { summary: listQ.summary } : {}),
          ...(listQ.source ? { source: listQ.source } : {}),
          ...(listQ.actorId ? { actor_id: listQ.actorId } : {}),
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
        logAdminFetch("AdminCommunityPolicyChangeLogsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const aTrim = draftActorId.trim();
    const nextActor = isUuidString(aTrim) ? aTrim : "";
    router.push(
      buildPolicyLogsPath({
        limit: nextLimit,
        scope: draftScope.trim().slice(0, SCOPE_MAX),
        summary: draftSummary.trim().slice(0, SUMMARY_MAX),
        source: draftSource.trim().slice(0, SOURCE_MAX),
        actorId: nextActor,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : listQ.limit;
    router.push(
      buildPolicyLogsPath({
        limit: nextLimit,
        scope: "",
        summary: "",
        source: "",
        actorId: "",
      }),
    );
  };

  const hasTextFilters =
    Boolean(listQ.scope) || Boolean(listQ.summary) || Boolean(listQ.source) || Boolean(listQ.actorId);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_policy_logs_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_policy_logs_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
          <Link href="/admin/community/abuse-policy" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_policy_logs_linkAbuse")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_policy_logs_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-policy-change-logs-filter-form"
          className="space-y-3"
          aria-label={t("admin_policy_logs_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-small text-ink-700">
            {t("admin_policy_logs_limit")}
            <input
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`ml-2 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
            />
          </label>
          <label className="text-small text-ink-700 block min-w-[8rem] flex-1">
            {t("admin_policy_logs_scope")}
            <input
              type="text"
              value={draftScope}
              onChange={(e) => setDraftScope(e.target.value.slice(0, SCOPE_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_policy_logs_scope_ph")}
              autoComplete="off"
            />
          </label>
          <label className="text-small text-ink-700 block min-w-[10rem] flex-1">
            {t("admin_policy_logs_summary")}
            <input
              type="text"
              value={draftSummary}
              onChange={(e) => setDraftSummary(e.target.value.slice(0, SUMMARY_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_policy_logs_summary_ph")}
              autoComplete="off"
            />
          </label>
          <label className="text-small text-ink-700 block min-w-[8rem] flex-1">
            {t("admin_policy_logs_source")}
            <input
              type="text"
              value={draftSource}
              onChange={(e) => setDraftSource(e.target.value.slice(0, SOURCE_MAX))}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_policy_logs_source_ph")}
              autoComplete="off"
            />
          </label>
          <label className="text-small text-ink-700 block min-w-[12rem] flex-1">
            {t("admin_policy_logs_actor_id")}
            <input
              type="text"
              value={draftActorId}
              onChange={(e) => setDraftActorId(e.target.value)}
              className={`mt-1 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              placeholder={t("admin_policy_logs_actor_id_ph")}
              autoComplete="off"
            />
          </label>
        </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-policy-change-logs-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_policy_logs_apply")}
          </button>
          {hasTextFilters ? (
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
                {t("admin_policy_logs_clear_filters")}
              </button>
            </form>
          ) : null}
        </div>
        {appliedFilters ? (
          <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
            {t("admin_policy_logs_applied")}: {JSON.stringify(appliedFilters)}
          </AdminAppliedFiltersBanner>
        ) : null}
      </div>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_policy_logs_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_policy_logs_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_policy_logs_colTime")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policy_logs_colScope")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policy_logs_colSummary")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policy_logs_colBefore")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policy_logs_colAfter")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policy_logs_colSource")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policy_logs_colActor")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={7}>
                    {t("admin_policy_logs_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                const b = snapPreview(r.before_snapshot, dash);
                const a = snapPreview(r.after_snapshot, dash);
                return (
                  <tr key={r.id ?? `pcl-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.created_at ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.scope ?? dash}</td>
                    <td className="px-3 py-2 max-w-xs truncate" title={r.summary ?? ""}>
                      {r.summary ?? dash}
                    </td>
                    <td className="px-3 py-2 max-w-[10rem] font-mono text-meta">
                      <span className="block truncate" title={b}>
                        {b}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[10rem] font-mono text-meta">
                      <span className="block truncate" title={a}>
                        {a}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.source ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.actor_id ?? ""}>
                      {r.actor_id ?? dash}
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

export default function AdminCommunityPolicyChangeLogsPage() {
  return (
    <AdminSearchParamsSuspense
      ariaLabelKey="admin_policy_logs_title"
      backLinkLabelKey="admin_policy_logs_back"
    >
      <AdminCommunityPolicyChangeLogsPageInner />
    </AdminSearchParamsSuspense>
  );
}
