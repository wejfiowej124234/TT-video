"use client";

import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import { guideRegCallout, guideRegFocusRing } from "@/app/guide/register/guideRegisterUiClasses";

/** 主理人申请首屏：信任条默认折叠，降低与表单任务竞争（同族 guide register L5 密度） */
export default function StewardRegisterContextBanners({ t }: { t: (key: string) => string }) {
  return (
    <details className={`mb-4 ${guideRegCallout}`} data-tt-steward-register-context-banners="1">
      <summary
        className={`cursor-pointer list-none text-small font-semibold text-slate-200 [&::-webkit-details-marker]:hidden ${guideRegFocusRing}`}
      >
        {t("stewardRegister_contextSummary")}
      </summary>
      <div className="mt-3">
        <TrustGrowthMomentBanner
          moment="steward_apply"
          surface="l5"
          preferCollapsedSummary
          titleOnlyCollapsedSummary
        />
      </div>
    </details>
  );
}
