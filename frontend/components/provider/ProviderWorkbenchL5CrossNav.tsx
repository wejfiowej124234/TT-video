"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProviderWorkbenchTrustAdmissionLink } from "@/components/provider/ProviderWorkbenchAdmissionLinks";
import { MERCHANT_PUBLIC_HREF } from "@/lib/workspace/workspaceIdentityModel";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const LINK =
  `${touchTargetLink44Classes} inline-flex items-center text-small font-medium text-ref-sun/75 underline decoration-ref-sun/35 underline-offset-4 hover:text-[#fde9a8] hover:decoration-ref-sun/55 transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`;

export type ProviderWorkbenchL5CrossNavProps = {
  /** 发布未解锁时门闸区已含准入链，底栏省略以免重复 */
  showTrustLink?: boolean;
};

/** `/provider` 工作台底栏（公开橱窗仅作补充链） */
export function ProviderWorkbenchL5CrossNav({ showTrustLink = true }: ProviderWorkbenchL5CrossNavProps) {
  const { t } = useTranslation();

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 border-t border-ref-sun/12 pt-6 text-meta"
      aria-label={t("provider_workbench_crossNav_aria")}
      data-tt-provider-workbench-l5-cross-nav="1"
    >
      <Link href="/" className={LINK}>
        {t("itin_nav_home")}
      </Link>
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link href="/market" className={LINK}>
        {t("header_market")}
      </Link>
      <span className="text-ref-sun/25" aria-hidden>
        ·
      </span>
      <Link
        href={MERCHANT_PUBLIC_HREF}
        className={LINK}
        data-tt-provider-workbench-cross-nav-showcase="1"
      >
        {t("provider_workbench_crossNav_showcase")}
      </Link>
      {showTrustLink ? (
        <>
          <span className="text-ref-sun/25" aria-hidden>
            ·
          </span>
          <ProviderWorkbenchTrustAdmissionLink t={t} variant="footer" />
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
