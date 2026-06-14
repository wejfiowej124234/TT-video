"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { COMMUNITY_FEED_PATH } from "@/lib/auth/postAuthReturnPath";
import { ME_SETTINGS_HUB_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { IDENTITY_HUB_HREF } from "@/lib/workspace/workspaceIdentityModel";

export type MeSettingsL5FooterTarget = "community" | "settings" | "identities" | "guide";

const FOOTER_TARGET_CONFIG: Record<
  MeSettingsL5FooterTarget,
  { href: string; labelKey: string }
> = {
  community: { href: COMMUNITY_FEED_PATH, labelKey: "me_settings_footer_back_community" },
  settings: { href: ME_SETTINGS_HUB_PATH, labelKey: "me_settings_back_hub" },
  identities: { href: IDENTITY_HUB_HREF, labelKey: "me_guide_profile_back_identities" },
  guide: { href: "/guide", labelKey: "me_settings_footer_back_guide_workbench" },
};

/** 设置 / 工作台底栏：单条回链（避免与顶栏重复） */
export function MeSettingsL5MinimalFooter({ target = "community" }: { target?: MeSettingsL5FooterTarget }) {
  const { t } = useTranslation();
  const { href, labelKey } = FOOTER_TARGET_CONFIG[target];
  const linkClass = `${touchTargetLink44Classes} inline-flex items-center justify-center text-small font-semibold !text-ref-sun/85 underline underline-offset-4 decoration-ref-sun/40 hover:!text-[#fde9a8] hover:decoration-ref-sun/65 transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`;

  return (
    <footer className={TT_ME_SETTINGS_L5.footerMinimal}>
      <Link href={href} className={linkClass}>
        {t(labelKey)}
      </Link>
    </footer>
  );
}
