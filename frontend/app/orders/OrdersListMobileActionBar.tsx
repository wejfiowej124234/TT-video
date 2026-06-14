"use client";

import Link from "next/link";
import { GUIDE_WORKSPACE_HREF, MERCHANT_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";
import type { OrdersListHatQuery } from "@/lib/orders/ordersListHatQuery";
import { workspaceOrdersViewAllHref } from "@/lib/orders/ordersListHatQuery";
import { isGuideOrdersListHat } from "@/lib/guide/guideOrderCorridorModel";
import { isMerchantOrdersListHat } from "@/lib/provider/merchantOrderCorridorModel";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function OrdersListMobileActionBar({
  t,
  ordersListHat = null,
}: {
  t: (key: string) => string;
  ordersListHat?: OrdersListHatQuery;
}) {
  const guideHat = isGuideOrdersListHat(ordersListHat);
  const merchantHat = isMerchantOrdersListHat(ordersListHat);
  const workspaceHat = guideHat || merchantHat;
  const workbenchHref = guideHat ? GUIDE_WORKSPACE_HREF : MERCHANT_WORKSPACE_HREF;
  const backWorkbenchKey = guideHat ? "guide_orders_back_workbench" : "merchant_orders_back_workbench";
  const viewAllOrdersKey = guideHat ? "guide_orders_view_traveler_orders" : "merchant_orders_view_all_orders";
  const viewAllOrdersHref = workspaceOrdersViewAllHref(ordersListHat);

  return (
    <div
      className={`${TT_ORDERS_LIST_L5.mobileActionBar} flex flex-col gap-2`}
      data-tt-orders-mobile-cta="1"
      {...(workspaceHat ? { "data-tt-workspace-orders-mobile-cta": ordersListHat } : {})}
    >
      {workspaceHat ? (
        <>
          <Link
            href={workbenchHref}
            data-tt-workspace-orders-cta-workbench="1"
            className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.heroCta} w-full`}
          >
            {t(backWorkbenchKey)}
          </Link>
          <Link
            href={viewAllOrdersHref}
            data-tt-workspace-orders-cta-all="1"
            className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.emptySecondaryBtn} w-full text-center`}
          >
            {t(viewAllOrdersKey)}
          </Link>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
