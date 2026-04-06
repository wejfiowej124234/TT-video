"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminApiErrorUserText,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type Row = {
  id?: string;
  flag_code?: string;
  description?: string | null;
  scope?: string | null;
  enabled?: boolean;
  rollout_percent?: number | null;
  region?: unknown;
  version?: number;
  updated_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

type PublishRes = {
  status?: string;
  error?: string;
  current_version?: number;
};

type RegionMode = "unchanged" | "clear" | "set";

const FLAG_CODE_MAX_LEN = 256;
const SCOPE_RE = /^[a-zA-Z0-9._-]{1,64}$/;
const ENABLED_URL = new Set(["", "true", "false"]);

function regionPreview(r: unknown, dash: string): string {
  if (r == null) return dash;
  try {
    const s = typeof r === "string" ? r : JSON.stringify(r);
    return s.length > 48 ? `${s.slice(0, 48)}…` : s;
  } catch {
    return dash;
  }
}

function regionToInitialString(r: unknown): string {
  if (r == null) return "";
  if (typeof r === "string") return r;
  try {
    return JSON.stringify(r);
  } catch {
    return "";
  }
}

function parseFlagsListQuery(sp: URLSearchParams): {
  limit: number;
  flagCode: string;
  enabled: string;
  scope: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "200", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 200;
  limit = Math.min(200, Math.floor(limit));
  const flagCode = (sp.get("flag_code") ?? "").trim().slice(0, FLAG_CODE_MAX_LEN);
  const rawEn = (sp.get("enabled") ?? "").trim().toLowerCase();
  const enabled = ENABLED_URL.has(rawEn) ? rawEn : "";
  const rawScope = (sp.get("scope") ?? "").trim();
  const scope = SCOPE_RE.test(rawScope) ? rawScope : "";
  return { limit, flagCode, enabled, scope };
}

function buildFlagsListPath(q: {
  limit: number;
  flagCode: string;
  enabled: string;
  scope: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const fc = q.flagCode.trim().slice(0, FLAG_CODE_MAX_LEN);
  if (fc) sp.set("flag_code", fc);
  if (q.enabled === "true" || q.enabled === "false") sp.set("enabled", q.enabled);
  if (q.scope) sp.set("scope", q.scope);
  return `/admin/flags?${sp.toString()}`;
}

/** 70 / 220：Feature Flag 台账；发布须 super_admin（04 §3.5）。 */
function AdminFlagsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const flagCodeInputId = useId();
  const enabledSelectId = useId();
  const scopeInputId = useId();
  const publishDialogTitleId = useId();
  const publishDialogDescId = useId();
  const publishModalFilterHintId = useId();
  const adminFilterHintId = useId();
  const flagsActiveCodeDescId = useId();
  const flagsActiveEnabledDescId = useId();
  const flagsActiveScopeDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, flagCode, enabled, scope } = useMemo(
    () => parseFlagsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftFlagCode, setDraftFlagCode] = useState(flagCode);
  const [draftEnabled, setDraftEnabled] = useState(enabled);
  const [draftScope, setDraftScope] = useState(scope);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftFlagCode(flagCode);
    setDraftEnabled(enabled);
    setDraftScope(scope);
  }, [limit, flagCode, enabled, scope]);

  const [publishRow, setPublishRow] = useState<Row | null>(null);
  const [pubEnabled, setPubEnabled] = useState(false);
  const [pubRollout, setPubRollout] = useState("");
  const [pubRegionMode, setPubRegionMode] = useState<RegionMode>("unchanged");
  const [pubRegionText, setPubRegionText] = useState("");
  const [pubVersion, setPubVersion] = useState("");
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const closePublish = useCallback(() => {
    setPublishRow(null);
    setPublishError(null);
  }, []);

  const openPublish = (r: Row) => {
    setPublishError(null);
    setPublishRow(r);
    setPubEnabled(r.enabled === true);
    setPubRollout(r.rollout_percent != null ? String(r.rollout_percent) : "");
    setPubRegionMode("unchanged");
    setPubRegionText(regionToInitialString(r.region));
    setPubVersion(r.version != null ? String(r.version) : "");
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-flags-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminFlagsPage",
      apiUrl(
        routes.admin.flags({
          limit,
          ...(flagCode ? { flag_code: flagCode } : {}),
          ...(enabled === "true" || enabled === "false" ? { enabled } : {}),
          ...(scope ? { scope } : {}),
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
        logAdminFetch("AdminFlagsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, flagCode, enabled, scope, reloadTick]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 200;
    let nextScope = draftScope.trim();
    if (nextScope !== "" && !SCOPE_RE.test(nextScope)) {
      nextScope = "";
    }
    router.push(
      buildFlagsListPath({
        limit: nextLimit,
        flagCode: draftFlagCode.trim().slice(0, FLAG_CODE_MAX_LEN),
        enabled: draftEnabled === "true" || draftEnabled === "false" ? draftEnabled : "",
        scope: nextScope,
      }),
    );
  };

  const resetFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildFlagsListPath({ limit: nextLimit, flagCode: "", enabled: "", scope: "" }));
  };

  const hasActiveFilters = Boolean(flagCode) || enabled === "true" || enabled === "false" || Boolean(scope);

  const submitPublish = useCallback(() => {
    const id = publishRow?.id?.trim();
    if (!id) return;
    const ev = Number.parseInt(pubVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      setPublishError(t("admin_flags_publishBadVer"));
      return;
    }
    const body: Record<string, unknown> = {
      enabled: pubEnabled,
      expected_version: ev,
    };
    const rp = pubRollout.trim();
    if (rp !== "") {
      const n = Number.parseInt(rp, 10);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        setPublishError(t("admin_flags_publishBadRollout"));
        return;
      }
      body.rollout_percent = n;
    }
    if (pubRegionMode === "clear") {
      body.region = null;
    } else if (pubRegionMode === "set") {
      body.region = pubRegionText.trim() === "" ? null : pubRegionText.trim();
    }

    setPublishSubmitting(true);
    setPublishError(null);

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      setPublishError(t("admin_flags_publishAuth"));
      setPublishSubmitting(false);
      return;
    }

    void adminFetchJson<PublishRes>(
      "AdminFlagPublish",
      apiUrl(routes.admin.flagPublish(id)),
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
    )
      .then(({ res, body: b }) => {
        if (res.status === 409 && b?.error === "feature_flag_version_conflict") {
          const cv = b.current_version;
          setPublishError(
            typeof cv === "number"
              ? t("admin_flags_publishConflict").replace("{{current}}", String(cv))
              : t("admin_flags_publishConflictGeneric"),
          );
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminFlagPublish", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closePublish();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminFlagPublish", e);
        const msg = e instanceof Error ? e.message : "";
        setPublishError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setPublishSubmitting(false));
  }, [closePublish, pubEnabled, pubRegionMode, pubRegionText, pubRollout, pubVersion, publishRow, t]);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_flags_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_flags_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_flags_back")}
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-flags-filter-form"
          className="space-y-3"
          aria-label={t("admin_flags_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              flagCode ? flagsActiveCodeDescId : "",
              enabled === "true" || enabled === "false" ? flagsActiveEnabledDescId : "",
              scope ? flagsActiveScopeDescId : "",
              !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_flags_filters")}</p>
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[8rem]">
              <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
                {t("admin_flags_limit")}
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
              <label htmlFor={flagCodeInputId} className="block text-small font-medium text-ink-600">
                {t("admin_flags_filter_flag_code")}
              </label>
              <input
                id={flagCodeInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                maxLength={FLAG_CODE_MAX_LEN}
                value={draftFlagCode}
                onChange={(e) => setDraftFlagCode(e.target.value.slice(0, FLAG_CODE_MAX_LEN))}
                placeholder={t("admin_flags_filter_flag_code_placeholder")}
                autoComplete="off"
              />
            </div>
            <div className="min-w-[10rem]">
              <label htmlFor={enabledSelectId} className="block text-small font-medium text-ink-600">
                {t("admin_flags_filter_enabled")}
              </label>
              <select
                id={enabledSelectId}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftEnabled}
                onChange={(e) => setDraftEnabled(e.target.value)}
              >
                <option value="">{t("admin_flags_enabled_any")}</option>
                <option value="true">{t("admin_flags_enabled_true")}</option>
                <option value="false">{t("admin_flags_enabled_false")}</option>
              </select>
            </div>
            <div className="min-w-[8rem] flex-1">
              <label htmlFor={scopeInputId} className="block text-small font-medium text-ink-600">
                {t("admin_flags_filter_scope")}
              </label>
              <input
                id={scopeInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                maxLength={64}
                value={draftScope}
                onChange={(e) => setDraftScope(e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64))}
                placeholder={t("admin_flags_filter_scope_placeholder")}
                autoComplete="off"
              />
            </div>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-flags-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_flags_apply")}
          </button>
          {hasActiveFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                resetFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_flags_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
        <p id={adminFilterHintId} className="mt-3 text-meta text-ink-500">
          {t("admin_flags_filter_hint")}
        </p>
        {flagCode ? (
          <p id={flagsActiveCodeDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_flags_active_flag_code").replace("{code}", flagCode)}
          </p>
        ) : null}
        {enabled === "true" || enabled === "false" ? (
          <p id={flagsActiveEnabledDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_flags_active_enabled").replace("{enabled}", enabled)}
          </p>
        ) : null}
        {scope ? (
          <p id={flagsActiveScopeDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_flags_active_scope").replace("{scope}", scope)}
          </p>
        ) : null}
      </div>

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_flags_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_flags_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-4">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_flags_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_flags_colCode")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_flags_colEnabled")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_flags_colRollout")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_flags_colScope")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_flags_colRegion")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_flags_colVer")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_flags_colUpdated")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_flags_colDesc")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_flags_colAction")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={9}>
                    {t("admin_flags_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                const reg = regionPreview(r.region, dash);
                return (
                  <tr key={r.id ?? `ff-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta">{r.flag_code ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.enabled == null ? dash : String(r.enabled)}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.rollout_percent ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.scope ?? ""}>
                      {r.scope ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem]">
                      <span className="block truncate" title={reg}>
                        {reg}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.version ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.updated_at ?? dash}</td>
                    <td className="px-3 py-2 max-w-xs truncate" title={r.description ?? ""}>
                      {r.description ?? dash}
                    </td>
                    <td className="px-3 py-2">
                      {r.id ? (
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            openPublish(r);
                          }}
                        >
                          <button
                            type="submit"
                            className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                          >
                            {t("admin_flags_publish")}
                          </button>
                        </form>
                      ) : (
                        dash
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {publishRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby={publishDialogTitleId}
          aria-describedby={publishDialogDescId}
        >
          <div className="max-w-md w-full rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-medium my-8">
            <h2 id={publishDialogTitleId} className="text-body-l font-semibold text-ink-900">
              {t("admin_flags_publishTitle")}
            </h2>
            <p id={publishDialogDescId} className="mt-1 text-small text-ink-600">{t("admin_flags_publishSuperHint")}</p>
            <p className="mt-2 font-mono text-meta text-ink-700 break-all">{publishRow.flag_code ?? publishRow.id}</p>
            <p id={publishModalFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
              {t("admin_flags_publish_filter_hint")}
            </p>

            <form
              aria-describedby={publishModalFilterHintId}
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
                  closePublish();
                  return;
                }
                void submitPublish();
              }}
            >
            <label className="mt-4 flex items-center gap-2 text-small text-ink-800">
              <input type="checkbox" name="enabled" checked={pubEnabled} onChange={(e) => setPubEnabled(e.target.checked)} />
              {t("admin_flags_publishEnabled")}
            </label>

            <label className="mt-3 block text-small text-ink-800">
              {t("admin_flags_publishRollout")}
              <input
                type="text"
                name="rollout_percent"
                inputMode="numeric"
                value={pubRollout}
                onChange={(e) => setPubRollout(e.target.value)}
                placeholder={t("admin_flags_publishRolloutPh")}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
              />
            </label>

            <label className="mt-3 block text-small text-ink-800">
              {t("admin_flags_publishRegionMode")}
              <select
                name="region_mode"
                value={pubRegionMode}
                onChange={(e) => setPubRegionMode(e.target.value as RegionMode)}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                <option value="unchanged">{t("admin_flags_publishRegionUnchanged")}</option>
                <option value="clear">{t("admin_flags_publishRegionClear")}</option>
                <option value="set">{t("admin_flags_publishRegionSet")}</option>
              </select>
            </label>
            {pubRegionMode === "set" ? (
              <label className="mt-3 block text-small text-ink-800">
                {t("admin_flags_publishRegionValue")}
                <input
                  type="text"
                  name="region"
                  value={pubRegionText}
                  onChange={(e) => setPubRegionText(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
                />
              </label>
            ) : null}

            <label className="mt-3 block text-small text-ink-800">
              {t("admin_flags_publishVer")}
              <input
                type="text"
                name="expected_version"
                inputMode="numeric"
                value={pubVersion}
                onChange={(e) => setPubVersion(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
              />
            </label>

            {publishError ? (
              <p className="mt-3 text-small text-danger" role="alert">
                {publishError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="submit"
                name="admin_modal_intent"
                value="cancel"
                formNoValidate
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 px-4 py-2 text-small text-ink-800 hover:bg-bg-console ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_flags_publishCancel")}
              </button>
              <button
                type="submit"
                disabled={publishSubmitting}
                aria-busy={publishSubmitting ? true : undefined}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {publishSubmitting ? t("admin_flags_publishSubmitting") : t("admin_flags_publishSubmit")}
              </button>
            </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function AdminFlagsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_flags_title">
      <AdminFlagsPageInner />
    </AdminSearchParamsSuspense>
  );
}

