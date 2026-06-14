"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ordersListStateLabelKey } from "@/lib/ordersListStateQuery";
import { buildMarketCreateItineraryHref } from "@/lib/marketDeepLink";
import { GUIDE_WORKSPACE_HREF, MERCHANT_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";
import type { OrdersListHatQuery } from "@/lib/orders/ordersListHatQuery";
import { workspaceOrdersViewAllHref } from "@/lib/orders/ordersListHatQuery";
import { isGuideOrdersListHat } from "@/lib/guide/guideOrderCorridorModel";
import { isMerchantOrdersListHat } from "@/lib/provider/merchantOrderCorridorModel";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";

export function OrdersListSyncingBanner({ t, listSyncing }: { t: (key: string) => string; listSyncing: boolean }) {
  if (!listSyncing) return null;
  return (
    <div className="mb-5 space-y-2" role="status" aria-live="polite" data-tt-orders-list-syncing="1">
      <div className={TT_ORDERS_LIST_L5.syncingProgressTrack} aria-hidden>
        <div className={TT_ORDERS_LIST_L5.syncingProgressFill} />
      </div>
      <p className={TT_ORDERS_LIST_L5.syncingBanner}>
        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-ref-sun/80 motion-safe:animate-pulse motion-reduce:animate-none" aria-hidden />
        {t("orders_list_syncing")}
      </p>
    </div>
  );
}

export function OrdersListEmptyState({
  t,
  ordersListStateParam,
  setOrdersListStateInUrl,
  ordersListHat = null,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ordersListStateParam?: string | null;
  setOrdersListStateInUrl?: (next: string) => void;
  ordersListHat?: OrdersListHatQuery;
}) {
  const guideHat = isGuideOrdersListHat(ordersListHat);
  const merchantHat = isMerchantOrdersListHat(ordersListHat);
  const workspaceHat = guideHat || merchantHat;
  const workbenchHref = guideHat ? GUIDE_WORKSPACE_HREF : MERCHANT_WORKSPACE_HREF;
  const backWorkbenchKey = guideHat ? "guide_orders_back_workbench" : "merchant_orders_back_workbench";
  const viewAllOrdersKey = guideHat ? "guide_orders_view_traveler_orders" : "merchant_orders_view_all_orders";
  const viewAllOrdersHref = workspaceOrdersViewAllHref(ordersListHat);
  const filtered = Boolean(ordersListStateParam);
  const showViewAllOrdersCta = !(merchantHat && filtered);
  const filterLabelKey = ordersListStateLabelKey(ordersListStateParam);
  const filterLabel = t(filterLabelKey);
  const emptyLabel = filtered
    ? guideHat
      ? t("guide_orders_filter_empty", { filter: filterLabel })
      : merchantHat
        ? t("merchant_orders_filter_empty", { filter: filterLabel })
        : t("orders_list_filter_empty", { filter: filterLabel })
    : guideHat
      ? t("guide_orders_empty")
      : merchantHat
        ? t("merchant_orders_empty")
        : t("orders_empty");
  const emptySub = filtered
    ? guideHat
      ? t("guide_orders_filter_empty_sub")
      : merchantHat
        ? t("merchant_orders_filter_empty_sub")
        : t("orders_list_filter_empty_sub")
    : guideHat
      ? t("guide_orders_empty_sub")
      : merchantHat
        ? t("merchant_orders_empty_sub")
        : t("orders_emptySub");

  return (
    <div
      className={`relative ${TT_ORDERS_LIST_L5.emptyCard} ${TT_ORDERS_LIST_L5.listItemEnter} space-y-4`}
      role="status"
      aria-label={emptyLabel}
      {...(workspaceHat ? { "data-tt-workspace-orders-empty": ordersListHat } : {})}
    >
      <div className={TT_ORDERS_LIST_L5.emptyGlow} aria-hidden />
      <div className={filtered ? TT_ORDERS_LIST_L5.filterEmptyIcon : TT_ORDERS_LIST_L5.emptyIcon} aria-hidden>
        {filtered ? "◎" : "✈"}
      </div>
      <p className={`${TT_ORDERS_LIST_L5.bodyText} max-w-md mx-auto`}>{emptyLabel}</p>
      <p className={`${TT_ORDERS_LIST_L5.metaText} max-w-md mx-auto`}>{emptySub}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        {workspaceHat ? (
          <>
            {filtered && setOrdersListStateInUrl ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  setOrdersListStateInUrl("");
                }}
              >
                <button type="submit" className={TT_ORDERS_LIST_L5.bookGuideCtaPrimary}>
                  {t("orders_list_clear_filter")}
                </button>
              </form>
            ) : (
              <Link
                href={workbenchHref}
                data-tt-workspace-orders-cta-workbench="1"
                className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.heroCta} rounded-[var(--radius-md)] px-5 py-2.5`}
              >
                {t(backWorkbenchKey)}
              </Link>
            )}
            {showViewAllOrdersCta ? (
              <Link
                href={viewAllOrdersHref}
                data-tt-workspace-orders-cta-all="1"
                className={TT_ORDERS_LIST_L5.emptySecondaryBtn}
              >
                {t(viewAllOrdersKey)}
              </Link>
            ) : null}
          </>
        ) : (
          <>
            {filtered && setOrdersListStateInUrl ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  setOrdersListStateInUrl("");
                }}
              >
                <button type="submit" className={TT_ORDERS_LIST_L5.bookGuideCtaPrimary}>
                  {t("orders_list_clear_filter")}
                </button>
              </form>
            ) : (
              <Link
                href="/orders/new"
                data-tt-orders-list-book-cta="primary"
                className={`${touchTargetLink44Classes} ${TT_ORDERS_LIST_L5.heroCta} rounded-[var(--radius-md)] px-5 py-2.5`}
              >
                {t("orders_list_bookGuideCta")}
              </Link>
            )}
            <Link
              href={filtered ? "/" : buildMarketCreateItineraryHref()}
              data-tt-orders-list-create-draft-cta="1"
              className={TT_ORDERS_LIST_L5.emptySecondaryBtn}
            >
              {filtered ? t("empty_goCreateItinerary") : t("empty_createDraft")}
            </Link>
            {!filtered ? (
              <Link href="/" className={TT_ORDERS_LIST_L5.emptySecondaryBtn}>
                {t("empty_goCreateItinerary")}
              </Link>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
