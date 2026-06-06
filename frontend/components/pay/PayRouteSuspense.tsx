"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  payHubFooterLinkClass,
  TT_PAY_HUB_INNER,
  TT_PAY_HUB_PAGE_SHELL,
  TT_PAY_HUB_ZONE,
} from "@/lib/pay/payHubL5";

/** `/pay` 内层使用 `useSearchParams`（orderId）；须在 Suspense 内（Next 15 · 07 §5.1） */
export function PayRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main
      className={TT_PAY_HUB_PAGE_SHELL}
      aria-label={t("pay_pageTitle")}
      role="status"
      aria-busy="true"
    >
      <div className={TT_PAY_HUB_INNER}>
        <div data-zone="order-protocol" className={TT_PAY_HUB_ZONE}>
          <div className="flex flex-col items-center justify-center gap-6 py-16">
            <LoadingText />
            <ProductCrossNav
              ariaLabelKey="pay_relatedNav_aria"
              showGuides
              className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400"
              linkClassName={`inline-flex min-h-[44px] items-center justify-center ${payHubFooterLinkClass}`}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export function PayRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PayRouteSuspenseFallback />}>{children}</Suspense>;
}
