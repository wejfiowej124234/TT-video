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
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type Row = {
  id?: string;
  key_alias?: string;
  env_scope?: string | null;
  last_rotated_at?: string | null;
  next_rotation_due?: string | null;
  status?: string;
  notes?: string | null;
  updated_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const KEY_ALIAS_MAX_LEN = 256;
const ENV_SCOPE_RE = /^[a-zA-Z0-9._-]{1,64}$/;
const STATUS_OPTIONS = ["active", "deprecated", "revoked", "pending", "suspended"] as const;

function parseListQuery(sp: URLSearchParams): {
  limit: number;
  keyAlias: string;
  status: string;
  envScope: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "200", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 200;
  limit = Math.min(200, Math.floor(limit));
  const keyAlias = (sp.get("key_alias") ?? "").trim().slice(0, KEY_ALIAS_MAX_LEN);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status = STATUS_OPTIONS.includes(rawSt as (typeof STATUS_OPTIONS)[number]) ? rawSt : "";
  const rawEnv = (sp.get("env_scope") ?? "").trim();
  const envScope = ENV_SCOPE_RE.test(rawEnv) ? rawEnv : "";
  return { limit, keyAlias, status, envScope };
}

function buildListPath(q: { limit: number; keyAlias: string; status: string; envScope: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const ka = q.keyAlias.trim().slice(0, KEY_ALIAS_MAX_LEN);
  if (ka) sp.set("key_alias", ka);
  if (q.status) sp.set("status", q.status);
  if (q.envScope) sp.set("env_scope", q.envScope);
  return `/admin/secrets/metadata?${sp.toString()}`;
}

/** 70 / 230：Secret 元数据只读（须 admin + DB；永不返回密钥明文）。 */
function AdminSecretsMetadataPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const keyAliasInputId = useId();
  const statusSelectId = useId();
  const envScopeInputId = useId();
  const limitInputId = useId();
  const adminFilterHintId = useId();
  const secretsActiveKeyAliasDescId = useId();
  const secretsActiveStatusDescId = useId();
  const secretsActiveEnvScopeDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, keyAlias, status, envScope } = useMemo(
    () => parseListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftKeyAlias, setDraftKeyAlias] = useState(keyAlias);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftEnvScope, setDraftEnvScope] = useState(envScope);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftKeyAlias(keyAlias);
    setDraftStatus(status);
    setDraftEnvScope(envScope);
  }, [limit, keyAlias, status, envScope]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-secrets-meta-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminSecretsMetadataPage",
      apiUrl(
        routes.admin.secretsMetadata({
          limit,
          ...(keyAlias ? { key_alias: keyAlias } : {}),
          ...(status ? { status } : {}),
          ...(envScope ? { env_scope: envScope } : {}),
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
        logAdminFetch("AdminSecretsMetadataPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, keyAlias, status, envScope]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 200;
    let nextEnv = draftEnvScope.trim();
    if (nextEnv !== "" && !ENV_SCOPE_RE.test(nextEnv)) {
      nextEnv = "";
    }
    router.push(
      buildListPath({
        limit: nextLimit,
        keyAlias: draftKeyAlias.trim().slice(0, KEY_ALIAS_MAX_LEN),
        status: draftStatus,
        envScope: nextEnv,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildListPath({ limit: nextLimit, keyAlias: "", status: "", envScope: "" }));
  };

  const hasActiveFilters = Boolean(keyAlias) || Boolean(status) || Boolean(envScope);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_secrets_meta_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_secrets_meta_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_secrets_meta_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-secrets-metadata-filter-form"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          aria-label={t("admin_secrets_meta_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              keyAlias ? secretsActiveKeyAliasDescId : "",
              status ? secretsActiveStatusDescId : "",
              envScope ? secretsActiveEnvScopeDescId : "",
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
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={keyAliasInputId} className="block text-small font-medium text-ink-600">
            {t("admin_secrets_meta_filter_key_alias")}
          </label>
          <input
            id={keyAliasInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={KEY_ALIAS_MAX_LEN}
            value={draftKeyAlias}
            onChange={(e) => setDraftKeyAlias(e.target.value.slice(0, KEY_ALIAS_MAX_LEN))}
            placeholder={t("admin_secrets_meta_filter_key_alias_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[11rem]">
          <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
            {t("admin_secrets_meta_filter_status")}
          </label>
          <select
            id={statusSelectId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
          >
            <option value="">{t("admin_secrets_meta_status_any")}</option>
            <option value="active">{t("admin_secrets_meta_status_active")}</option>
            <option value="deprecated">{t("admin_secrets_meta_status_deprecated")}</option>
            <option value="revoked">{t("admin_secrets_meta_status_revoked")}</option>
            <option value="pending">{t("admin_secrets_meta_status_pending")}</option>
            <option value="suspended">{t("admin_secrets_meta_status_suspended")}</option>
          </select>
        </div>
        <div className="min-w-[8rem] flex-1">
          <label htmlFor={envScopeInputId} className="block text-small font-medium text-ink-600">
            {t("admin_secrets_meta_filter_env_scope")}
          </label>
          <input
            id={envScopeInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={64}
            value={draftEnvScope}
            onChange={(e) => setDraftEnvScope(e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64))}
            placeholder={t("admin_secrets_meta_filter_env_scope_placeholder")}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_secrets_meta_limit")}
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
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-secrets-metadata-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_secrets_meta_apply")}
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
                {t("admin_secrets_meta_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_secrets_meta_filter_hint")}
      </p>

      {keyAlias ? (
        <p id={secretsActiveKeyAliasDescId} className="mt-2 text-meta text-ink-600">
          {t("admin_secrets_meta_active_key_alias").replace("{key}", keyAlias)}
        </p>
      ) : null}
      {status ? (
        <p id={secretsActiveStatusDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_secrets_meta_active_status").replace("{status}", status)}
        </p>
      ) : null}
      {envScope ? (
        <p id={secretsActiveEnvScopeDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_secrets_meta_active_env_scope").replace("{scope}", envScope)}
        </p>
      ) : null}
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_secrets_meta_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {meta?.policy != null || meta?.note != null ? (
        <AdminMetaNoteLink className="mt-4">
          <div className="space-y-1">
            {meta.policy != null ? <p>{String(meta.policy)}</p> : null}
            {meta.note != null ? <p>{String(meta.note)}</p> : null}
          </div>
        </AdminMetaNoteLink>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_secrets_meta_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_secrets_meta_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_secrets_meta_colAlias")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_secrets_meta_colScope")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_secrets_meta_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_secrets_meta_colLastRot")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_secrets_meta_colNextDue")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_secrets_meta_colUpdated")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_secrets_meta_colNotes")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={7}>
                    {t("admin_secrets_meta_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => (
                <tr key={r.id ?? `skm-${idx}`}>
                  <td className="px-3 py-2 font-mono text-meta">{r.key_alias ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta">{r.env_scope ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta">{r.status ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                    {r.last_rotated_at ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                    {r.next_rotation_due ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                    {r.updated_at ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 max-w-xs truncate" title={r.notes ?? ""}>
                    {r.notes ?? t("admin_em_dash")}
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

export default function AdminSecretsMetadataPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_secrets_meta_title">
      <AdminSecretsMetadataPageInner />
    </AdminSearchParamsSuspense>
  );
}

