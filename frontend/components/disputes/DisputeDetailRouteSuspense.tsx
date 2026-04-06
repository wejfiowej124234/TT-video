"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

/** `/disputes/[id]` 内层使用 `useParams`；须在 Suspense 内（Next 15 · 07 §5.1） */
export function DisputeDetailRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg-main p-8"
      aria-label={t("dispute_detailTitle")}
    >
      <LoadingText />
      <ProductCrossNav
        ariaLabelKey="dispute_detail_relatedNav_aria"
        showGuides
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}

export function DisputeDetailRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<DisputeDetailRouteSuspenseFallback />}>{children}</Suspense>;
}
