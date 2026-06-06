"use client";

import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";

export function OrdersListSearchEmptyState({
  t,
  searchQuery,
  onClearSearch,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  searchQuery: string;
  onClearSearch: () => void;
}) {
  const q = searchQuery.trim();

  return (
    <div
      className={`relative ${TT_ORDERS_LIST_L5.emptyCard} ${TT_ORDERS_LIST_L5.listItemEnter} space-y-4`}
      role="status"
      aria-label={t("orders_list_search_empty", { query: q })}
      data-tt-orders-search-empty="1"
    >
      <div className={TT_ORDERS_LIST_L5.emptyGlow} aria-hidden />
      <div className={TT_ORDERS_LIST_L5.searchEmptyIcon} aria-hidden>
        ⌕
      </div>
      <p className={`${TT_ORDERS_LIST_L5.bodyText} max-w-md mx-auto`}>{t("orders_list_search_empty", { query: q })}</p>
      <p className={`${TT_ORDERS_LIST_L5.metaText} max-w-md mx-auto`}>{t("orders_list_search_empty_sub")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <button type="button" className={TT_ORDERS_LIST_L5.bookGuideCtaPrimary} onClick={onClearSearch}>
          {t("orders_list_clear_search")}
        </button>
      </div>
    </div>
  );
}
