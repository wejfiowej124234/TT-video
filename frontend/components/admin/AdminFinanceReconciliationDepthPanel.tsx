"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { ADMIN_FIN_DEPTH_PANEL_CLASS } from "@/lib/adminUi";

function reconciliationDepthLinks() {
  return [
    {
      href: adminFinancePartialDepthHref("/admin/cross-check", "cross-check"),
      labelKey: "admin_fin_depth_link_cross_check",
    },
    {
      href: adminFinancePartialDepthHref("/admin/fee-router", "fee-router"),
      labelKey: "admin_fin_depth_link_fee_router",
    },
    {
      href: adminFinancePartialDepthHref("/admin/finance", "finance-summary"),
      labelKey: "admin_fin_reconciliation_depth_link_settlement",
    },
  ] as const;
}

type Props = {
  alignmentLabel: string | null;
  driftDeltaLine: string;
  crossDeltaLine: string;
  loading: boolean;
  error: boolean;
};

/** FIN-02 · ① 对账页 partial 深度工作台（② PSP/结算闭环另闸）。 */
export function AdminFinanceReconciliationDepthPanel({
  alignmentLabel,
  driftDeltaLine,
  crossDeltaLine,
  loading,
  error,
}: Props) {
  const { t } = useTranslation();

  return (
    <section
      className={ADMIN_FIN_DEPTH_PANEL_CLASS}
      aria-label={t("admin_fin_reconciliation_depth_aria")}
      data-tt-admin-fin-reconciliation-depth="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_reconciliation_depth_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_reconciliation_depth_lead")}</p>

      {loading ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>
      ) : error ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_fin_reconciliation_depth_load_failed")}</p>
      ) : (
        <dl className="mt-3 space-y-2 text-small" data-tt-admin-fin-reconciliation-depth-snapshot="1">
          {alignmentLabel ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_reconciliation_depth_alignment")}</dt>
              <dd className="mt-0.5 text-ink-900">{alignmentLabel}</dd>
            </div>
          ) : null}
          {driftDeltaLine ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_reconciliation_depth_drift")}</dt>
              <dd className="mt-0.5 font-mono text-meta text-ink-700">{driftDeltaLine}</dd>
            </div>
          ) : null}
          {crossDeltaLine ? (
            <div>
              <dt className="font-medium text-ink-700">{t("admin_fin_reconciliation_depth_cross")}</dt>
              <dd className="mt-0.5 font-mono text-meta text-ink-700">{crossDeltaLine}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <AdminFinanceDepthActionLinks links={reconciliationDepthLinks()} />
    </section>
  );
}
