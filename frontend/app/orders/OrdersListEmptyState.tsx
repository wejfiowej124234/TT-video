"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ordersListStateLabelKey } from "@/lib/ordersListStateQuery";
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
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ordersListStateParam?: string | null;
  setOrdersListStateInUrl?: (next: string) => void;
}) {
  const filtered = Boolean(ordersListStateParam);
  const filterLabelKey = ordersListStateLabelKey(ordersListStateParam);
  const filterLabel = t(filterLabelKey);

  return (
    <div
      className={`relative ${TT_ORDERS_LIST_L5.emptyCard} ${TT_ORDERS_LIST_L5.listItemEnter} space-y-4`}
      role="status"
      aria-label={filtered ? t("orders_list_filter_empty", { filter: filterLabel }) : t("orders_empty")}
    >
      <div className={TT_ORDERS_LIST_L5.emptyGlow} aria-hidden />
      <div className={filtered ? TT_ORDERS_LIST_L5.filterEmptyIcon : TT_ORDERS_LIST_L5.emptyIcon} aria-hidden>
        {filtered ? "◎" : "✈"}
      </div>
      <p className={`${TT_ORDERS_LIST_L5.bodyText} max-w-md mx-auto`}>
        {filtered ? t("orders_list_filter_empty", { filter: filterLabel }) : t("orders_empty")}
      </p>
      <p className={`${TT_ORDERS_LIST_L5.metaText} max-w-md mx-auto`}>
        {filtered ? t("orders_list_filter_empty_sub") : t("orders_emptySub")}
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
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
          href={filtered ? "/orders/new" : "/itinerary/new"}
          className={TT_ORDERS_LIST_L5.emptySecondaryBtn}
        >
          {filtered ? t("orders_list_bookGuideCta") : t("empty_createDraft")}
        </Link>
        {!filtered ? (
          <Link href="/" className={TT_ORDERS_LIST_L5.emptySecondaryBtn}>
            {t("empty_goCreateItinerary")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
