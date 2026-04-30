"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 治理子页：`useSearchParams` / `useParams` 须在 Suspense 内（Next 15） */
function GovernanceSearchParamsRouteSuspenseFallback({
  pageTitleKey,
  introKey,
}: {
  pageTitleKey: string;
  introKey?: string;
}) {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl p-8" aria-label={t(pageTitleKey)}>
      <h1 className="text-h3 font-semibold text-ink-900">{t(pageTitleKey)}</h1>
      {introKey ? <p className="mt-2 text-body text-ink-600">{t(introKey)}</p> : null}
      <GovernanceTargetNotice className="mt-4" />
      <nav className="mt-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance/proposals"
          className={`${touchTargetLink44Classes} inline-flex items-center text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_proposal_detail_back")}
        </Link>
      </nav>
      <div className="mt-6">
        <LoadingText />
      </div>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}

export function GovernanceSearchParamsRouteSuspense({
  pageTitleKey,
  introKey,
  children,
}: {
  pageTitleKey: string;
  introKey?: string;
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={<GovernanceSearchParamsRouteSuspenseFallback pageTitleKey={pageTitleKey} introKey={introKey} />}
    >
      {children}
    </Suspense>
  );
}
