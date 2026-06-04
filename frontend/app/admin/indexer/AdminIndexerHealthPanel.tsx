"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AdminIndexerJsonBlock } from "./AdminIndexerJsonBlock";
import { asRecord, type LastStoredReconciliation } from "./indexerPageModel";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS } from "@/lib/adminUi";
type AdminIndexerHealthPanelProps = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
  health: Record<string, unknown> | null;
};

export function AdminIndexerHealthPanel({ loading, error, health }: AdminIndexerHealthPanelProps) {
  const { t } = useTranslation();

  return (
    <section className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_indexer_health_panel_aria")}>
      {loading ? (
        <AdminListLoadingStatus message={t("admin_indexer_loading")} className="text-body text-ink-600" />
      ) : error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : health && Object.keys(health).length > 0 ? (
        <div>
          <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">{t("admin_indexer_healthBlock")}</h2>
          {(() => {
            const cp = asRecord(health.checkpoint);
            const block = typeof cp?.block_number === "number" ? cp.block_number : null;
            const log = typeof cp?.log_index === "number" ? cp.log_index : null;
            const lag = typeof health.lag_blocks === "number" ? health.lag_blocks : null;
            const lagMax = typeof health.lag_max_blocks === "number" ? health.lag_max_blocks : null;
            const finalityN = typeof health.finality_n === "number" ? health.finality_n : null;
            const lastSeenFn = typeof health.last_seen_finality_n === "number" ? health.last_seen_finality_n : null;
            const reorg = health.reorg_detected === true;
            const replayReq = health.replay_required === true;
            const rt = asRecord(health.runtime);
            const memUnavailable = rt?.status === "unavailable";
            const lastBlock = typeof rt?.last_block === "number" ? rt.last_block : null;
            const evCached = typeof rt?.events_cached === "number" ? rt.events_cached : null;

            return (
              <Link
                href="#admin-indexer-reconcile"
                className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start mb-4 space-y-2 rounded-[var(--radius-md)] border border-ink-200 bg-white/90 p-4 text-left transition hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
                    {t("admin_indexer_runtime_memory").replace("{block}", String(lastBlock)).replace("{n}", String(evCached))}
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
                ? t("admin_indexer_last_reconcile_issues", { count: issues })
                : t("admin_indexer_last_reconcile_issues_unknown");
            const at =
              lr.created_at && !Number.isNaN(Date.parse(lr.created_at))
                ? t("admin_indexer_last_reconcile_at", { ts: new Date(lr.created_at).toLocaleString() })
                : null;
            const rtLabel = lr.report_type?.trim();
            const chainLine =
              typeof lr.chain_id === "number"
                ? t("admin_indexer_last_reconcile_chain", { id: String(lr.chain_id) })
                : t("admin_indexer_last_reconcile_chain_unknown");
            return (
              <Link
                href={`/admin/indexer/reconcile/${encodeURIComponent(id)}`}
                className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start mb-4 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/50 p-4 text-left transition hover:border-ink-400 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                aria-label={t("admin_indexer_last_reconcile_open")}
              >
                <h3 className="text-small font-semibold text-ink-800">{t("admin_indexer_last_reconcile_heading")}</h3>
                {rtLabel ? (
                  <p className="mt-2 text-meta font-mono text-ink-700">
                    {t("admin_indexer_last_reconcile_report_type", { type: rtLabel })}
                  </p>
                ) : null}
                <p className="mt-2 text-body text-ink-700">{statusLine}</p>
                <p className="mt-1 text-body text-ink-600">{issuesLine}</p>
                <p className="mt-1 text-meta text-ink-600">{chainLine}</p>
                {at ? <p className="mt-1 text-meta text-ink-500">{at}</p> : null}
                <p className="mt-3 text-small font-medium text-ink-700">{t("admin_indexer_last_reconcile_open")}</p>
              </Link>
            );
          })()}
          <Link
            href="#admin-indexer-reconcile"
            className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 p-1 text-left transition hover:border-ink-400 ${ADMIN_LINK_FOCUS_CLASS}`}
            aria-label={t("admin_indexer_reconcile_sectionTitle")}
          >
            <AdminIndexerJsonBlock value={health} />
          </Link>
        </div>
      ) : (
        <p className="text-body text-ink-700" role="status">
          {t("admin_indexer_empty")}
        </p>
      )}
    </section>
  );
}
