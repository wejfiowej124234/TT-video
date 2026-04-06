"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

/** `/orders/new` 内层使用 `useSearchParams`（guide_id）；须在 Suspense 内（Next 15 · 07 §5.1 / 53） */
export function OrdersNewRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg-main p-8"
      aria-label={t("orders_createTitle")}
    >
      <LoadingText />
      <ProductCrossNav
        ariaLabelKey="orders_new_relatedNav_aria"
        showGuides
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}

export function OrdersNewRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<OrdersNewRouteSuspenseFallback />}>{children}</Suspense>;
}
