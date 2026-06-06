"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

function indexerDepthLinks() {
  return [
    {
      href: adminFinancePartialDepthHref("/admin/finance-reconciliation", "reconciliation"),
      labelKey: "admin_fin_indexer_depth_link_reconciliation",
    },
    {
      href: "/admin/indexer/reconcile-reports",
      labelKey: "admin_fin_indexer_depth_link_reconcile_reports",
    },
    { href: "/admin/finance-suite", labelKey: "admin_fin_cross_check_depth_link_suite" },
  ] as const;
}

type Props = {
  checkpointBlock: number | null;
  checkpointLog: number | null;
  lagBlocks: number | null;
  reorgDetected: boolean | null;
  replayRequired: boolean | null;
  loading: boolean;
  error: boolean;
};

/** FIN-02 · ① 索引器健康 partial 深度工作台（② 全链对账另闸）。 */
export function AdminFinanceIndexerDepthPanel({
  checkpointBlock,
  checkpointLog,
  lagBlocks,
  reorgDetected,
  replayRequired,
  loading,
  error,
}: Props) {
  const { t } = useTranslation();

  return (
    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"
      aria-label={t("admin_fin_indexer_depth_aria")}
      data-tt-admin-fin-indexer-depth="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_indexer_depth_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_indexer_depth_lead")}</p>

      {loading ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>
      ) : error ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_fin_indexer_depth_load_failed")}</p>
      ) : (
        <dl className="mt-3 grid gap-2 text-small sm:grid-cols-2" data-tt-admin-fin-indexer-depth-snapshot="1">
          {checkpointBlock !== null && checkpointLog !== null ? (
            <div className="sm:col-span-2">
              <dt className="font-medium text-ink-700">{t("admin_fin_indexer_depth_checkpoint")}</dt>
              <dd className="mt-0.5 text-ink-900">
                {t("admin_observability_indexer_checkpoint")
                  .replace("{block}", String(checkpointBlock))
                  .replace("{log}", String(checkpointLog))}
              </dd>
            </div>
          ) : null}
          {lagBlocks !== null ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_indexer_depth_lag")}</dt>
              <dd className="mt-0.5 text-ink-900">{lagBlocks}</dd>
            </div>
          ) : null}
          {reorgDetected !== null ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_indexer_depth_reorg")}</dt>
              <dd className="mt-0.5 text-ink-900">
                {reorgDetected
                  ? t("admin_observability_indexer_reorg_true")
                  : t("admin_observability_indexer_reorg_false")}
              </dd>
            </div>
          ) : null}
          {replayRequired !== null ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_indexer_depth_replay")}</dt>
              <dd className="mt-0.5 text-ink-900">
                {replayRequired
                  ? t("admin_observability_indexer_replay_required")
                  : t("admin_observability_indexer_replay_ok")}
              </dd>
            </div>
          ) : null}
        </dl>
      )}

      <AdminFinanceDepthActionLinks links={indexerDepthLinks()} />
    </AdminWarmL5Surface>
  );
}
