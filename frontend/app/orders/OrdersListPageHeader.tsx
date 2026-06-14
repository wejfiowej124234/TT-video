"use client";

import Link from "next/link";
import { GUIDE_WORKSPACE_HREF, MERCHANT_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";
import { PUBLISH_HUB_PATH } from "@/lib/me/publishHubL5";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { OrdersListHatQuery } from "@/lib/orders/ordersListHatQuery";
import { workspaceOrdersViewAllHref } from "@/lib/orders/ordersListHatQuery";
import { isGuideOrdersListHat } from "@/lib/guide/guideOrderCorridorModel";
import { isMerchantOrdersListHat } from "@/lib/provider/merchantOrderCorridorModel";

export function OrdersListPageHeader({
  t,
  ordersListHat = null,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ordersListHat?: OrdersListHatQuery;
}) {
  const guideHat = isGuideOrdersListHat(ordersListHat);
  const merchantHat = isMerchantOrdersListHat(ordersListHat);
  const workspaceHat = guideHat || merchantHat;
  const workbenchHref = guideHat ? GUIDE_WORKSPACE_HREF : MERCHANT_WORKSPACE_HREF;
  const backWorkbenchKey = guideHat ? "guide_orders_back_workbench" : "merchant_orders_back_workbench";
  const viewAllOrdersKey = guideHat ? "guide_orders_view_traveler_orders" : "merchant_orders_view_all_orders";
  const viewAllOrdersHref = workspaceOrdersViewAllHref(ordersListHat);

  const eyebrowKey = guideHat
    ? "guide_orders_list_pageEyebrow"
    : merchantHat
      ? "merchant_orders_list_pageEyebrow"
      : "orders_list_pageEyebrow";
  const titleKey = guideHat
    ? "guide_orders_list_title"
    : merchantHat
      ? "merchant_orders_list_title"
      : "orders_myOrders";
  const descKey = guideHat
    ? "guide_orders_list_desc"
    : merchantHat
      ? "merchant_orders_list_desc"
      : "orders_desc";
  const scopeKey = guideHat
    ? "guide_orders_list_scope_note"
    : merchantHat
      ? "merchant_orders_list_scope_note"
      : "orders_list_drafts_scope_note";

  return (
    <header className={TT_ORDERS_LIST_L5.pageHeaderWrap}>
      <div className={TT_ORDERS_LIST_L5.heroFrame}>
        <div className={`relative overflow-hidden ${TT_ORDERS_LIST_L5.heroInner} space-y-3`}>
          <div className={TT_ORDERS_LIST_L5.heroInnerGlow} aria-hidden />
          <div className="relative z-[1] space-y-3">
            {workspaceHat ? (
              <Link
                href={workbenchHref}
                className={TT_ORDERS_LIST_L5.kicker}
                data-tt-workspace-orders-back-workbench="1"
              >
                ← {t(backWorkbenchKey)}
              </Link>
            ) : null}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1.5 min-w-0 flex-1">
                <p className={TT_ORDERS_LIST_L5.kicker}>{t(eyebrowKey)}</p>
                <h1 className={TT_ORDERS_LIST_L5.title}>{t(titleKey)}</h1>
                <p className={`${TT_ORDERS_LIST_L5.bodyText} max-w-2xl`}>{t(descKey)}</p>
                <p className={`${TT_ORDERS_LIST_L5.heroScopeNote} max-w-2xl`}>{t(scopeKey)}</p>
                {!workspaceHat ? (
                  <p className={`${TT_ORDERS_LIST_L5.heroScopeNote} max-w-2xl`}>
                    {t("orders_list_publish_hub_boundary")}{" "}
                    <Link
                      href={PUBLISH_HUB_PATH}
                      className={`font-semibold text-ref-sun/90 underline-offset-2 hover:underline ${touchTargetLink44Classes}`}
                      data-tt-orders-list-publish-hub-link="1"
                    >
                      {t("orders_list_open_publish_hub")}
                    </Link>
                  </p>
                ) : null}
              </div>
              {workspaceHat ? (
                <div className="hidden w-full shrink-0 flex-col gap-2 sm:flex sm:w-auto lg:mt-6">
                  <Link
                    href={workbenchHref}
                    data-tt-workspace-orders-cta-workbench="1"
                    className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.heroCta} w-full sm:w-auto`}
                  >
                    {t(backWorkbenchKey)}
                  </Link>
                  <Link
                    href={viewAllOrdersHref}
                    data-tt-workspace-orders-cta-all="1"
                    className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.emptySecondaryBtn} w-full text-center sm:w-auto`}
                  >
                    {t(viewAllOrdersKey)}
                  </Link>
                </div>
              ) : (
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
              )}
            </div>
            {workspaceHat ? (
              <div className="flex flex-col gap-2 sm:hidden">
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
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
      <div aria-hidden className="px-1">
        <div className={TT_ORDERS_LIST_L5.bridgeLine} />
      </div>
    </header>
  );
}
