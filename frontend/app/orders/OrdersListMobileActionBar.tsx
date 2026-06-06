"use client";

import Link from "next/link";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function OrdersListMobileActionBar({ t }: { t: (key: string) => string }) {
  return (
    <div className={`${TT_ORDERS_LIST_L5.mobileActionBar} flex flex-col gap-2`} data-tt-orders-mobile-cta="1">
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
  );
}
