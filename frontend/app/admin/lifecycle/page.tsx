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
  machine_code?: string;
  domain?: string;
  version?: string | null;
  entity_type?: string;
  current_state?: string;
  expected_state?: string;
  anomaly_flag?: boolean | null;
  anomaly_type?: string | null;
  last_transition_at?: string | null;
  source_of_truth?: string | null;
  repairable?: boolean | null;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const MACHINE_CODE_MAX = 128;
const DOMAIN_MAX = 64;
const ENTITY_MAX = 64;
const VERSION_MAX = 32;
const SOT_MAX = 128;

const ANOMALY_URL = new Set(["true", "false", "1", "0", "yes", "no"]);

function normalizeLifecycleAnomalyUrl(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  return ANOMALY_URL.has(t) ? t : "";
}

function parseLifecycleListQuery(sp: URLSearchParams): {
  limit: number;
  machineCode: string;
  domain: string;
  entityType: string;
  version: string;
  sourceOfTruth: string;
  anomalyFlag: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const machineCode = (sp.get("machine_code") ?? "").trim().slice(0, MACHINE_CODE_MAX);
  const domain = (sp.get("domain") ?? "").trim().slice(0, DOMAIN_MAX);
  const entityType = (sp.get("entity_type") ?? "").trim().slice(0, ENTITY_MAX);
  const version = (sp.get("version") ?? "").trim().slice(0, VERSION_MAX);
  const sourceOfTruth = (sp.get("source_of_truth") ?? "").trim().slice(0, SOT_MAX);
  const anomalyFlag = normalizeLifecycleAnomalyUrl(sp.get("anomaly_flag") ?? "");
  return { limit, machineCode, domain, entityType, version, sourceOfTruth, anomalyFlag };
}

function buildLifecycleListPath(q: {
  limit: number;
  machineCode: string;
  domain: string;
  entityType: string;
  version: string;
  sourceOfTruth: string;
  anomalyFlag: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const mc = q.machineCode.trim().slice(0, MACHINE_CODE_MAX);
  if (mc) sp.set("machine_code", mc);
  const d = q.domain.trim().slice(0, DOMAIN_MAX);
  if (d) sp.set("domain", d);
  const et = q.entityType.trim().slice(0, ENTITY_MAX);
  if (et) sp.set("entity_type", et);
  const v = q.version.trim().slice(0, VERSION_MAX);
  if (v) sp.set("version", v);
  const sot = q.sourceOfTruth.trim().slice(0, SOT_MAX);
  if (sot) sp.set("source_of_truth", sot);
  const af = normalizeLifecycleAnomalyUrl(q.anomalyFlag);
  if (af) sp.set("anomaly_flag", af);
  return `/admin/lifecycle?${sp.toString()}`;
}

/** 350 / 70：生命周期状态机台账只读（须 admin + DB）。 */
function AdminLifecyclePageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const machineInputId = useId();
  const domainInputId = useId();
  const entityInputId = useId();
  const versionInputId = useId();
  const sotInputId = useId();
  const anomalyInputId = useId();
  const adminFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, machineCode, domain, entityType, version, sourceOfTruth, anomalyFlag } = useMemo(
    () => parseLifecycleListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftMachine, setDraftMachine] = useState(machineCode);
  const [draftDomain, setDraftDomain] = useState(domain);
  const [draftEntity, setDraftEntity] = useState(entityType);
  const [draftVersion, setDraftVersion] = useState(version);
  const [draftSot, setDraftSot] = useState(sourceOfTruth);
  const [draftAnomaly, setDraftAnomaly] = useState(anomalyFlag);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftMachine(machineCode);
    setDraftDomain(domain);
    setDraftEntity(entityType);
    setDraftVersion(version);
    setDraftSot(sourceOfTruth);
    setDraftAnomaly(anomalyFlag);
  }, [limit, machineCode, domain, entityType, version, sourceOfTruth, anomalyFlag]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-lifecycle-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminLifecyclePage",
      apiUrl(
        routes.admin.lifecycleStateMachines({
          limit: effLimit,
          ...(machineCode ? { machine_code: machineCode } : {}),
          ...(domain ? { domain } : {}),
          ...(entityType ? { entity_type: entityType } : {}),
          ...(version ? { version } : {}),
          ...(sourceOfTruth ? { source_of_truth: sourceOfTruth } : {}),
          ...(anomalyFlag ? { anomaly_flag: anomalyFlag } : {}),
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
        logAdminFetch("AdminLifecyclePage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, machineCode, domain, entityType, version, sourceOfTruth, anomalyFlag]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const nextAnomaly = normalizeLifecycleAnomalyUrl(draftAnomaly);
    router.push(
      buildLifecycleListPath({
        limit: nextLimit,
        machineCode: draftMachine.trim().slice(0, MACHINE_CODE_MAX),
        domain: draftDomain.trim().slice(0, DOMAIN_MAX),
        entityType: draftEntity.trim().slice(0, ENTITY_MAX),
        version: draftVersion.trim().slice(0, VERSION_MAX),
        sourceOfTruth: draftSot.trim().slice(0, SOT_MAX),
        anomalyFlag: nextAnomaly,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildLifecycleListPath({
        limit: nextLimit,
        machineCode: "",
        domain: "",
        entityType: "",
        version: "",
        sourceOfTruth: "",
        anomalyFlag: "",
      }),
    );
  };

  const hasActiveFilters =
    Boolean(machineCode) ||
    Boolean(domain) ||
    Boolean(entityType) ||
    Boolean(version) ||
    Boolean(sourceOfTruth) ||
    Boolean(anomalyFlag);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_lifecycle_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_lifecycle_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_lifecycle_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-lifecycle-filter-form"
          className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
          aria-label={t("admin_lifecycle_filters")}
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
            {t("admin_lifecycle_limit")}
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
          <label htmlFor={machineInputId} className="block text-small font-medium text-ink-600">
            {t("admin_lifecycle_filter_machine")}
          </label>
          <input
            id={machineInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={MACHINE_CODE_MAX}
            value={draftMachine}
            onChange={(e) => setDraftMachine(e.target.value.slice(0, MACHINE_CODE_MAX))}
            placeholder={t("admin_lifecycle_filter_machine_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[7rem] flex-1">
          <label htmlFor={domainInputId} className="block text-small font-medium text-ink-600">
            {t("admin_lifecycle_filter_domain")}
          </label>
          <input
            id={domainInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={DOMAIN_MAX}
            value={draftDomain}
            onChange={(e) => setDraftDomain(e.target.value.slice(0, DOMAIN_MAX))}
            placeholder={t("admin_lifecycle_filter_domain_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[8rem] flex-1">
          <label htmlFor={entityInputId} className="block text-small font-medium text-ink-600">
            {t("admin_lifecycle_filter_entity")}
          </label>
          <input
            id={entityInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={ENTITY_MAX}
            value={draftEntity}
            onChange={(e) => setDraftEntity(e.target.value.slice(0, ENTITY_MAX))}
            placeholder={t("admin_lifecycle_filter_entity_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[6rem] flex-1">
          <label htmlFor={versionInputId} className="block text-small font-medium text-ink-600">
            {t("admin_lifecycle_filter_version")}
          </label>
          <input
            id={versionInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={VERSION_MAX}
            value={draftVersion}
            onChange={(e) => setDraftVersion(e.target.value.slice(0, VERSION_MAX))}
            placeholder={t("admin_lifecycle_filter_version_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[9rem] flex-1">
          <label htmlFor={sotInputId} className="block text-small font-medium text-ink-600">
            {t("admin_lifecycle_filter_sot")}
          </label>
          <input
            id={sotInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={SOT_MAX}
            value={draftSot}
            onChange={(e) => setDraftSot(e.target.value.slice(0, SOT_MAX))}
            placeholder={t("admin_lifecycle_filter_sot_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[8rem]">
          <label htmlFor={anomalyInputId} className="block text-small font-medium text-ink-600">
            {t("admin_lifecycle_filter_anomaly")}
          </label>
          <select
            id={anomalyInputId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftAnomaly}
            onChange={(e) => setDraftAnomaly(e.target.value)}
          >
            <option value="">{t("admin_lifecycle_filter_anomaly_any")}</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-lifecycle-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_lifecycle_apply")}
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
                {t("admin_lifecycle_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_lifecycle_filter_hint")}
      </p>
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_lifecycle_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_lifecycle_loading")}
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
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_lifecycle_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_lifecycle_colCode")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_lifecycle_colDomain")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_lifecycle_colEntity")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_lifecycle_colCurrent")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_lifecycle_colExpected")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_lifecycle_colAnomaly")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_lifecycle_colRepair")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_lifecycle_colTransition")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={8}>
                    {t("admin_lifecycle_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => (
                <tr key={`${r.machine_code ?? "m"}-${idx}`}>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.machine_code ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta">{r.domain ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.entity_type}>
                    {r.entity_type ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta">{r.current_state ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta">{r.expected_state ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta">
                    {r.anomaly_flag == null ? t("admin_em_dash") : String(r.anomaly_flag)}
                    {r.anomaly_type ? ` / ${r.anomaly_type}` : ""}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta">
                    {r.repairable == null ? t("admin_em_dash") : String(r.repairable)}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.last_transition_at ?? t("admin_em_dash")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default function AdminLifecyclePage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_lifecycle_title">
      <AdminLifecyclePageInner />
    </AdminSearchParamsSuspense>
  );
}

