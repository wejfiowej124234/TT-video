"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { ordersListL5MainDataAttrs, TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";

/** `/orders` 内层使用 `useSearchParams`（如 `book_guide`）；须在 Suspense 内（Next 15 · 07 §5.1） */
export function OrdersListRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className={`${TT_ORDERS_LIST_L5.pageShell} flex flex-col items-center justify-center gap-6 p-8`}
      aria-label={t("orders_myOrders")}
      {...ordersListL5MainDataAttrs()}
    >
      <div className={TT_ORDERS_LIST_L5.pageVignette} aria-hidden />
      <div className={TT_ORDERS_LIST_L5.ambient} aria-hidden />
      <div className={TT_ORDERS_LIST_L5.dotGrid} aria-hidden />
      <div className="relative z-[1]">
        <LoadingText />
      </div>
      <ProductCrossNav
        ariaLabelKey="orders_list_relatedNav_aria"
        showGuides
        linkClassName={TT_ORDERS_LIST_L5.crossNavLink}
        separatorClassName={TT_ORDERS_LIST_L5.crossNavSeparator}
        className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${TT_ORDERS_LIST_L5.metaText}`}
      />
    </main>
  );
}

export function OrdersListRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<OrdersListRouteSuspenseFallback />}>{children}</Suspense>;
}
