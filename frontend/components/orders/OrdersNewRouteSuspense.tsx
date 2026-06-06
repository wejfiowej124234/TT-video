"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { TT_ORDERS_NEW_L5 } from "@/lib/orders/ordersNewL5";

/** `/orders/new` 内层使用 `useSearchParams`（guide_id）；须在 Suspense 内（Next 15 · 07 §5.1 / 53） */
export function OrdersNewRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className={`${TT_ORDERS_NEW_L5.pageShell} flex flex-col items-center justify-center gap-6 p-8`}
      aria-label={t("orders_createTitle")}
      data-tt-orders-new-page="1"
      data-tt-orders-new-l5="l5"
    >
      <div className={TT_ORDERS_NEW_L5.pageVignette} aria-hidden />
      <div className={TT_ORDERS_NEW_L5.ambient} aria-hidden />
      <div className="relative z-[1] text-slate-200">
        <LoadingText />
      </div>
      <ProductCrossNav
        ariaLabelKey="orders_new_relatedNav_aria"
        showGuides
        className={`relative z-[1] ${TT_ORDERS_NEW_L5.crossNav} justify-center`}
        linkClassName={TT_ORDERS_NEW_L5.crossNavLink}
        separatorClassName={TT_ORDERS_NEW_L5.crossNavSeparator}
      />
    </main>
  );
}

export function OrdersNewRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<OrdersNewRouteSuspenseFallback />}>{children}</Suspense>;
}
