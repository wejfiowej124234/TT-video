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
  token_id?: string | null;
  object_id?: string;
  actor_or_ip?: string;
  action?: string;
  occurred_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const OBJECT_MAX = 256;
const ACTOR_MAX = 256;
const ACTION_MAX = 64;

function isValidMediaActionSegment(s: string): boolean {
  if (!s) return true;
  return s.length <= ACTION_MAX && /^[A-Za-z0-9_]+$/.test(s);
}

function parseMediaAccessLogsQuery(sp: URLSearchParams): {
  limit: number;
  action: string;
  objectId: string;
  actorOrIp: string;
  tokenId: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawAction = (sp.get("action") ?? "").trim().slice(0, ACTION_MAX);
  const action = isValidMediaActionSegment(rawAction) ? rawAction : "";
  const objectId = (sp.get("object_id") ?? "").trim().slice(0, OBJECT_MAX);
  const actorOrIp = (sp.get("actor_or_ip") ?? "").trim().slice(0, ACTOR_MAX);
  const rawTok = (sp.get("token_id") ?? "").trim();
  const tokenId = isUuidString(rawTok) ? rawTok : "";
  return { limit, action, objectId, actorOrIp, tokenId };
}

function buildMediaAccessLogsListPath(q: {
  limit: number;
  action: string;
  objectId: string;
  actorOrIp: string;
  tokenId: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const ac = q.action.trim().slice(0, ACTION_MAX);
  if (ac && isValidMediaActionSegment(ac)) sp.set("action", ac);
  const oid = q.objectId.trim().slice(0, OBJECT_MAX);
  if (oid) sp.set("object_id", oid);
  const act = q.actorOrIp.trim().slice(0, ACTOR_MAX);
  if (act) sp.set("actor_or_ip", act);
  if (q.tokenId && isUuidString(q.tokenId)) sp.set("token_id", q.tokenId.trim());
  return `/admin/media/access-logs?${sp.toString()}`;
}

/** 270 / 70：`media_access_logs` 只读（须 admin + DB）。 */
function AdminMediaAccessLogsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const actionInputId = useId();
  const objectInputId = useId();
  const actorInputId = useId();
  const tokenInputId = useId();
  const adminFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, action, objectId, actorOrIp, tokenId } = useMemo(
    () => parseMediaAccessLogsQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftAction, setDraftAction] = useState(action);
  const [draftObjectId, setDraftObjectId] = useState(objectId);
  const [draftActor, setDraftActor] = useState(actorOrIp);
  const [draftToken, setDraftToken] = useState(tokenId);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftAction(action);
    setDraftObjectId(objectId);
    setDraftActor(actorOrIp);
    setDraftToken(tokenId);
  }, [limit, action, objectId, actorOrIp, tokenId]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-media-logs-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminMediaAccessLogsPage",
      apiUrl(
        routes.admin.mediaAccessLogs({
          limit: effLimit,
          ...(action ? { action } : {}),
          ...(objectId ? { object_id: objectId } : {}),
          ...(actorOrIp ? { actor_or_ip: actorOrIp } : {}),
          ...(tokenId ? { token_id: tokenId } : {}),
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
        logAdminFetch("AdminMediaAccessLogsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, action, objectId, actorOrIp, tokenId]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const ac = draftAction.trim().slice(0, ACTION_MAX);
    const nextAction = isValidMediaActionSegment(ac) ? ac : "";
    const tokTrim = draftToken.trim();
    const nextTok = isUuidString(tokTrim) ? tokTrim : "";
    router.push(
      buildMediaAccessLogsListPath({
        limit: nextLimit,
        action: nextAction,
        objectId: draftObjectId.trim().slice(0, OBJECT_MAX),
        actorOrIp: draftActor.trim().slice(0, ACTOR_MAX),
        tokenId: nextTok,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildMediaAccessLogsListPath({
        limit: nextLimit,
        action: "",
        objectId: "",
        actorOrIp: "",
        tokenId: "",
      }),
    );
  };

  const hasActiveFilters =
    Boolean(action) || Boolean(objectId) || Boolean(actorOrIp) || Boolean(tokenId);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_media_access_logs_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_media_access_logs_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin/media/signed-url-tokens" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_media_access_logs_link_tokens")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_media_access_logs_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-media-access-logs-filter-form"
          className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
          aria-label={t("admin_media_access_logs_filters")}
          aria-describedby={
            [adminListApplyResetHintId, adminFilterHintId, appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="w-full text-meta text-ink-600 leading-relaxed lg:basis-full">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
        <div className="min-w-[8rem]">
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_limit")}
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
        <div className="min-w-[8rem] flex-1">
          <label htmlFor={actionInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_filter_action")}
          </label>
          <input
            id={actionInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={ACTION_MAX}
            value={draftAction}
            onChange={(e) => setDraftAction(e.target.value.slice(0, ACTION_MAX))}
            placeholder={t("admin_media_access_logs_filter_action_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={objectInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_filter_object_id")}
          </label>
          <input
            id={objectInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={OBJECT_MAX}
            value={draftObjectId}
            onChange={(e) => setDraftObjectId(e.target.value.slice(0, OBJECT_MAX))}
            placeholder={t("admin_media_access_logs_filter_object_id_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[9rem] flex-1">
          <label htmlFor={actorInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_filter_actor")}
          </label>
          <input
            id={actorInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={ACTOR_MAX}
            value={draftActor}
            onChange={(e) => setDraftActor(e.target.value.slice(0, ACTOR_MAX))}
            placeholder={t("admin_media_access_logs_filter_actor_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={tokenInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_access_logs_filter_token_id")}
          </label>
          <input
            id={tokenInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftToken}
            onChange={(e) => setDraftToken(e.target.value)}
            placeholder={t("admin_media_access_logs_filter_token_id_placeholder")}
            autoComplete="off"
          />
        </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-media-access-logs-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_media_access_logs_apply")}
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
                {t("admin_media_access_logs_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_media_access_logs_filter_hint")}
      </p>
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_media_access_logs_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_media_access_logs_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {!loading && !error && (
        <section
          className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_media_access_logs_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_media_access_logs_col_time")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_access_logs_col_action")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_access_logs_col_object")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_access_logs_col_actor")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_access_logs_col_token")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_access_logs_col_id")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={6}>
                    {t("admin_media_access_logs_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => (
                <tr key={`${r.id ?? "row"}-${idx}`}>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                    {r.occurred_at ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta">{r.action ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta max-w-[14rem] truncate" title={r.object_id}>
                    {r.object_id ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta max-w-[10rem] truncate" title={r.actor_or_ip}>
                    {r.actor_or_ip ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap max-w-[10rem] truncate" title={r.token_id ?? undefined}>
                    {r.token_id ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap max-w-[8rem] truncate" title={r.id}>
                    {r.id ?? t("admin_em_dash")}
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

export default function AdminMediaAccessLogsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_media_access_logs_title">
      <AdminMediaAccessLogsPageInner />
    </AdminSearchParamsSuspense>
  );
}

