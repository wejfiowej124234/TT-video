"use client";

import { useId, useState, useCallback, useMemo } from "react";
import { OrdersListSyncingBanner } from "./OrdersListEmptyState";
import { OrdersListAlertsSection } from "./OrdersListAlertsSection";
import { OrdersBookGuideBannerSection } from "./OrdersBookGuideBannerSection";
import { OrdersListCards } from "./OrdersListCards";
import { OrdersListEmptyState } from "./OrdersListEmptyState";
import { OrdersListLoadMoreSection } from "./OrdersListLoadMoreSection";
import { OrdersListPageFooter } from "./OrdersListPageFooter";
import { OrdersListPageHeader } from "./OrdersListPageHeader";
import { OrdersListToolbar } from "./OrdersListToolbar";
import { OrdersListFilterRail } from "./OrdersListFilterRail";
import { OrdersListSearchBar } from "./OrdersListSearchBar";
import { OrdersListActiveFiltersBar } from "./OrdersListActiveFiltersBar";
import { OrdersListSearchEmptyState } from "./OrdersListSearchEmptyState";
import { OrdersListMobileActionBar } from "./OrdersListMobileActionBar";
import { OrdersPageErrorView, OrdersPageLoadingView } from "./OrdersPageLoadingView";
import { useOrdersListPageCore } from "./useOrdersListPageCore";
import { useOrdersListClientSearch } from "./useOrdersListClientSearch";
import { countOrdersListByTerminalState } from "@/lib/orders/ordersListStateCounts";
import { filterOrdersListByUrlStateParam } from "@/lib/orders/ordersListStateFilter";
import { ordersListL5MainDataAttrs, TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import OrderDetailDrawer from "@/components/market/OrderDetailDrawer";

export default function OrdersListPageMain() {
  const {
    t,
    loading,
    pageError,
    refreshOrders,
    ordersLoginReturnPath,
    ordersStateFilterId,
    ordersListStateParam,
    setOrdersListStateInUrl,
    orderActionError,
    setOrderActionError,
    expectOrderId,
    expectOrderBanner,
    listSyncing,
    bookGuideParam,
    bookGuideResolve,
    list,
    deletingId,
    setPreviewOrder,
    handleDeleteOrder,
    loadMoreError,
    loadingMore,
    loadMoreOrders,
    ordersHasMore,
    previewOrder,
  } = useOrdersListPageCore();

  const stateFilteredList = useMemo(
    () => filterOrdersListByUrlStateParam(list, ordersListStateParam),
    [list, ordersListStateParam],
  );

  const searchInputId = useId();
  const {
    searchInput,
    setSearchInput,
    debouncedSearch,
    searchPending,
    searchActive,
    displayedList,
    clearSearch,
  } = useOrdersListClientSearch(stateFilteredList);

  const [openSwipeCardId, setOpenSwipeCardId] = useState<string | null>(null);
  const clearAllFilters = useCallback(() => {
    clearSearch();
    setOrdersListStateInUrl("");
    setOpenSwipeCardId(null);
  }, [clearSearch, setOrdersListStateInUrl]);

  const filterStateCounts = useMemo(() => countOrdersListByTerminalState(list), [list]);

  if (loading) {
    return <OrdersPageLoadingView t={t} />;
  }

  if (pageError) {
    return (
      <OrdersPageErrorView
        t={t}
        pageError={pageError}
        refreshOrders={refreshOrders}
        ordersLoginReturnPath={ordersLoginReturnPath}
      />
    );
  }

  return (
    <main
      className={TT_ORDERS_LIST_L5.pageShell}
      aria-label={t("orders_myOrders")}
      {...ordersListL5MainDataAttrs()}
    >
      <div className={TT_ORDERS_LIST_L5.pageVignette} aria-hidden />
      <div className={TT_ORDERS_LIST_L5.ambient} aria-hidden />
      <div className={TT_ORDERS_LIST_L5.dotGrid} aria-hidden />
      <section className={TT_ORDERS_LIST_L5.pageInner}>
        <OrdersListPageHeader t={t} />

        <OrdersListToolbar>
          <OrdersListFilterRail
            t={t}
            ordersStateFilterId={ordersStateFilterId}
            ordersListStateParam={ordersListStateParam}
            setOrdersListStateInUrl={setOrdersListStateInUrl}
            stateCounts={filterStateCounts}
            countsLoadedOnly={ordersHasMore}
            embedded
          />
          {list.length > 0 ? (
            <OrdersListSearchBar
              t={t}
              searchQuery={searchInput}
              onSearchQueryChange={setSearchInput}
              searchInputId={searchInputId}
              searchPending={searchPending}
              searchScopeLoadedOnly={ordersHasMore}
              embedded
            />
          ) : null}
          <OrdersListActiveFiltersBar
            t={t}
            ordersListStateParam={ordersListStateParam}
            searchQuery={debouncedSearch}
            onClearStateFilter={() => setOrdersListStateInUrl("")}
            onClearSearch={clearSearch}
            onClearAll={clearAllFilters}
            embedded
          />
        </OrdersListToolbar>

        <OrdersListSyncingBanner t={t} listSyncing={listSyncing} />

        <OrdersListAlertsSection
          t={t}
          orderActionError={orderActionError}
          setOrderActionError={setOrderActionError}
          loading={loading}
          expectOrderId={expectOrderId}
          expectOrderBanner={expectOrderBanner}
          listSyncing={listSyncing}
          refreshOrders={refreshOrders}
        />

        <OrdersBookGuideBannerSection
          t={t}
          bookGuideParam={bookGuideParam}
          bookGuideResolve={bookGuideResolve}
        />

        {list.length === 0 ? (
          <OrdersListEmptyState
            t={t}
            ordersListStateParam={ordersListStateParam}
            setOrdersListStateInUrl={setOrdersListStateInUrl}
          />
        ) : stateFilteredList.length === 0 && !searchActive ? (
          <OrdersListEmptyState
            t={t}
            ordersListStateParam={ordersListStateParam}
            setOrdersListStateInUrl={setOrdersListStateInUrl}
          />
        ) : searchActive && displayedList.length === 0 ? (
          <OrdersListSearchEmptyState
            t={t}
            searchQuery={debouncedSearch}
            onClearSearch={clearSearch}
          />
        ) : (
          <div key={`${ordersListStateParam ?? "__all__"}:${debouncedSearch.trim().toLowerCase()}`}>
            <OrdersListCards
              t={t}
              list={displayedList}
              totalCount={stateFilteredList.length}
              searchActive={searchActive}
              searchHighlightQuery={debouncedSearch}
              searchInput={searchInput}
              deletingId={deletingId}
              openSwipeCardId={openSwipeCardId}
              setOpenSwipeCardId={setOpenSwipeCardId}
              setPreviewOrder={setPreviewOrder}
              handleDeleteOrder={handleDeleteOrder}
            />
            <OrdersListLoadMoreSection
              t={t}
              loadMoreError={loadMoreError}
              loadingMore={loadingMore}
              loadMoreOrders={loadMoreOrders}
              ordersHasMore={ordersHasMore}
              listCount={list.length}
              searchActive={searchActive}
            />
          </div>
        )}

        <OrderDetailDrawer
          order={previewOrder}
          onClose={() => setPreviewOrder(null)}
          loginReturnPath={ordersLoginReturnPath}
        />

        <OrdersListPageFooter />
      </section>
      <OrdersListMobileActionBar t={t} />
    </main>
  );
}
