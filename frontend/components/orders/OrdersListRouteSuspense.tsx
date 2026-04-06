"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

/** `/orders` 内层使用 `useSearchParams`（如 `book_guide`）；须在 Suspense 内（Next 15 · 07 §5.1） */
export function OrdersListRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg-main p-8"
      aria-label={t("orders_myOrders")}
    >
      <LoadingText />
      <ProductCrossNav
        ariaLabelKey="orders_list_relatedNav_aria"
        showGuides
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}

export function OrdersListRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<OrdersListRouteSuspenseFallback />}>{children}</Suspense>;
}
