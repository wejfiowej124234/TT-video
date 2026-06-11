import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";

/** 治理组 · 侧栏 / 顶栏 SSOT（含 trust-growth）。 */
export const ADMIN_SHELL_GOVERNANCE_NAV_LINKS: readonly AdminShellNavLinkDef[] = [
  { href: "/admin/cross-check", labelKey: "admin_shell_nav_cross_check", permission: ADMIN_PERM.READ },
  { href: "/admin/drift-summary", labelKey: "admin_shell_nav_drift_summary", permission: ADMIN_PERM.READ },
  {
    href: "/admin/governance/execution-uat",
    labelKey: "admin_governance_execution_uat_title",
    permission: ADMIN_PERM.READ,
    matchPrefix: "/admin/governance/execution-uat",
  },
  {
    href: "/admin/trust-growth",
    labelKey: "admin_shell_nav_trust_growth",
    permission: ADMIN_PERM.TRUST_GROWTH_WRITE,
    matchPrefix: "/admin/trust-growth",
  },
] as const;
