"use client";

import Link from "next/link";

import { FOCUS_RING } from "@/components/me/constants";
import { GUIDE_IDENTITY_STAKING_HREF } from "@/lib/guide/guideIdentityStakingNav";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export type GuideIdentityStakingBannerProps = {
  t: (key: string) => string;
};

/**
 * `/guide` 工作台：审核已通过、尚未身份质押时展示（唯一「前往质押」主 CTA）。
 */
export default function GuideIdentityStakingBanner({ t }: GuideIdentityStakingBannerProps) {
  return (
    <div
      role="region"
      aria-label={t("guide_staking_banner_aria")}
      className="mb-4 rounded-[var(--radius-md)] border border-cyan-400/35 bg-cyan-500/10 px-4 py-3"
      data-tt-guide-identity-staking-banner="1"
    >
      <p className="text-body font-semibold text-slate-100">{t("guide_staking_banner_title")}</p>
      <p className="mt-1 text-meta text-slate-300">{t("guide_staking_banner_body")}</p>
      <div className="mt-3">
        <Link
          href={GUIDE_IDENTITY_STAKING_HREF}
          className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/25 px-5 py-2 text-small font-semibold text-cyan-100 hover:bg-cyan-500/35 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
          data-tt-guide-go-identity-staking="1"
        >
          {t("guide_staking_banner_cta")}
        </Link>
      </div>
    </div>
  );
}
