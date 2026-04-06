"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { marketCyanInlineLinkFocusClasses } from "@/lib/travelLinkFocus";

/** `/guides/[id]` 内层使用 `useParams`；须在 Suspense 内（Next 15 · 07 §5.1） */
export function GuideDetailRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center gap-6 p-8" aria-label={t("guideDetail_title")}>
      <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <LoadingText />
        <ProductCrossNav
          ariaLabelKey="guide_detail_relatedNav_aria"
          showGuides
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline ${marketCyanInlineLinkFocusClasses}`}
          separatorClassName="text-slate-500"
        />
      </div>
    </main>
  );
}

export function GuideDetailRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<GuideDetailRouteSuspenseFallback />}>{children}</Suspense>;
}
