"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ME_IDENTITIES_STEWARD_SETTINGS_HREF } from "@/lib/me/meIdentitiesCoreCardModel";
import { IDENTITY_HUB_HREF, STEWARD_GOVERNANCE_HREF } from "@/lib/workspace/workspaceIdentityModel";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const LINK =
  `${touchTargetLink44Classes} inline-flex items-center text-small font-medium text-ref-sun/75 underline decoration-ref-sun/35 underline-offset-4 hover:text-[#fde9a8] hover:decoration-ref-sun/55 transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`;

/** 主理人工作台底栏交叉链（对齐 `/provider` · `/guide`） */
export function StewardWorkbenchL5CrossNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 border-t border-ref-sun/12 pt-6 text-meta"
      aria-label={t("steward_workbench_crossNav_aria")}
      data-tt-steward-workbench-l5-cross-nav="1"
    >
      <Link href="/" className={LINK}>
        {t("itin_nav_home")}
      </Link>
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link href={STEWARD_GOVERNANCE_HREF} className={LINK} data-tt-steward-cross-nav-governance-hub="1">
        {t("steward_workbench_open_governance_hub")}
      </Link>
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link href="/governance/fee-routes" className={LINK}>
        {t("governance_fee_routes_title")}
      </Link>
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link href={ME_IDENTITIES_STEWARD_SETTINGS_HREF} className={LINK} data-tt-steward-cross-nav-settings="1">
        {t("steward_workbench_link_settings")}
      </Link>
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link href={IDENTITY_HUB_HREF} className={LINK} data-tt-steward-cross-nav-identities="1">
        {t("steward_workbench_footer_back_hub")}
      </Link>
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link href="/help" className={LINK}>
        {t("help_title")}
      </Link>
    </nav>
  );
}
