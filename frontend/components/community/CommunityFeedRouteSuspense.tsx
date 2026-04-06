"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

/** `CommunityFeedMain` → `useCommunityFeed` → `useSearchParams`；须在 Suspense 内（Next 15 · 07 §5.3B） */
export function CommunityFeedRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className="flex min-h-[50vh] max-w-4xl flex-col items-center justify-center gap-6 mx-auto px-4 py-8 pb-24 safe-area-pb"
      aria-label={t("community_title")}
    >
      <LoadingText />
      <ProductCrossNav
        ariaLabelKey="community_relatedNav_aria"
        showGuides
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400"
        linkClassName="inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline rounded-sm px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        separatorClassName="text-slate-500"
      />
    </main>
  );
}

export function CommunityFeedRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<CommunityFeedRouteSuspenseFallback />}>{children}</Suspense>;
}
