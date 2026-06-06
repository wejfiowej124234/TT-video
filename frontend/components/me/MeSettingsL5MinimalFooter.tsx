"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { COMMUNITY_FEED_PATH } from "@/lib/auth/postAuthReturnPath";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 设置 Hub 底栏：单条回社区资料（避免与列表重复） */
export function MeSettingsL5MinimalFooter() {
  const { t } = useTranslation();
  const linkClass = `${touchTargetLink44Classes} inline-flex items-center justify-center text-small font-semibold !text-ref-sun/85 underline underline-offset-4 decoration-ref-sun/40 hover:!text-[#fde9a8] hover:decoration-ref-sun/65 transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`;

  return (
    <footer className={TT_ME_SETTINGS_L5.footerMinimal}>
      <Link href={COMMUNITY_FEED_PATH} className={linkClass}>
        {t("me_settings_footer_back_community")}
      </Link>
    </footer>
  );
}
