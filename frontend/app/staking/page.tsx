"use client";

import Link from "next/link";
import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { StakingContractPanel } from "@/components/staking/StakingContractPanel";
import { StakingRegistryPanel } from "@/components/staking/StakingRegistryPanel";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { StakingStakePanel } from "@/components/staking/StakingStakePanel";
import { StakingWithdrawPanel } from "@/components/staking/StakingWithdrawPanel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** 07 Phase 4：向导质押说明与申请入口；无渐变炫光（13 资金/信任区）。 */
export default function StakingPage() {
  const { t } = useTranslation();
  const bodySectionId = useId();

  return (
    <main className="min-h-screen bg-bg-main text-ink-800" aria-label={t("staking_pageTitle")}>
      <div className="container max-w-2xl py-12 px-4">
        <header className="mb-8">
          <h1 className="text-h3 font-semibold tracking-tight text-ink-900">{t("staking_pageTitle")}</h1>
          <p className="mt-3 text-body text-ink-600 leading-relaxed">{t("staking_pageSubtitle")}</p>
        </header>

        <section
          className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft"
          aria-labelledby={bodySectionId}
        >
          <h2 id={bodySectionId} className="sr-only">
            {t("staking_pageTitle")}
          </h2>
          <p className="text-body text-ink-700 leading-relaxed">{t("staking_intro")}</p>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-body text-ink-700">
            <li>{t("staking_point1")}</li>
            <li>{t("staking_point2")}</li>
          </ul>

          <div className="mt-8">
            <Link
              href="/guide/register"
              className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] bg-trust-600 px-5 py-2.5 text-center text-small font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-trust-600 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
            >
              {t("staking_ctaApply")}
            </Link>
          </div>
        </section>

        <div className="mt-10 space-y-6">
          <StakingContractPanel pool="guide" />
          <StakingStakePanel pool="guide" />
          <StakingWithdrawPanel pool="guide" />
        </div>
        <div className="mt-10 space-y-6">
          <StakingContractPanel pool="provider" />
          <StakingStakePanel pool="provider" />
          <StakingWithdrawPanel pool="provider" />
        </div>
        <StakingRegistryPanel />

        <p className="mt-6 text-meta leading-relaxed text-ink-500" role="note">
          {t("staking_disclaimer")}
        </p>
        <ProductCrossNav ariaLabelKey="staking_relatedNav_aria" showGuides className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500" />
      </div>
    </main>
  );
}
