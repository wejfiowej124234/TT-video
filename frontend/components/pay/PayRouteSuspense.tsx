"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

/** `/pay` 内层使用 `useSearchParams`（orderId）；须在 Suspense 内（Next 15 · 07 §5.1） */
export function PayRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-main p-8"
      aria-label={t("pay_pageTitle")}
    >
      <LoadingText />
      <ProductCrossNav
        ariaLabelKey="pay_relatedNav_aria"
        showGuides
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}

export function PayRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PayRouteSuspenseFallback />}>{children}</Suspense>;
}
