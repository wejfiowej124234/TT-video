"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import WarmRouteFieldBackdrop from "@/components/shell/WarmRouteFieldBackdrop";

/** `/did-rank` 内层使用 `useSearchParams`（period 等）；须在 Suspense 内（Next 15 · 07 §5.3 / 30） */
export function DidRankRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center gap-6 overflow-hidden bg-[#14100d] p-8"
      aria-label={t("didRank_title")}
    >
      <WarmRouteFieldBackdrop />
      <LoadingText className="relative z-10 !text-white/90" />
      <ProductCrossNav
        ariaLabelKey="did_rank_relatedNav_aria"
        showGuides
        className="relative z-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
        linkClassName="inline-flex min-h-[44px] items-center justify-center text-ref-sun hover:text-ref-sun underline motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-coral/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100d] rounded-[var(--radius-sm)] px-0.5"
        separatorClassName="text-white/35"
      />
    </main>
  );
}

export function DidRankRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<DidRankRouteSuspenseFallback />}>{children}</Suspense>;
}
