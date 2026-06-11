"use client";

import { ordersListStateLabelKey } from "@/lib/ordersListStateQuery";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";

export function OrdersListActiveFiltersBar({
  t,
  ordersListStateParam,
  searchQuery,
  onClearStateFilter,
  onClearSearch,
  onClearAll,
  searchResultsPaginated = false,
  embedded = false,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ordersListStateParam?: string | null;
  searchQuery: string;
  onClearStateFilter: () => void;
  onClearSearch: () => void;
  onClearAll: () => void;
  /** 搜索仍可能有未加载分页时的旁证提示（仅在有搜索词时展示） */
  searchResultsPaginated?: boolean;
  embedded?: boolean;
}) {
  const stateActive = Boolean(ordersListStateParam);
  const searchTrimmed = searchQuery.trim();
  const searchActive = searchTrimmed.length > 0;
  if (!stateActive && !searchActive) return null;

  const stateLabel = t(ordersListStateLabelKey(ordersListStateParam));
  const showClearAll = stateActive && searchActive;

  const showSearchScopeHint = searchActive && searchResultsPaginated;

  return (
    <div
      className={embedded ? "flex w-full min-w-0 flex-col gap-2" : TT_ORDERS_LIST_L5.activeFiltersBar}
      role="status"
      aria-label={t("orders_list_active_filters_aria")}
      data-tt-orders-active-filters="1"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className={TT_ORDERS_LIST_L5.activeFiltersLabel}>{t("orders_list_active_filters_label")}</span>
      {stateActive ? (
        <span className={TT_ORDERS_LIST_L5.activeFilterChip}>
          <span className="max-w-[8rem] truncate sm:max-w-xs">
            {t("orders_list_filter_chip_status", { filter: stateLabel })}
          </span>
          <button
            type="button"
            className={TT_ORDERS_LIST_L5.activeFilterChipDismiss}
            onClick={onClearStateFilter}
            aria-label={t("orders_list_clear_filter_aria")}
          >
            ✕
          </button>
        </span>
      ) : null}
      {searchActive ? (
        <span className={TT_ORDERS_LIST_L5.activeFilterChip}>
          <span className="max-w-[10rem] truncate sm:max-w-xs">
            {t("orders_list_filter_chip_search", { query: searchTrimmed })}
          </span>
          <button
            type="button"
            className={TT_ORDERS_LIST_L5.activeFilterChipDismiss}
            onClick={onClearSearch}
            aria-label={t("orders_list_search_clear_aria")}
          >
            ✕
          </button>
        </span>
      ) : null}
      {showClearAll ? (
        <button type="button" className={TT_ORDERS_LIST_L5.clearAllFiltersBtn} onClick={onClearAll}>
          {t("orders_list_clear_all_filters")}
        </button>
      ) : null}
      </div>
      {showSearchScopeHint ? (
        <p className={TT_ORDERS_LIST_L5.searchScopeHintInline} role="note" data-tt-orders-search-scope-hint="1">
          {t("orders_list_search_scope_hint")}
        </p>
      ) : null}
    </div>
  );
}
