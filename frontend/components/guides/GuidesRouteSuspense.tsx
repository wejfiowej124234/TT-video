"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { GuideCardSkeleton } from "@/components/market/MarketSkeleton";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  marketCyanInlineLinkFocusClasses,
  touchTargetLink44Classes,
} from "@/lib/travelLinkFocus";

/** `/guides`：`useSearchParams` 须在 Suspense 内（Next 15 · 与 `MarketRouteSuspense` 同源约束） */
export function GuidesRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className="relative min-h-screen"
      aria-label={t("guides_title")}
      aria-busy="true"
      data-tt-guides-surface="route_suspense"
    >
      <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <header>
            <p className="text-small text-slate-300 mb-2">
              <Link
                href="/market"
                className={`${touchTargetLink44Classes} text-slate-300 hover:text-cyan-100 underline ${marketCyanInlineLinkFocusClasses}`}
              >
                {t("market_meta_title")}
              </Link>
              {" · "}
              <Link
                href="/"
                className={`${touchTargetLink44Classes} text-slate-300 hover:text-cyan-100 underline ${marketCyanInlineLinkFocusClasses}`}
              >
                {t("guides_navHome")}
              </Link>
            </p>
            <h1 className="text-h3 font-semibold text-white tracking-tight">{t("guides_title")}</h1>
            <p className="text-small text-slate-300 mt-1">{t("guides_desc")}</p>
          </header>
          <GuideCardSkeleton count={6} gridClass="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
          <footer className="mt-12 pt-8 border-t border-white/20">
            <ProductCrossNav
              ariaLabelKey="guides_relatedNav_aria"
              showGuides
              className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
              linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline ${marketCyanInlineLinkFocusClasses}`}
              separatorClassName="text-slate-400"
            />
          </footer>
        </div>
      </div>
    </main>
  );
}

export function GuidesRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<GuidesRouteSuspenseFallback />}>{children}</Suspense>;
}
