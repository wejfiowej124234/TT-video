import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";

/** P1 Content Center · 侧栏 SSOT（101 v1.1.0 · S1）。 */
export const ADMIN_SHELL_CONTENT_NAV_LINKS: readonly AdminShellNavLinkDef[] = [
  { href: "/admin/content", labelKey: "admin_shell_nav_content_hub", permission: ADMIN_PERM.CONTENT_READ, activeExact: true },
  { href: "/admin/content/countries", labelKey: "admin_shell_nav_content_countries", permission: ADMIN_PERM.CONTENT_READ },
  { href: "/admin/content/cities", labelKey: "admin_shell_nav_content_cities", permission: ADMIN_PERM.CONTENT_READ },
  {
    href: "/admin/content/pois?type=attraction",
    labelKey: "admin_shell_nav_content_pois",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  { href: "/admin/content/pricing", labelKey: "admin_shell_nav_content_pricing", permission: ADMIN_PERM.CONTENT_READ },
  {
    href: "/admin/content/hotel-tiers",
    labelKey: "admin_shell_nav_content_hotel_tiers",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  {
    href: "/admin/content/transport-region-rules",
    labelKey: "admin_shell_nav_content_transport_rules",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  {
    href: "/admin/content/intercity-routes",
    labelKey: "admin_shell_nav_content_routes",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  {
    href: "/admin/content/media-assets",
    labelKey: "admin_shell_nav_content_media",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  {
    href: "/admin/content/landing-ambient",
    labelKey: "admin_shell_nav_content_landing_ambient",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  { href: "/admin/content/poi-images", labelKey: "admin_shell_nav_content_poi_images", permission: ADMIN_PERM.CONTENT_READ },
  {
    href: "/admin/content/publish-queue",
    labelKey: "admin_shell_nav_content_publish_queue",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  {
    href: "/admin/content/revisions",
    labelKey: "admin_shell_nav_content_revisions",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  {
    href: "/admin/content/import-operations",
    labelKey: "admin_shell_nav_content_import_ops",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  {
    href: "/admin/content/catalog-dashboard",
    labelKey: "admin_shell_nav_content_catalog_dashboard",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  {
    href: "/admin/content/geo-validation",
    labelKey: "admin_shell_nav_content_geo_validation",
    permission: ADMIN_PERM.CONTENT_READ,
  },
  {
    href: "/admin/content/country-market",
    labelKey: "admin_shell_nav_content_country_market",
    permission: ADMIN_PERM.CONTENT_READ,
  },
] as const;
