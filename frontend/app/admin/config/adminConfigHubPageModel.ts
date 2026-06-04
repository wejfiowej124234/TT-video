export type AdminConfigHubLink = { href: string; titleKey: string; descKey: string };

export const CONFIG_HUB_LINKS: AdminConfigHubLink[] = [
  { href: "/admin/flags", titleKey: "admin_flags_title", descKey: "admin_config_hub_desc_flags" },
  { href: "/admin/secrets/metadata", titleKey: "admin_secrets_meta_title", descKey: "admin_config_hub_desc_secrets" },
  { href: "/admin/config/releases", titleKey: "admin_config_releases_title", descKey: "admin_config_hub_desc_releases" },
  { href: "/admin/jobs", titleKey: "admin_jobs_title", descKey: "admin_config_hub_desc_jobs" },
  { href: "/admin/approvals", titleKey: "admin_approvals_title", descKey: "admin_config_hub_desc_approvals" },
];
