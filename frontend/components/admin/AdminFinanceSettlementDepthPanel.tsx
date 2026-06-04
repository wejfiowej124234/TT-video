"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { ADMIN_FIN_DEPTH_PANEL_CLASS } from "@/lib/adminUi";

function settlementDepthLinks() {
  return [
    {
      href: adminFinancePartialDepthHref("/admin/finance-reconciliation", "reconciliation"),
      labelKey: "admin_fin_depth_link_reconciliation",
    },
    {
      href: adminFinancePartialDepthHref("/admin/fee-router", "fee-router"),
      labelKey: "admin_fin_depth_link_fee_router",
    },
    {
      href: adminFinancePartialDepthHref("/admin/cross-check", "cross-check"),
      labelKey: "admin_fin_depth_link_cross_check",
    },
  ] as const;
}

type Props = {
  summary: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  loading: boolean;
};

export function AdminFinanceSettlementDepthPanel({ summary, meta, loading }: Props) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const maintainer = isAdminMaintainerUi(caps.role);
  const orderCount =
    summary && typeof summary.order_count === "number" ? summary.order_count : null;

  return (
    <section
      className={ADMIN_FIN_DEPTH_PANEL_CLASS}
      aria-label={t("admin_fin_settlement_depth_aria")}
      data-tt-admin-fin-settlement-depth="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_settlement_depth_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_settlement_depth_lead")}</p>

      {!loading && orderCount !== null ? (
        <p className="mt-3 text-small text-ink-800" data-tt-admin-fin-settlement-snapshot="1">
          {t("admin_fin_settlement_depth_snapshot", { count: orderCount })}
        </p>
      ) : null}

      {maintainer && meta && typeof meta.implementation_status === "string" ? (
        <p className="mt-2 font-mono text-meta text-ink-500">
          {t("admin_fin_depth_meta_status", { status: String(meta.implementation_status) })}
        </p>
      ) : null}

      <AdminFinanceDepthActionLinks links={settlementDepthLinks()} />
    </section>
  );
}
