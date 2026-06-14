import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";

/** P3 Growth Center · 侧栏 SSOT（101 v1.1.0 · S1）。 */
export const ADMIN_SHELL_GROWTH_NAV_LINKS: readonly AdminShellNavLinkDef[] = [
  { href: "/admin/growth", labelKey: "admin_shell_nav_growth_hub", permission: ADMIN_PERM.GROWTH_READ, activeExact: true },
  {
    href: "/admin/growth/referral-codes",
    labelKey: "admin_shell_nav_growth_referral_codes",
    permission: ADMIN_PERM.GROWTH_READ,
  },
  { href: "/admin/growth/early-bird", labelKey: "admin_shell_nav_growth_early_bird", permission: ADMIN_PERM.GROWTH_READ },
  {
    href: "/admin/growth/airdrop-campaigns",
    labelKey: "admin_shell_nav_growth_airdrop",
    permission: ADMIN_PERM.GROWTH_READ,
  },
  { href: "/admin/growth/kol-center", labelKey: "admin_shell_nav_growth_kol", permission: ADMIN_PERM.GROWTH_READ },
  {
    href: "/admin/growth/reward-ledger",
    labelKey: "admin_shell_nav_growth_reward_ledger",
    permission: ADMIN_PERM.GROWTH_READ,
  },
  { href: "/admin/growth/anti-fraud", labelKey: "admin_shell_nav_growth_anti_fraud", permission: ADMIN_PERM.GROWTH_READ },
  { href: "/admin/growth/analytics", labelKey: "admin_shell_nav_growth_analytics", permission: ADMIN_PERM.GROWTH_READ },
  {
    href: "/admin/conversion-analytics",
    labelKey: "admin_shell_nav_conversion_analytics",
    permission: ADMIN_PERM.GROWTH_READ,
  },
] as const;
