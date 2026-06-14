"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { GUIDE_IDENTITY_STAKING_HREF } from "@/lib/guide/guideIdentityStakingNav";
import { GuideWorkbenchTrustAdmissionLink } from "@/components/guide/GuideWorkbenchTrustAdmissionLink";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const LINK =
  `${touchTargetLink44Classes} inline-flex items-center text-small font-medium text-ref-sun/75 underline decoration-ref-sun/35 underline-offset-4 hover:text-[#fde9a8] hover:decoration-ref-sun/55 transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`;

export type GuideWorkbenchL5CrossNavProps = {
  /** 质押门闸未过时顶区已含准入链，底栏省略以免重复 */
  showTrustLink?: boolean;
};

/** `/guide` 工作台底栏交叉链（与 `/staking` StakingL5CrossNav 对称） */
export function GuideWorkbenchL5CrossNav({ showTrustLink = true }: GuideWorkbenchL5CrossNavProps) {
  const { t } = useTranslation();

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 border-t border-ref-sun/12 pt-6 text-meta"
      aria-label={t("guide_workbench_crossNav_aria")}
      data-tt-guide-workbench-l5-cross-nav="1"
    >
      <Link href="/" className={LINK}>
        {t("itin_nav_home")}
      </Link>
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link href={GUIDE_IDENTITY_STAKING_HREF} className={LINK}>
        {t("staking_crossNav_guideStaking")}
      </Link>
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link href="/guides" className={LINK}>
        {t("nav_guides")}
      </Link>
      {showTrustLink ? (
        <>
          <span className="text-ref-sun/25" aria-hidden>
            ·
          </span>
          <GuideWorkbenchTrustAdmissionLink t={t} variant="footer" />
        </>
      ) : null}
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link href="/help" className={LINK}>
        {t("help_title")}
      </Link>
    </nav>
  );
}
