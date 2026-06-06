"use client";

import Link from "next/link";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function OrdersListPageHeader({ t }: { t: (key: string, vars?: Record<string, string | number>) => string }) {
  return (
    <header className={TT_ORDERS_LIST_L5.pageHeaderWrap}>
      <div className={TT_ORDERS_LIST_L5.heroFrame}>
        <div className={`relative overflow-hidden ${TT_ORDERS_LIST_L5.heroInner} space-y-3`}>
          <div className={TT_ORDERS_LIST_L5.heroInnerGlow} aria-hidden />
          <div className="relative z-[1] space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1.5 min-w-0 flex-1">
                <p className={TT_ORDERS_LIST_L5.kicker}>{t("orders_list_pageEyebrow")}</p>
                <h1 className={TT_ORDERS_LIST_L5.title}>{t("orders_myOrders")}</h1>
                <p className={`${TT_ORDERS_LIST_L5.bodyText} max-w-2xl`}>{t("orders_desc")}</p>
                <p className={`${TT_ORDERS_LIST_L5.heroScopeNote} max-w-2xl`}>{t("orders_list_drafts_scope_note")}</p>
              </div>
              <div className="hidden w-full shrink-0 flex-col gap-2 sm:flex sm:w-auto lg:mt-6">
                <Link
                  href="/orders/new"
                  data-tt-orders-list-book-cta="primary"
                  className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.heroCta} w-full sm:w-auto`}
                >
                  {t("orders_list_bookGuideCta")}
                </Link>
                <Link
                  href="/"
                  data-tt-orders-list-book-cta="itinerary"
                  className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.emptySecondaryBtn} w-full text-center sm:w-auto`}
                >
                  {t("empty_goCreateItinerary")}
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:hidden">
              <Link
                href="/orders/new"
                data-tt-orders-list-book-cta="primary"
                className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.heroCta} w-full`}
              >
                {t("orders_list_bookGuideCta")}
              </Link>
              <Link
                href="/"
                data-tt-orders-list-book-cta="itinerary"
                className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.emptySecondaryBtn} w-full text-center`}
              >
                {t("empty_goCreateItinerary")}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden className="px-1">
        <div className={TT_ORDERS_LIST_L5.bridgeLine} />
      </div>
    </header>
  );
}
