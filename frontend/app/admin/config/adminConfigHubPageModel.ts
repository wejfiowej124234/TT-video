import { ADMIN_PLATFORM_HUB_HEADER_LINKS } from "@/lib/admin/adminPlatformHubHeaderNav";

export type AdminConfigHubLink = { href: string; titleKey: string; descKey: string };

export const CONFIG_HUB_LINKS: AdminConfigHubLink[] = [
  { href: "/admin/flags", titleKey: "admin_flags_title", descKey: "admin_config_hub_desc_flags" },
  { href: "/admin/policies", titleKey: "admin_policies_title", descKey: "admin_config_hub_desc_policies" },
  { href: "/admin/secrets/metadata", titleKey: "admin_secrets_meta_title", descKey: "admin_config_hub_desc_secrets" },
  { href: "/admin/config/releases", titleKey: "admin_config_releases_title", descKey: "admin_config_hub_desc_releases" },
  { href: "/admin/lifecycle", titleKey: "admin_lifecycle_title", descKey: "admin_config_hub_desc_lifecycle" },
  { href: "/admin/api-versions", titleKey: "admin_api_versions_title", descKey: "admin_config_hub_desc_api_versions" },
  { href: "/admin/jobs", titleKey: "admin_jobs_title", descKey: "admin_config_hub_desc_jobs" },
  { href: "/admin/backup", titleKey: "admin_backup_title", descKey: "admin_config_hub_desc_backup" },
  { href: "/admin/approvals", titleKey: "admin_approvals_title", descKey: "admin_config_hub_desc_approvals" },
];

/** 配置/平台维护子页 · 折叠相关入口（COM-06 同型 · 非顶栏 link wall）。 */
export const CONFIG_PLATFORM_SUBNAV_LINKS: { href: string; labelKey: string }[] = [
  ...CONFIG_HUB_LINKS.map(({ href, titleKey }) => ({ href, labelKey: titleKey })),
  { href: "/admin/scheduler/jobs", labelKey: "admin_scheduler_jobs_title" },
  { href: "/admin/tenants/scopes", labelKey: "admin_tenant_scopes_title" },
  { href: "/admin/internal-tools/audits", labelKey: "admin_tool_audits_title" },
  { href: "/admin/media/signed-url-tokens", labelKey: "admin_media_signed_url_tokens_title" },
  { href: "/admin/media/access-logs", labelKey: "admin_media_access_logs_title" },
  { href: "/admin/observability", labelKey: "admin_observability_title" },
];

const CONFIG_HUB_CARD_HREFS = new Set(CONFIG_HUB_LINKS.map((l) => l.href));

function dedupeHubRelatedLinks(links: { href: string; labelKey: string }[]) {
  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
}

/** 配置枢纽 · 折叠区（不含首屏卡片重复项 · 交叉域 + 扩展维护页）。 */
export const CONFIG_HUB_RELATED_FOLD_LINKS = dedupeHubRelatedLinks([
  ...ADMIN_PLATFORM_HUB_HEADER_LINKS.filter(
    (l) =>
      l.href !== "/admin/config" &&
      l.href !== "/admin/inbox" &&
      l.href !== "/admin" &&
      !CONFIG_HUB_CARD_HREFS.has(l.href),
  ),
  ...CONFIG_PLATFORM_SUBNAV_LINKS.filter(
    (l) => l.href !== "/admin/config" && !CONFIG_HUB_CARD_HREFS.has(l.href),
  ),
]);

/** 合规枢纽 · 折叠交叉入口。 */
export const COMPLIANCE_HUB_RELATED_FOLD_LINKS: { href: string; labelKey: string }[] = [
  { href: "/admin/compliance/requests", labelKey: "admin_compliance_hub_dsar_list" },
  ...ADMIN_PLATFORM_HUB_HEADER_LINKS.filter(
    (l) => l.href !== "/admin/compliance" && l.href !== "/admin/inbox" && l.href !== "/admin",
  ),
  { href: "/admin/permissions", labelKey: "admin_shell_nav_permissions" },
];
