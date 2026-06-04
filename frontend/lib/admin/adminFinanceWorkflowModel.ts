import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";

/** FIN-02 · ① 财务工作流步骤（partial 深度链 SSOT）。 */
export const ADMIN_FINANCE_WORKFLOW_STEPS = [
  {
    id: "reconciliation",
    titleKey: "admin_fin_workflow_reconciliation",
    descKey: "admin_fin_workflow_reconciliation_desc",
    href: adminFinancePartialDepthHref("/admin/finance-reconciliation", "reconciliation"),
    snapshotKey: null,
  },
  {
    id: "settlement",
    titleKey: "admin_fin_workflow_settlement",
    descKey: "admin_fin_workflow_settlement_desc",
    href: adminFinancePartialDepthHref("/admin/finance", "finance-summary"),
    snapshotKey: "settlementOrders" as const,
  },
  {
    id: "refunds",
    titleKey: "admin_fin_workflow_refunds",
    descKey: "admin_fin_workflow_refunds_desc",
    href: adminFinancePartialDepthHref("/admin/disputes", "refunds"),
    snapshotKey: "openDisputes" as const,
  },
  {
    id: "export",
    titleKey: "admin_fin_workflow_export",
    descKey: "admin_fin_workflow_export_desc",
    href: adminFinancePartialDepthHref("/admin/finance", "export"),
    snapshotKey: null,
  },
  {
    id: "cross-check",
    titleKey: "admin_fin_workflow_cross_check",
    descKey: "admin_fin_workflow_cross_check_desc",
    href: adminFinancePartialDepthHref("/admin/cross-check", "cross-check"),
    snapshotKey: "crossCheckSlots" as const,
  },
  {
    id: "fee-router",
    titleKey: "admin_fin_workflow_fee_router",
    descKey: "admin_fin_workflow_fee_router_desc",
    href: adminFinancePartialDepthHref("/admin/fee-router", "fee-router"),
    snapshotKey: null,
  },
  {
    id: "audit",
    titleKey: "admin_fin_workflow_audit",
    descKey: "admin_fin_workflow_audit_desc",
    href: adminFinancePartialDepthHref("/admin/audit", "audit"),
    snapshotKey: null,
  },
] as const;

export type AdminFinanceWorkflowSnapshotKey = NonNullable<
  (typeof ADMIN_FINANCE_WORKFLOW_STEPS)[number]["snapshotKey"]
>;

/** `fin_suite_module` query → 工作流 step `id`（partial 子页高亮 SSOT）。 */
export const ADMIN_FIN_SUITE_MODULE_TO_WORKFLOW_STEP: Record<string, string> = {
  reconciliation: "reconciliation",
  "finance-summary": "settlement",
  export: "export",
  refunds: "refunds",
  "cross-check": "cross-check",
  "fee-router": "fee-router",
  audit: "audit",
};

/** 七件套旁路 partial 深度（drift · region-vault）。 */
export const ADMIN_FINANCE_SUPPLEMENT_PARTIAL_MODULES = [
  {
    id: "drift",
    titleKey: "admin_fin_suite_supplement_drift",
    href: adminFinancePartialDepthHref("/admin/drift-summary", "drift"),
  },
  {
    id: "region-vault",
    titleKey: "admin_fin_suite_supplement_vault",
    href: adminFinancePartialDepthHref("/admin/region-vault", "region-vault"),
  },
] as const;
