"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { OrdersListLoadMoreRowSkeleton } from "@/components/orders/OrdersListPageLoadingSkeleton";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { TT_MARKETING_ERROR_RETRY_BTN } from "@/lib/marketingUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function OrdersListLoadMoreSection({
  t,
  loadMoreError,
  loadingMore,
  loadMoreOrders,
  ordersHasMore,
  listCount,
  searchActive = false,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  loadMoreError: string | null;
  loadingMore: boolean;
  loadMoreOrders: () => void;
  ordersHasMore: boolean;
  listCount: number;
  searchActive?: boolean;
}) {
  const showEndReached = listCount > 0 && !ordersHasMore && loadMoreError == null && !loadingMore;

  return (
    <>
      {loadMoreError != null ? (
        <div
          className={`mt-6 ${TT_ORDERS_LIST_L5.loadMoreErrorPanel}`}
          role="alert"
          aria-live="polite"
          data-tt-orders-load-more-error="1"
        >
          <p className={`${TT_ORDERS_LIST_L5.metaText} leading-snug`}>{t("orders_loadMore_failed_intro")}</p>
          <ApiErrorAlert message={loadMoreError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (loadingMore) return;
              void loadMoreOrders();
            }}
          >
            <button
              type="submit"
              data-tt-orders-load-more-inline-retry="1"
              disabled={loadingMore}
              aria-busy={loadingMore ? true : undefined}
              className={`${touchTargetLink44Classes} ${TT_MARKETING_ERROR_RETRY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingMore ? t("common_retrying") : t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}

      {loadingMore ? (
        <div className="mt-4" aria-busy="true" aria-label={t("common_loadingMore")}>
          <OrdersListLoadMoreRowSkeleton />
        </div>
      ) : null}

      {ordersHasMore && loadMoreError == null && !loadingMore ? (
        <div className="mt-6 flex justify-center">
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (loadingMore) return;
              void loadMoreOrders();
            }}
          >
            <button
              type="submit"
              data-tt-orders-load-more="1"
              disabled={loadingMore}
              aria-busy={loadingMore ? true : undefined}
              className={TT_ORDERS_LIST_L5.loadMoreBtn}
            >
              {loadingMore ? (
                <>
                  <span className={TT_ORDERS_LIST_L5.loadMoreSpinner} aria-hidden />
                  {t("common_loadingMore")}
                </>
              ) : (
                t("common_loadMore")
              )}
            </button>
          </form>
        </div>
      ) : null}

      {searchActive && (ordersHasMore || showEndReached) ? (
        <p className={`mt-4 ${TT_ORDERS_LIST_L5.searchScopeHint}`} role="note">
          {t("orders_list_search_scope_hint")}
        </p>
      ) : null}

      {showEndReached ? (
        <div
          className={`mt-8 ${TT_ORDERS_LIST_L5.listEndPanel}`}
          role="status"
          aria-label={t("orders_list_all_loaded_aria", { count: listCount })}
          data-tt-orders-list-end="1"
        >
          <div className="w-full max-w-md px-1" aria-hidden>
            <div className={TT_ORDERS_LIST_L5.bridgeLine} />
          </div>
          <span className={TT_ORDERS_LIST_L5.listEndIcon} aria-hidden>
            ✓
          </span>
          <p className={TT_ORDERS_LIST_L5.listEndText}>
            {t("orders_list_all_loaded", { count: listCount })}
          </p>
        </div>
      ) : null}
    </>
  );
}
