import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";

/** P2 Official Ops Center · 侧栏 SSOT（101 v1.1.0 · S1）。 */
export const ADMIN_SHELL_OFFICIAL_OPS_NAV_LINKS: readonly AdminShellNavLinkDef[] = [
  { href: "/admin/official", labelKey: "admin_shell_nav_official_hub", permission: ADMIN_PERM.OFFICIAL_READ, activeExact: true },
  { href: "/admin/official/accounts", labelKey: "admin_shell_nav_official_accounts", permission: ADMIN_PERM.OFFICIAL_READ },
  {
    href: "/admin/official/itinerary-templates",
    labelKey: "admin_shell_nav_official_templates",
    permission: ADMIN_PERM.OFFICIAL_READ,
  },
  { href: "/admin/official/guides", labelKey: "admin_shell_nav_official_guides", permission: ADMIN_PERM.OFFICIAL_READ },
  { href: "/admin/official/cold-start", labelKey: "admin_shell_nav_official_cold_start", permission: ADMIN_PERM.OFFICIAL_READ },
] as const;
