"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

/** `/itinerary/new` 内层使用 `useSearchParams`（fromOrder / guide_id）；须在 Suspense 内（Next 15 · 07 §5.2 / 80） */
export function ItineraryNewRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 bg-bg-main p-8"
      aria-label={t("itin_title")}
    >
      <LoadingText />
      <ProductCrossNav
        ariaLabelKey="itin_relatedNav_aria"
        showGuides
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}

export function ItineraryNewRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<ItineraryNewRouteSuspenseFallback />}>{children}</Suspense>;
}
