"use client";

import Link from "next/link";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import GuideRegisterIntroBanners from "./GuideRegisterIntroBanners";
import { guideRegCallout, guideRegFocusRing, guideRegLink } from "./guideRegisterUiClasses";

/** 合并首屏说明，减少横幅堆叠（L5 信息密度）。Owner DELETE KYC — 不再展示 KYC 门闸横幅。 */
export default function GuideRegisterContextBanners({
  t,
  pendingIdPhoto,
  pendingLangCert,
  sessionDraftRestored,
}: {
  t: (key: string) => string;
  pendingIdPhoto: string | null;
  pendingLangCert: string | null;
  sessionDraftRestored: boolean;
}) {
  return (
    <details className={`mb-4 ${guideRegCallout}`}>
      <summary className="cursor-pointer list-none text-small font-semibold text-slate-200">
        {t("guideRegister_contextSummary")}
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <TrustGrowthMomentBanner
          moment="guide_apply"
          surface="l5"
          preferCollapsedSummary
          titleOnlyCollapsedSummary
        />
        <GuideRegisterIntroBanners
          pendingIdPhoto={pendingIdPhoto}
          pendingLangCert={pendingLangCert}
          sessionDraftRestored={sessionDraftRestored}
          t={t}
          compact
        />
        <p className="text-meta text-slate-400/90">
          <Link href="/me/security" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
            {t("guideRegister_didAboutTitle")}
          </Link>
        </p>
      </div>
    </details>
  );
}
