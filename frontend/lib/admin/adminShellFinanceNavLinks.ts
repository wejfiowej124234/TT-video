import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";

/** 资金组 · 侧栏 / 顶栏 / 七件套枢纽并集 SSOT。 */
export const ADMIN_SHELL_FINANCE_NAV_LINKS: readonly AdminShellNavLinkDef[] = [
  {
    href: "/admin/finance-suite",
    labelKey: "admin_shell_nav_finance_suite",
    permission: ADMIN_PERM.FINANCE_READ,
    activeExact: true,
    matchPrefix: "/admin/finance-suite",
  },
  {
    href: "/admin/finance-reconciliation",
    labelKey: "admin_shell_nav_finance_reconciliation",
    permission: ADMIN_PERM.FINANCE_READ,
    matchPrefix: "/admin/finance-reconciliation",
  },
  { href: "/admin/finance", labelKey: "admin_finance_title", permission: ADMIN_PERM.FINANCE_READ },
  { href: "/admin/fee-router", labelKey: "admin_fee_router_title", permission: ADMIN_PERM.FINANCE_READ },
  { href: "/admin/region-vault", labelKey: "admin_region_vault_title", permission: ADMIN_PERM.FINANCE_READ },
  {
    href: "/admin/region-share/reconcile",
    labelKey: "admin_region_share_reconcile_title",
    permission: ADMIN_PERM.FINANCE_READ,
    matchPrefix: "/admin/region-share/reconcile",
  },
  {
    href: "/admin/indexer",
    labelKey: "admin_indexer_title",
    permission: ADMIN_PERM.READ,
    matchPrefix: "/admin/indexer",
  },
  {
    href: "/admin/indexer/reconcile-reports",
    labelKey: "admin_indexer_reconcile_reports_title",
    permission: ADMIN_PERM.READ,
  },
  {
    href: "/admin/vacancy-ledger",
    labelKey: "admin_shell_nav_vacancy_ledger_ops",
    permission: ADMIN_PERM.FINANCE_READ,
    matchPrefix: "/admin/vacancy-ledger",
  },
  {
    href: "/admin/alerts/incidents",
    labelKey: "admin_alert_incident_hub_title",
    permission: ADMIN_PERM.READ,
    matchPrefix: "/admin/alerts/incidents",
  },
] as const;
