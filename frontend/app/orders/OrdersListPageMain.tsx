"use client";

import { useState, useCallback, useMemo } from "react";
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
import { OrdersListActiveFiltersBar } from "./OrdersListActiveFiltersBar";
import { OrdersListMobileActionBar } from "./OrdersListMobileActionBar";
import { OrdersPageErrorView, OrdersPageLoadingView } from "./OrdersPageLoadingView";
import { useOrdersListPageCore } from "./useOrdersListPageCore";
import { countOrdersListByTerminalState } from "@/lib/orders/ordersListStateCounts";
import { filterOrdersListByUrlStateParam } from "@/lib/orders/ordersListStateFilter";
import { ordersListL5MainDataAttrs, TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import OrderDetailDrawer from "@/components/market/OrderDetailDrawer";
import { OrdersListDeleteConfirmDialog } from "@/components/orders/OrdersListDeleteConfirmDialog";

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
    pendingDeleteOrder,
    setPreviewOrder,
    handleDeleteOrder,
    cancelDeleteOrder,
    confirmDeleteOrder,
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

  const [openSwipeCardId, setOpenSwipeCardId] = useState<string | null>(null);
  const clearAllFilters = useCallback(() => {
    setOrdersListStateInUrl("");
    setOpenSwipeCardId(null);
  }, [setOrdersListStateInUrl]);

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
          <OrdersListActiveFiltersBar
            t={t}
            ordersListStateParam={ordersListStateParam}
            searchQuery=""
            onClearStateFilter={() => setOrdersListStateInUrl("")}
            onClearSearch={() => {}}
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
        ) : stateFilteredList.length === 0 ? (
          <OrdersListEmptyState
            t={t}
            ordersListStateParam={ordersListStateParam}
            setOrdersListStateInUrl={setOrdersListStateInUrl}
          />
        ) : (
          <div key={ordersListStateParam ?? "__all__"}>
            <OrdersListCards
              t={t}
              list={stateFilteredList}
              totalCount={stateFilteredList.length}
              searchActive={false}
              searchHighlightQuery=""
              searchInput=""
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
            />
          </div>
        )}

        <OrderDetailDrawer
          order={previewOrder}
          onClose={() => setPreviewOrder(null)}
          loginReturnPath={ordersLoginReturnPath}
        />

        <OrdersListDeleteConfirmDialog
          open={pendingDeleteOrder != null}
          busy={deletingId != null}
          t={t}
          onCancel={cancelDeleteOrder}
          onConfirm={confirmDeleteOrder}
        />

        <OrdersListPageFooter />
      </section>
      <OrdersListMobileActionBar t={t} />
    </main>
  );
}
