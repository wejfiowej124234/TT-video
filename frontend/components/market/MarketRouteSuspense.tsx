"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import MarketAmbientBackdrop from "@/components/market/MarketAmbientBackdrop";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

/** `useMarketPage` → `useSearchParams`；须在 Suspense 内（Next 15 · 07 §5.3 / 29） */
export function MarketRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center gap-6 p-8"
      aria-label={t("market_hero_title")}
    >
      <MarketAmbientBackdrop />
      <div className="relative z-10 flex flex-col items-center gap-6">
      <LoadingText className="!text-white/90" />
      <ProductCrossNav
        ariaLabelKey="market_relatedNav_aria"
        showGuides
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
        linkClassName="inline-flex min-h-[44px] items-center justify-center text-ref-sun hover:text-ref-sun underline"
        separatorClassName="text-white/35"
      />
      </div>
    </main>
  );
}

export function MarketRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<MarketRouteSuspenseFallback />}>{children}</Suspense>;
}
