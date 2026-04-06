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
  object_id?: string;
  url_scope?: string;
  expires_at?: string;
  issued_to?: string;
  created_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const OBJECT_MAX = 256;
const SCOPE_URL = new Set(["read", "download"]);

function parseSignedUrlTokensQuery(sp: URLSearchParams): {
  limit: number;
  objectId: string;
  urlScope: string;
  issuedTo: string;
  tokenId: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const objectId = (sp.get("object_id") ?? "").trim().slice(0, OBJECT_MAX);
  const rawScope = (sp.get("url_scope") ?? "").trim().toLowerCase();
  const urlScope = SCOPE_URL.has(rawScope) ? rawScope : "";
  const rawIssued = (sp.get("issued_to") ?? "").trim();
  const issuedTo = isUuidString(rawIssued) ? rawIssued : "";
  const rawTok = (sp.get("token_id") ?? "").trim();
  const tokenId = isUuidString(rawTok) ? rawTok : "";
  return { limit, objectId, urlScope, issuedTo, tokenId };
}

function buildSignedUrlTokensListPath(q: {
  limit: number;
  objectId: string;
  urlScope: string;
  issuedTo: string;
  tokenId: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const oid = q.objectId.trim().slice(0, OBJECT_MAX);
  if (oid) sp.set("object_id", oid);
  if (SCOPE_URL.has(q.urlScope)) sp.set("url_scope", q.urlScope);
  if (q.issuedTo && isUuidString(q.issuedTo)) sp.set("issued_to", q.issuedTo.trim());
  if (q.tokenId && isUuidString(q.tokenId)) sp.set("token_id", q.tokenId.trim());
  return `/admin/media/signed-url-tokens?${sp.toString()}`;
}

/** 270 / 70：`signed_url_tokens` 签发台账只读（须 admin + DB）。 */
function AdminMediaSignedUrlTokensPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const objectInputId = useId();
  const scopeInputId = useId();
  const issuedInputId = useId();
  const tokenInputId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, objectId, urlScope, issuedTo, tokenId } = useMemo(
    () => parseSignedUrlTokensQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftObjectId, setDraftObjectId] = useState(objectId);
  const [draftUrlScope, setDraftUrlScope] = useState(urlScope);
  const [draftIssuedTo, setDraftIssuedTo] = useState(issuedTo);
  const [draftTokenId, setDraftTokenId] = useState(tokenId);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftObjectId(objectId);
    setDraftUrlScope(urlScope);
    setDraftIssuedTo(issuedTo);
    setDraftTokenId(tokenId);
  }, [limit, objectId, urlScope, issuedTo, tokenId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-su-tok-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminMediaSignedUrlTokensPage",
      apiUrl(
        routes.admin.mediaSignedUrlTokens({
          limit: effLimit,
          ...(objectId ? { object_id: objectId } : {}),
          ...(urlScope ? { url_scope: urlScope } : {}),
          ...(issuedTo ? { issued_to: issuedTo } : {}),
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
        logAdminFetch("AdminMediaSignedUrlTokensPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, objectId, urlScope, issuedTo, tokenId]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const sc = draftUrlScope.trim().toLowerCase();
    const nextScope = SCOPE_URL.has(sc) ? sc : "";
    const issTrim = draftIssuedTo.trim();
    const nextIssued = isUuidString(issTrim) ? issTrim : "";
    const tokTrim = draftTokenId.trim();
    const nextTok = isUuidString(tokTrim) ? tokTrim : "";
    router.push(
      buildSignedUrlTokensListPath({
        limit: nextLimit,
        objectId: draftObjectId.trim().slice(0, OBJECT_MAX),
        urlScope: nextScope,
        issuedTo: nextIssued,
        tokenId: nextTok,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildSignedUrlTokensListPath({
        limit: nextLimit,
        objectId: "",
        urlScope: "",
        issuedTo: "",
        tokenId: "",
      }),
    );
  };

  const hasActiveFilters = Boolean(objectId) || Boolean(urlScope) || Boolean(issuedTo) || Boolean(tokenId);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_media_signed_url_tokens_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_media_signed_url_tokens_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin/media/access-logs" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_media_signed_url_tokens_link_logs")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_media_signed_url_tokens_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-media-signed-url-tokens-filter-form"
          className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
          aria-label={t("admin_media_signed_url_tokens_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="w-full text-meta text-ink-600 leading-relaxed lg:basis-full">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
        <div className="min-w-[8rem]">
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_limit")}
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
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={objectInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_filter_object_id")}
          </label>
          <input
            id={objectInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={OBJECT_MAX}
            value={draftObjectId}
            onChange={(e) => setDraftObjectId(e.target.value.slice(0, OBJECT_MAX))}
            placeholder={t("admin_media_signed_url_tokens_filter_object_id_ph")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[10rem]">
          <label htmlFor={scopeInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_filter_scope")}
          </label>
          <select
            id={scopeInputId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftUrlScope}
            onChange={(e) => setDraftUrlScope(e.target.value)}
          >
            <option value="">{t("admin_media_signed_url_tokens_scope_any")}</option>
            <option value="read">read</option>
            <option value="download">download</option>
          </select>
        </div>
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={issuedInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_filter_issued_to")}
          </label>
          <input
            id={issuedInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftIssuedTo}
            onChange={(e) => setDraftIssuedTo(e.target.value)}
            placeholder={t("admin_media_signed_url_tokens_filter_issued_to_ph")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={tokenInputId} className="block text-small font-medium text-ink-600">
            {t("admin_media_signed_url_tokens_filter_token_id")}
          </label>
          <input
            id={tokenInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftTokenId}
            onChange={(e) => setDraftTokenId(e.target.value)}
            placeholder={t("admin_media_signed_url_tokens_filter_token_id_ph")}
            autoComplete="off"
          />
        </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-media-signed-url-tokens-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_media_signed_url_tokens_apply")}
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
                {t("admin_media_signed_url_tokens_clear")}
              </button>
            </form>
          ) : null}
        </div>
        {appliedFilters ? (
          <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-1 w-full lg:basis-full">
            {t("admin_media_signed_url_tokens_applied")}: {JSON.stringify(appliedFilters)}
          </AdminAppliedFiltersBanner>
        ) : null}
      </div>

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_media_signed_url_tokens_loading")}
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
          aria-label={t("admin_media_signed_url_tokens_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_media_signed_url_tokens_col_created")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_signed_url_tokens_col_expires")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_signed_url_tokens_col_scope")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_signed_url_tokens_col_object")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_signed_url_tokens_col_issued")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_media_signed_url_tokens_col_id")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={6}>
                    {t("admin_media_signed_url_tokens_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => (
                <tr key={`${r.id ?? "row"}-${idx}`}>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                    {r.created_at ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                    {r.expires_at ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta">{r.url_scope ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta max-w-[14rem] truncate" title={r.object_id}>
                    {r.object_id ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap max-w-[10rem] truncate" title={r.issued_to}>
                    {r.issued_to ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap max-w-[10rem] truncate" title={r.id}>
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

export default function AdminMediaSignedUrlTokensPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_media_signed_url_tokens_title">
      <AdminMediaSignedUrlTokensPageInner />
    </AdminSearchParamsSuspense>
  );
}

