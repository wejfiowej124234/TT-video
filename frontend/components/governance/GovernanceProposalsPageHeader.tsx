"use client";

import Link from "next/link";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type Props = {
  pageTitleId: string;
  kicker: string;
  title: string;
  lead: string;
  createCtaLabel?: string;
  createCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

/** 治理提案 · Hero（暖金框 + 深色玻璃 · 同源 `/orders` 页头） */
export function GovernanceProposalsPageHeader({
  pageTitleId,
  kicker,
  title,
  lead,
  createCtaLabel,
  createCtaHref = "/governance/proposals/new",
  secondaryCtaLabel,
  secondaryCtaHref = "/governance/delegate",
}: Props) {
  return (
    <header className={GOV_PROPOSALS_L5.pageHeaderWrap}>
      <div className={GOV_PROPOSALS_L5.heroFrame}>
        <div className={`relative overflow-hidden ${GOV_PROPOSALS_L5.heroInner} space-y-3`}>
          <div className={GOV_PROPOSALS_L5.heroInnerGlow} aria-hidden />
          <div className="relative z-[1] space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className={GOV_PROPOSALS_L5.heroKicker}>{kicker}</p>
                <h1 id={pageTitleId} className={GOV_PROPOSALS_L5.heroTitle}>
                  {title}
                </h1>
                <p className={GOV_PROPOSALS_L5.heroLead}>{lead}</p>
              </div>
              {createCtaLabel ? (
                <div className="hidden w-full shrink-0 flex-col gap-2 sm:flex sm:w-auto lg:mt-6">
                  <Link
                    href={createCtaHref}
                    data-tt-governance-proposals-create-cta="primary"
                    className={`${GOV_PROPOSALS_L5.createCta} w-full sm:w-auto`}
                  >
                    {createCtaLabel}
                  </Link>
                  {secondaryCtaLabel ? (
                    <Link
                      href={secondaryCtaHref}
                      data-tt-governance-proposals-create-cta="secondary"
                      className={`${touchTargetLink44Classes} inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border border-white/14 bg-slate-950/60 px-4 py-2 text-small font-medium text-slate-200 hover:border-ref-sun/35 hover:bg-slate-900/80 sm:w-auto ${GOV_PROPOSALS_L5.linkFocus}`}
                    >
                      {secondaryCtaLabel}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
            {createCtaLabel ? (
              <div className="flex flex-col gap-2 sm:hidden">
                <Link href={createCtaHref} className={`${GOV_PROPOSALS_L5.createCta} w-full`}>
                  {createCtaLabel}
                </Link>
                {secondaryCtaLabel ? (
                  <Link
                    href={secondaryCtaHref}
                    className={`${touchTargetLink44Classes} inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] border border-white/14 bg-slate-950/60 px-4 py-2 text-small font-medium text-slate-200 hover:border-ref-sun/35 hover:bg-slate-900/80 ${GOV_PROPOSALS_L5.linkFocus}`}
                  >
                    {secondaryCtaLabel}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div aria-hidden className="px-1">
        <div className={GOV_PROPOSALS_L5.bridgeLine} />
      </div>
    </header>
  );
}
