import { ME_SETTINGS_PRIVACY_PATH } from "@/lib/me/meSettingsL5";
import { meSecurityHref } from "@/lib/me/meSecurityL5";
import { meSettingsNavExtensionHref } from "@/lib/me/meSettingsExtensionContext";

export type MeSettingsSectionId = "account" | "travel" | "support" | "privacy" | "general";

/** Hub 默认折叠的分组（首屏聚焦账号 / 旅行 / 帮助） */
export const ME_SETTINGS_HUB_COLLAPSED_SECTIONS: readonly MeSettingsSectionId[] = [
  "privacy",
  "general",
] as const;

export type MeSettingsNavItem = {
  id: string;
  iconId: string;
  labelKey: string;
  descKey?: string;
  href?: string;
  /** 站外或营销文档页：新标签打开 */
  external?: boolean;
  /** 无跳转：说明行（如顶栏「我的」指引） */
  staticOnly?: boolean;
  comingSoon?: boolean;
  /** 可进入子页，但部分能力未开放（显示 Soon 徽章） */
  partialSoon?: boolean;
};

export type MeSettingsNavSection = {
  id: MeSettingsSectionId;
  labelKey: string;
  /** 组标题下说明（i18n key） */
  hintKey?: string;
  items: readonly MeSettingsNavItem[];
};

const BASE_SECTIONS: readonly MeSettingsNavSection[] = [
  {
    id: "account",
    labelKey: "me_settings_section_account_security",
    hintKey: "me_settings_section_account_security_hint",
    items: [
      {
        id: "password",
        iconId: "password",
        labelKey: "me_settings_item_password",
        descKey: "me_settings_desc_password",
        href: "/me/password",
      },
      {
        id: "security",
        iconId: "shield",
        labelKey: "me_security_center",
        descKey: "me_settings_desc_security",
        href: "/me/security",
      },
    ],
  },
  {
    id: "travel",
    labelKey: "me_settings_section_travel",
    hintKey: "me_settings_section_travel_hint",
    items: [
      {
        id: "disputes",
        iconId: "reports",
        labelKey: "me_settings_item_disputes",
        descKey: "me_settings_desc_disputes",
        href: meSettingsNavExtensionHref("/disputes"),
      },
      {
        id: "wallet",
        iconId: "wallet",
        labelKey: "me_settings_item_wallet",
        descKey: "me_settings_desc_wallet_verify",
        href: meSecurityHref("wallet"),
      },
    ],
  },
  {
    id: "support",
    labelKey: "me_settings_section_support",
    hintKey: "me_settings_section_support_hint",
    items: [
      {
        id: "feedback",
        iconId: "feedback",
        labelKey: "me_link_feedback",
        descKey: "me_settings_desc_feedback",
        href: "/community/feedback?from=settings",
      },
    ],
  },
  {
    id: "privacy",
    labelKey: "me_settings_section_privacy",
    hintKey: "me_settings_section_privacy_hint",
    items: [
      {
        id: "privacy_hub",
        iconId: "privacy",
        labelKey: "me_settings_item_privacy_hub",
        descKey: "me_settings_desc_privacy_hub",
        href: "/me/settings/privacy",
      },
      {
        id: "community_visibility",
        iconId: "profile",
        labelKey: "me_settings_item_community_visibility",
        descKey: "me_settings_desc_community_visibility",
        href: ME_SETTINGS_PRIVACY_PATH,
      },
      {
        id: "privacy",
        iconId: "legal",
        labelKey: "privacy_title",
        descKey: "me_settings_desc_privacy",
        href: meSettingsNavExtensionHref("/privacy"),
      },
      {
        id: "terms",
        iconId: "legal",
        labelKey: "terms_title",
        descKey: "me_settings_desc_terms",
        href: meSettingsNavExtensionHref("/terms"),
      },
      {
        id: "guidelines",
        iconId: "legal",
        labelKey: "me_settings_item_community_guidelines",
        descKey: "me_settings_desc_guidelines",
        href: meSettingsNavExtensionHref("/terms/community-guidelines"),
      },
      {
        id: "notification_prefs",
        iconId: "bell",
        labelKey: "me_settings_item_notification_prefs",
        descKey: "me_settings_desc_notification_prefs",
        href: "/me/settings/notifications-prefs",
      },
      {
        id: "security_events",
        iconId: "shield",
        labelKey: "me_settings_item_security_events",
        descKey: "me_settings_desc_security_events_audit",
        href: meSecurityHref("notifications"),
      },
    ],
  },
  {
    id: "general",
    labelKey: "me_settings_section_general",
    items: [
      {
        id: "language",
        iconId: "language",
        labelKey: "me_settings_item_language",
        descKey: "me_settings_desc_language_picker",
        href: "/me/settings/language",
      },
      {
        id: "data_rights",
        iconId: "privacy",
        labelKey: "me_settings_item_data_rights",
        descKey: "me_settings_desc_data_rights",
        href: "/me/settings/data",
      },
      {
        id: "help",
        iconId: "help",
        labelKey: "help_title",
        descKey: "me_settings_desc_help",
        href: meSettingsNavExtensionHref("/help"),
      },
      {
        id: "trust",
        iconId: "trust",
        labelKey: "trust_nav_short",
        descKey: "me_settings_desc_trust",
        href: meSettingsNavExtensionHref("/trust"),
      },
    ],
  },
] as const;

const GUIDE_HUB_ITEM: MeSettingsNavItem = {
  id: "guide_hub",
  iconId: "guide",
  labelKey: "guide_dashboard_title",
  descKey: "me_settings_desc_guide",
  href: meSettingsNavExtensionHref("/guide"),
};

export function meSettingsNavSections(opts?: {
  showGuideHub?: boolean;
}): readonly MeSettingsNavSection[] {
  const showGuide = opts?.showGuideHub === true;

  return BASE_SECTIONS.map((section) => {
    if (section.id === "travel" && showGuide) {
      const items = [...section.items];
      items.unshift(GUIDE_HUB_ITEM);
      return { ...section, items };
    }
    return section;
  });
}

export function meSettingsHubSectionDefaultCollapsed(sectionId: MeSettingsSectionId): boolean {
  return ME_SETTINGS_HUB_COLLAPSED_SECTIONS.includes(sectionId);
}
