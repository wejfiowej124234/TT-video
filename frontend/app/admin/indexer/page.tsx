"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
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
  travelFocusRingCoreOffset2Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 max-h-[min(28rem,70vh)] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

type IndexerHealthRes = {
  status?: string;
  error?: string;
  health?: Record<string, unknown>;
  meta?: unknown;
};

type LastStoredReconciliation = {
  report_id?: string;
  report_type?: string;
  created_at?: string;
  chain_id?: number | null;
  projection_reconcile_clean?: boolean | null;
  issues_total?: number | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

/** 70 / 04 §3.5：索引器健康只读（须 admin）。 */
export default function AdminIndexerPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const opsHintId = useId();
  const indexerHeaderToolsFilterHintId = useId();
  const indexerReconcileOpenFilterHintId = useId();
  const router = useRouter();
  const [reconcileId, setReconcileId] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-indexer-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    adminFetchJson<IndexerHealthRes>("AdminIndexerPage", apiUrl(routes.admin.indexerHealth), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then((json) => {
        setHealth((json.health as Record<string, unknown> | undefined) ?? null);
        setMeta(isAdminMetaRecord(json.meta) ? json.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminIndexerPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [refreshTick]);

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_indexer_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_indexer_subtitle")}</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:items-end">
          <p id={indexerHeaderToolsFilterHintId} className="max-w-xl text-meta text-ink-600 sm:text-end">
            {t("admin_indexer_header_tools_filter_hint")}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            <form
              className="inline"
              aria-describedby={indexerHeaderToolsFilterHintId}
              onSubmit={(e) => {
                e.preventDefault();
                setRefreshTick((n) => n + 1);
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                disabled={loading}
              >
                {t("admin_indexer_refresh")}
              </button>
            </form>
            <Link
              href="/admin/indexer/reconcile-reports"
              className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_indexer_reconcile_reports_title")}
            </Link>
            <Link href="/admin/observability" className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
              {t("admin_observability_title")}
            </Link>
            <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
              {t("admin_indexer_back")}
            </Link>
          </div>
        </div>
      </header>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_indexer_health_panel_aria")}>
        {loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_indexer_loading")}
          </p>
        ) : error ? (
          <p className="text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : health && Object.keys(health).length > 0 ? (
          <div>
            <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_indexer_healthBlock")}
            </h2>
            {(() => {
              const cp = asRecord(health.checkpoint);
              const block = typeof cp?.block_number === "number" ? cp.block_number : null;
              const log = typeof cp?.log_index === "number" ? cp.log_index : null;
              const lag = typeof health.lag_blocks === "number" ? health.lag_blocks : null;
              const lagMax = typeof health.lag_max_blocks === "number" ? health.lag_max_blocks : null;
              const finalityN = typeof health.finality_n === "number" ? health.finality_n : null;
              const lastSeenFn =
                typeof health.last_seen_finality_n === "number" ? health.last_seen_finality_n : null;
              const reorg = health.reorg_detected === true;
              const replayReq = health.replay_required === true;
              const rt = asRecord(health.runtime);
              const memUnavailable = rt?.status === "unavailable";
              const lastBlock = typeof rt?.last_block === "number" ? rt.last_block : null;
              const evCached = typeof rt?.events_cached === "number" ? rt.events_cached : null;

              return (
                <Link
                  href="#admin-indexer-reconcile"
                  className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start mb-4 space-y-2 rounded-[var(--radius-md)] border border-ink-200 bg-white/90 p-4 text-left transition hover:border-travel-400 hover:text-travel-700 ${travelFocusRingCoreOffset2WhiteClasses}`}
                  aria-label={t("admin_indexer_reconcile_sectionTitle")}
                >
                  <h3 className="text-small font-semibold text-ink-800">{t("admin_indexer_health_summary_heading")}</h3>
                  {block !== null && log !== null ? (
                    <p className="text-body text-ink-700">
                      {t("admin_observability_indexer_checkpoint")
                        .replace("{block}", String(block))
                        .replace("{log}", String(log))}
                    </p>
                  ) : null}
                  {lag !== null && lagMax !== null ? (
                    <p className="text-body text-ink-700">
                      {t("admin_observability_indexer_lag").replace("{lag}", String(lag)).replace("{max}", String(lagMax))}
                    </p>
                  ) : null}
                  {finalityN !== null ? (
                    <p className="text-body text-ink-700">
                      {t("admin_observability_indexer_finality")
                        .replace("{n}", String(finalityN))
                        .replace("{seen}", lastSeenFn !== null ? String(lastSeenFn) : t("admin_em_dash"))}
                    </p>
                  ) : null}
                  <p className="text-body text-ink-700">
                    {reorg ? t("admin_observability_indexer_reorg_true") : t("admin_observability_indexer_reorg_false")}
                  </p>
                  <p className="text-body text-ink-700">
                    {replayReq ? t("admin_observability_indexer_replay_required") : t("admin_observability_indexer_replay_ok")}
                  </p>
                  {memUnavailable ? (
                    <p className="text-meta text-ink-600">{t("admin_indexer_runtime_unavailable")}</p>
                  ) : lastBlock !== null && evCached !== null ? (
                    <p className="text-meta text-ink-600">
                      {t("admin_indexer_runtime_memory")
                        .replace("{block}", String(lastBlock))
                        .replace("{n}", String(evCached))}
                    </p>
                  ) : null}
                </Link>
              );
            })()}
            {(() => {
              const raw = health.last_stored_reconciliation;
              const lr = asRecord(raw) as LastStoredReconciliation | null;
              if (!lr) return null;
              const id = lr.report_id?.trim();
              if (!id) return null;
              const clean = lr.projection_reconcile_clean;
              const issues = lr.issues_total;
              const statusLine =
                clean === true
                  ? t("admin_indexer_last_reconcile_clean_yes")
                  : clean === false
                    ? t("admin_indexer_last_reconcile_clean_no")
                    : t("admin_indexer_last_reconcile_clean_unknown");
              const issuesLine =
                typeof issues === "number"
                  ? t("admin_indexer_last_reconcile_issues").replace("{count}", String(issues))
                  : t("admin_indexer_last_reconcile_issues_unknown");
              const at =
                lr.created_at && !Number.isNaN(Date.parse(lr.created_at))
                  ? t("admin_indexer_last_reconcile_at").replace(
                      "{ts}",
                      new Date(lr.created_at).toLocaleString(),
                    )
                  : null;
              const rtLabel = lr.report_type?.trim();
              const chainLine =
                typeof lr.chain_id === "number"
                  ? t("admin_indexer_last_reconcile_chain").replace("{id}", String(lr.chain_id))
                  : t("admin_indexer_last_reconcile_chain_unknown");
              return (
                <Link
                  href={`/admin/indexer/reconcile/${encodeURIComponent(id)}`}
                  className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start mb-4 rounded-[var(--radius-md)] border border-travel-200/80 bg-travel-50/50 p-4 text-left transition hover:border-travel-400 hover:text-travel-800 ${travelFocusRingCoreOffset2WhiteClasses}`}
                  aria-label={t("admin_indexer_last_reconcile_open")}
                >
                  <h3 className="text-small font-semibold text-ink-800">
                    {t("admin_indexer_last_reconcile_heading")}
                  </h3>
                  {rtLabel ? (
                    <p className="mt-2 text-meta font-mono text-ink-700">
                      {t("admin_indexer_last_reconcile_report_type").replace("{type}", rtLabel)}
                    </p>
                  ) : null}
                  <p className="mt-2 text-body text-ink-700">{statusLine}</p>
                  <p className="mt-1 text-body text-ink-600">{issuesLine}</p>
                  <p className="mt-1 text-meta text-ink-600">{chainLine}</p>
                  {at ? <p className="mt-1 text-meta text-ink-500">{at}</p> : null}
                  <p className="mt-3 text-small font-medium text-travel-600">{t("admin_indexer_last_reconcile_open")}</p>
                </Link>
              );
            })()}
            <Link
              href="#admin-indexer-reconcile"
              className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 p-1 text-left transition hover:border-travel-400 ${travelFocusRingOffset2Classes}`}
              aria-label={t("admin_indexer_reconcile_sectionTitle")}
            >
              <JsonBlock value={health} />
            </Link>
          </div>
        ) : (
          <p className="text-body text-ink-600" role="status">
            {t("admin_indexer_empty")}
          </p>
        )}
      </section>

      <Link
        href="#admin-indexer-reconcile"
        className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start mt-6 rounded-[var(--radius-xl)] border border-dashed border-ink-300 bg-warning/5 p-4 text-left text-ink-800 transition hover:border-travel-400 hover:text-travel-700 ${travelFocusRingCoreOffset2WhiteClasses}`}
        aria-labelledby={opsHintId}
      >
        <h2 id={opsHintId} className="text-small font-semibold uppercase tracking-wide text-ink-600">
          {t("admin_indexer_ops_heading")}
        </h2>
        <p className="mt-2 whitespace-pre-line text-body text-ink-700 leading-relaxed">{t("admin_indexer_ops_hint")}</p>
        <p className="mt-3 text-meta text-ink-600 leading-relaxed">{t("admin_indexer_ops_projection_sync_note")}</p>
      </Link>

      <section
        id="admin-indexer-reconcile"
        className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 shadow-soft scroll-mt-24"
        aria-label={t("admin_indexer_reconcile_sectionTitle")}
      >
        <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
          {t("admin_indexer_reconcile_sectionTitle")}
        </h2>
        <p className="mt-1 text-body text-ink-600">{t("admin_indexer_reconcile_sectionHint")}</p>
        <p className="mt-2">
          <Link
            href="/admin/indexer/reconcile-reports"
            className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline rounded-[var(--radius-sm)] ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_indexer_reconcile_list_link")}
          </Link>
        </p>
        <p id={indexerReconcileOpenFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
          {t("admin_indexer_reconcile_open_filter_hint")}
        </p>
        <form
          aria-describedby={indexerReconcileOpenFilterHintId}
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const id = reconcileId.trim();
            if (!id) return;
            router.push(`/admin/indexer/reconcile/${encodeURIComponent(id)}`);
          }}
        >
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-small text-ink-700">
            {t("admin_indexer_reconcile_idField")}
            <input
              type="text"
              name="report_id"
              value={reconcileId}
              onChange={(e) => setReconcileId(e.target.value)}
              className={`min-h-[44px] w-full rounded-[var(--radius-md)] border border-ink-200 bg-white px-3 py-2 font-mono text-body text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses} focus-visible:ring-offset-white`}
              placeholder={t("admin_indexer_reconcile_placeholder")}
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses} focus-visible:ring-offset-white`}
            disabled={!reconcileId.trim()}
          >
            {t("admin_indexer_reconcile_open")}
          </button>
        </form>
      </section>
    </main>
  );
}
