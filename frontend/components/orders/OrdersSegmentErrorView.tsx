"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { TT_MARKETING_ERROR_RETRY_BTN } from "@/lib/marketingUi";
import { ordersListL5MainDataAttrs, TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { ordersNewL5MainDataAttrs, TT_ORDERS_NEW_L5 } from "@/lib/orders/ordersNewL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type OrdersSegmentErrorViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
  segment: "orders" | "orders-new";
  boundaryMarker: string;
  retryMarker?: string;
};

/** `/orders` 与 `/orders/new` 路由段错误边界 · L5 暖色壳（①） */
export function OrdersSegmentErrorView({
  error,
  reset,
  segment,
  boundaryMarker,
  retryMarker,
}: OrdersSegmentErrorViewProps) {
  const { t } = useTranslation();
  const appErrorRetryHintId = useId();
  const isNew = segment === "orders-new";
  const shellClass = isNew ? TT_ORDERS_NEW_L5.createdShell : TT_ORDERS_LIST_L5.errorShell;
  const dataAttrs = isNew ? ordersNewL5MainDataAttrs() : ordersListL5MainDataAttrs();
  const titleClass = isNew ? TT_ORDERS_NEW_L5.title : TT_ORDERS_LIST_L5.errorTitle;
  const bodyClass = isNew ? TT_ORDERS_NEW_L5.bodyText : TT_ORDERS_LIST_L5.bodyText;
  const metaClass = isNew ? TT_ORDERS_NEW_L5.metaText : TT_ORDERS_LIST_L5.metaText;
  const linkClass = isNew ? TT_ORDERS_NEW_L5.inlineLink : TT_ORDERS_LIST_L5.crossNavLink;

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error(`Orders segment error (${segment}):`, error?.message);
    }
  }, [error, segment]);

  return (
    <main
      className={shellClass}
      role="alert"
      data-tt-error-boundary-root={boundaryMarker}
      {...dataAttrs}
    >
      {!isNew ? (
        <>
          <div className={TT_ORDERS_LIST_L5.pageVignette} aria-hidden />
          <div className={TT_ORDERS_LIST_L5.ambient} aria-hidden />
          <div className={TT_ORDERS_LIST_L5.dotGrid} aria-hidden />
        </>
      ) : (
        <>
          <div className={TT_ORDERS_NEW_L5.pageVignette} aria-hidden />
          <div className={TT_ORDERS_NEW_L5.ambient} aria-hidden />
          <div className={TT_ORDERS_NEW_L5.dotGrid} aria-hidden />
        </>
      )}
      <div className="relative z-[1] max-w-md w-full space-y-4 rounded-[var(--radius-xl)] border border-white/12 bg-slate-950/70 p-6 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <h1 className={titleClass}>{t("common_errorTitle")}</h1>
        <p className={bodyClass}>{t("common_errorMessage")}</p>
        <p id={appErrorRetryHintId} className={`${metaClass} leading-relaxed text-center`}>
          {t("app_error_boundary_retry_hint")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <form
            className="inline"
            aria-describedby={appErrorRetryHintId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              reset();
            }}
          >
            <button
              type="submit"
              data-tt-orders-segment-error-retry={retryMarker ?? boundaryMarker}
              className={`${touchTargetLink44Classes} ${TT_MARKETING_ERROR_RETRY_BTN} rounded-[var(--radius-md)] px-5 py-2`}
              aria-label={t("common_retry")}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/"
            className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.emptySecondaryBtn} px-5 py-2`}
            aria-label={t("common_backToHome")}
          >
            {t("common_backToHome")}
          </Link>
        </div>
        <p className={`flex flex-wrap justify-center gap-x-2 gap-y-1 ${metaClass}`}>
          <Link href="/orders" className={linkClass}>
            {t("nav_orders")}
          </Link>
          <span className={TT_ORDERS_LIST_L5.crossNavSeparator} aria-hidden>
            ·
          </span>
          <Link href="/orders/new" className={linkClass}>
            {t("orders_list_bookGuideCta")}
          </Link>
          <span className={TT_ORDERS_LIST_L5.crossNavSeparator} aria-hidden>
            ·
          </span>
          <Link href="/pay" className={linkClass}>
            {t("header_payHub")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="app_error_relatedNav_aria"
          showGuides
          errorBoundaryCrossNavMarker
          className={`mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-white/10 pt-5 ${metaClass}`}
          linkClassName={linkClass}
          separatorClassName={TT_ORDERS_LIST_L5.crossNavSeparator}
        />
      </div>
    </main>
  );
}
