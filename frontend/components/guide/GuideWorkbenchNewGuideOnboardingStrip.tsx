"use client";

import Link from "next/link";
import type { MeTrustSummary } from "@/lib/meTrust";
import { resolveGuideWorkbenchTrustCta } from "@/lib/guide/guideWorkbenchTrustCta";
import { FOCUS_RING } from "@/components/me/constants";
import {
  GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "@/lib/guide/guideWorkbenchL5ClosureSprintModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchNewGuideOnboardingStripProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  trust: MeTrustSummary;
};

/** 新向导：合并 KYC + 首单引导，避免信任快照与空收件箱重复焦虑（① · L5） */
export default function GuideWorkbenchNewGuideOnboardingStrip({
  t,
  trust,
}: GuideWorkbenchNewGuideOnboardingStripProps) {
  const kycCta = resolveGuideWorkbenchTrustCta(trust);

  return (
    <section
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1 border border-ref-sun/25 bg-ref-sun/[0.06]`}
      aria-label={t("guide_workbench_new_guide_onboarding_aria")}
      data-tt-guide-workbench-new-guide-onboarding="1"
      data-tt-guide-workbench-l5-closure={GUIDE_WORKBENCH_PAGE_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={GUIDE_WORKBENCH_PAGE_L5_FROZEN_MARKER}
    >
      <h2 className={TT_WORKSPACE_L5.sectionTitle}>{t("guide_workbench_new_guide_onboarding_title")}</h2>
      <p className={`${TT_WORKSPACE_L5.sectionSubtitle} mt-1`}>{t("guide_workbench_new_guide_onboarding_body")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={kycCta.href} className={`${TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}>
          {t(kycCta.labelKey)}
        </Link>
        <Link
          href="#guide-workbench-profile-summary"
          className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}
          data-tt-guide-workbench-onboarding-profile-anchor="1"
        >
          {t("guide_workbench_new_guide_onboarding_profile_cta")}
        </Link>
      </div>
    </section>
  );
}
