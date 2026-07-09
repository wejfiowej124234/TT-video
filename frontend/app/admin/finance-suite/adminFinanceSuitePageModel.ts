import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

/** spec 70 · P0 财务对账七件套 — ① 导航枢纽（② 全链路验收另闸）。 */
export const FINANCE_SUITE_MODULES: {
  id: string;
  href: string;
  titleKey: string;
  descKey: string;
  openCtaKey: string;
  perm: (typeof ADMIN_PERM)[keyof typeof ADMIN_PERM];
  status: "active" | "partial" | "placeholder";
}[] = [
  {
    id: "reconciliation",
    href: "/admin/finance-reconciliation",
    titleKey: "admin_fin_suite_reconciliation",
    descKey: "admin_fin_suite_reconciliation_desc",
    openCtaKey: "admin_fin_suite_hub_depth_open_reconciliation",
    perm: ADMIN_PERM.FINANCE_READ,
    status: "partial",
  },
  {
    id: "fee-router",
    href: "/admin/fee-router",
    titleKey: "admin_fin_suite_fee_router",
    descKey: "admin_fin_suite_fee_router_desc",
    openCtaKey: "admin_fin_suite_hub_depth_open_fee_router",
    perm: ADMIN_PERM.FINANCE_READ,
    status: "partial",
  },
  {
    id: "finance-summary",
    href: "/admin/finance",
    titleKey: "admin_fin_suite_settlement",
    descKey: "admin_fin_suite_settlement_desc",
    openCtaKey: "admin_fin_suite_hub_depth_open_finance_summary",
    perm: ADMIN_PERM.FINANCE_READ,
    status: "partial",
  },
  {
    id: "refunds",
    href: "/admin/disputes",
    titleKey: "admin_fin_suite_refunds",
    descKey: "admin_fin_suite_refunds_desc",
    openCtaKey: "admin_fin_suite_hub_depth_open_refunds",
    perm: ADMIN_PERM.DISPUTES_WRITE,
    status: "partial",
  },
  {
    id: "cross-check",
    href: "/admin/cross-check",
    titleKey: "admin_fin_suite_anomaly",
    descKey: "admin_fin_suite_anomaly_desc",
    openCtaKey: "admin_fin_suite_hub_depth_open_cross_check",
    perm: ADMIN_PERM.FINANCE_READ,
    status: "partial",
  },
  {
    id: "audit",
    href: "/admin/audit",
    titleKey: "admin_fin_suite_audit_export",
    descKey: "admin_fin_suite_audit_export_desc",
    openCtaKey: "admin_fin_suite_hub_depth_open_audit",
    perm: ADMIN_PERM.READ,
    status: "partial",
  },
];

/** 七件套旁路深度（drift · region-vault）。 */
export const FINANCE_SUITE_SUPPLEMENT_MODULES = [
  {
    id: "drift",
    href: "/admin/drift-summary",
    titleKey: "admin_fin_suite_supplement_drift",
    descKey: "admin_fin_suite_supplement_drift_desc",
  },
  {
    id: "region-vault",
    href: "/admin/region-vault",
    titleKey: "admin_fin_suite_supplement_vault",
    descKey: "admin_fin_suite_supplement_vault_desc",
  },
  {
    id: "indexer",
    href: "/admin/indexer",
    titleKey: "admin_fin_suite_supplement_indexer",
    descKey: "admin_fin_suite_supplement_indexer_desc",
  },
  {
    id: "reconcile-reports",
    href: "/admin/indexer/reconcile-reports",
    titleKey: "admin_fin_suite_supplement_reconcile_reports",
    descKey: "admin_fin_suite_supplement_reconcile_reports_desc",
  },
  {
    id: "vacancy-ledger-ops",
    href: "/admin/vacancy-ledger",
    titleKey: "admin_fin_suite_supplement_vacancy_ledger_ops",
    descKey: "admin_fin_suite_supplement_vacancy_ledger_ops_desc",
  },
  {
    id: "observability",
    href: "/admin/observability",
    titleKey: "admin_fin_suite_supplement_observability",
    descKey: "admin_fin_suite_supplement_observability_desc",
  },
  {
    id: "trust-growth",
    href: "/admin/trust-growth",
    titleKey: "admin_fin_suite_supplement_trust_growth",
    descKey: "admin_fin_suite_supplement_trust_growth_desc",
  },
  {
    id: "alert-incidents",
    href: "/admin/alerts/incidents",
    titleKey: "admin_fin_suite_supplement_alert_incidents",
    descKey: "admin_fin_suite_supplement_alert_incidents_desc",
  },
] as const;
