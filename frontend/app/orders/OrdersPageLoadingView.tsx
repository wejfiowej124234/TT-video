"use client";

import Link from "next/link";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  OrdersListPageHeroLoadingSkeleton,
  OrdersListPageLoadingSkeleton,
  OrdersListToolbarLoadingSkeleton,
} from "@/components/orders/OrdersListPageLoadingSkeleton";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { ordersListL5MainDataAttrs, TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { TT_MARKETING_ERROR_RETRY_BTN } from "@/lib/marketingUi";
import { OrdersListPageFooter } from "./OrdersListPageFooter";

export function OrdersPageLoadingView({ t }: { t: (key: string) => string }) {
  return (
    <main
      className={TT_ORDERS_LIST_L5.pageShell}
      aria-label={t("orders_myOrders")}
      {...ordersListL5MainDataAttrs()}
    >
      <div className={TT_ORDERS_LIST_L5.pageVignette} aria-hidden />
      <div className={TT_ORDERS_LIST_L5.ambient} aria-hidden />
      <div className={TT_ORDERS_LIST_L5.dotGrid} aria-hidden />
      <section className={TT_ORDERS_LIST_L5.pageInner} aria-busy="true">
        <h1 className="sr-only">{t("orders_myOrders")}</h1>
        <p className="sr-only" role="status">
          {t("common_loading")}
        </p>
        <OrdersListPageHeroLoadingSkeleton />
        <OrdersListToolbarLoadingSkeleton />
        <div className={`${TT_ORDERS_LIST_L5.hintBarSlim} border-t-0 pt-0`} aria-hidden>
          <div className={`h-8 w-32 ${TT_ORDERS_LIST_L5.skeletonShimmer}`} />
        </div>
        <OrdersListPageLoadingSkeleton />
        <OrdersListPageFooter />
      </section>
    </main>
  );
}

export function OrdersPageErrorView({
  t,
  pageError,
  refreshOrders,
  ordersLoginReturnPath,
}: {
  t: (key: string) => string;
  pageError: string;
  refreshOrders: () => void;
  ordersLoginReturnPath: string;
}) {
  return (
    <main
      className={TT_ORDERS_LIST_L5.errorShell}
      aria-label={t("orders_myOrders")}
      {...ordersListL5MainDataAttrs()}
    >
      <div className={TT_ORDERS_LIST_L5.pageVignette} aria-hidden />
      <div className={TT_ORDERS_LIST_L5.ambient} aria-hidden />
      <div className={TT_ORDERS_LIST_L5.dotGrid} aria-hidden />
      <div className="relative z-[1] max-w-md w-full space-y-4 rounded-[var(--radius-xl)] border border-white/12 bg-slate-950/70 p-6 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <h1 className={TT_ORDERS_LIST_L5.errorTitle}>{t("orders_myOrders")}</h1>
        <ApiErrorAlert message={pageError} tone="dark" />
        <form
          className="flex justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            refreshOrders();
          }}
        >
          <button
            type="submit"
            data-tt-orders-page-error-retry="1"
            aria-label={t("common_retry")}
            className={`${touchTargetLink44Classes} ${TT_MARKETING_ERROR_RETRY_BTN} rounded-[var(--radius-md)] px-5 py-2`}
          >
            {t("common_retry")}
          </button>
        </form>
        <p className={`flex flex-wrap justify-center gap-x-2 gap-y-1 ${TT_ORDERS_LIST_L5.bodyText}`}>
          <Link href={`/auth/login?returnUrl=${encodeURIComponent(ordersLoginReturnPath)}`} className={TT_ORDERS_LIST_L5.crossNavLink}>
            {t("orders_goLogin")}
          </Link>
          <span className={TT_ORDERS_LIST_L5.crossNavSeparator} aria-hidden>
            ·
          </span>
          <Link href="/" className={TT_ORDERS_LIST_L5.crossNavLink}>
            {t("orders_nav_home")}
          </Link>
          <span className={TT_ORDERS_LIST_L5.crossNavSeparator} aria-hidden>
            ·
          </span>
          <Link href="/help" className={TT_ORDERS_LIST_L5.crossNavLink}>
            {t("help_title")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="orders_list_relatedNav_aria"
          showGuides
          linkClassName={TT_ORDERS_LIST_L5.crossNavLink}
          separatorClassName={TT_ORDERS_LIST_L5.crossNavSeparator}
          className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${TT_ORDERS_LIST_L5.metaText}`}
        />
      </div>
    </main>
  );
}
