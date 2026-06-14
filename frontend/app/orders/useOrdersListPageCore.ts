// search-params gate: parent route provides Suspense boundary.
"use client";

import { useEffect, useState, useCallback, useMemo, useId } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getOrders, getGuide, orderCancel, getIdempotencyKey, type OrderListItem } from "@/lib/apiClient";
import { getMeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import {
  filterOrdersForGuideReception,
  isGuideOrdersListHat,
} from "@/lib/guide/guideOrderCorridorModel";
import { filterOrdersForMerchantSellerService } from "@/lib/provider/merchantOrderCorridorModel";
import {
  ORDERS_LIST_HAT_QUERY,
  ordersListHatForApi,
  parseOrdersListHatQuery,
  type OrdersListHatQuery,
} from "@/lib/orders/ordersListHatQuery";
import type { OrderDetailItem } from "@/components/market/OrderDetailDrawer";
import { useTranslation } from "@/components/LocaleProvider";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { dedupeListById, mergeListsUniqueById } from "@/lib/dedupeListById";
import { filterOrdersForOrdersListPage } from "@/lib/communityMeMyOrdersModel";
import { patchOrderListAfterCancelSuccess, patchPreviewOrderAfterCancelSuccess } from "@/lib/ordersListAfterCancel";
import { clearCachedLandingDraftCap } from "@/lib/landingDraftQuota";
import { removeLandingOrderIdFromSession } from "@/lib/landingItinerarySession";
import { ORDERS_EXPECT_ORDER_QUERY } from "@/lib/ordersExpectOrderParam";
import {
  ORDERS_ESCROW_AUTO_SYNC_POLL_MS,
  orderListItemWatchesForBackendEscrowSync,
} from "@/lib/ordersEscrowAutoSyncPoll";
import {
  ORDERS_LIST_STATE_QUERY,
  normalizeOrdersListStateQueryParam,
} from "@/lib/ordersListStateQuery";
import { buildOrdersListGetParams } from "@/lib/orders/ordersListFetchParams";
import { ORDERS_LIST_SEARCH_QUERY } from "@/lib/orders/ordersListClientSearch";
import { isUuidString } from "@/lib/isUuidString";
import { buildPathnameSearchHref } from "@/lib/marketLoginReturnPath";
import { ORDERS_PAGE_SIZE, orderListItemToDetailDrawer, type BookGuideResolve } from "./ordersListPageModel";
import { useOrdersListBookGuideResolve } from "./useOrdersListBookGuideResolve";
import { useOrdersListExpectOrderBanner } from "./useOrdersListExpectOrderBanner";

export function useOrdersListPageCore() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bookGuideParam = useMemo(() => (searchParams.get("book_guide") ?? "").trim(), [searchParams]);
  const bookGuideResolve: BookGuideResolve = useOrdersListBookGuideResolve(bookGuideParam);
  /** B-048：从 `/orders/new` 带回，用于首屏后静默重拉或显式「刷新列表」引导 */
  const expectOrderId = useMemo(
    () => (searchParams.get(ORDERS_EXPECT_ORDER_QUERY) ?? "").trim(),
    [searchParams],
  );
  const rawOrdersStateQ = useMemo(
    () => (searchParams.get(ORDERS_LIST_STATE_QUERY) ?? "").trim().toLowerCase(),
    [searchParams],
  );
  const ordersListStateParam = useMemo(
    () => normalizeOrdersListStateQueryParam(searchParams.get(ORDERS_LIST_STATE_QUERY)),
    [searchParams],
  );
  const ordersListSearchParam = useMemo(
    () => (searchParams.get(ORDERS_LIST_SEARCH_QUERY) ?? "").trim(),
    [searchParams],
  );
  const ordersListHat = useMemo(
    () => parseOrdersListHatQuery(searchParams.get(ORDERS_LIST_HAT_QUERY)),
    [searchParams],
  );
  const ordersStateFilterId = useId();
  const ordersLoginReturnPath = useMemo(() => {
    const base = pathname && pathname !== "/" ? pathname : "/orders";
    const q = searchParams?.toString() ?? "";
    return q ? `${base}?${q}` : base;
  }, [pathname, searchParams]);
  const [rawList, setRawList] = useState<OrderListItem[]>([]);
  const [guideRowId, setGuideRowId] = useState<string | null>(null);
  const [guideHatResolved, setGuideHatResolved] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  /** 列表已展示时取消订单等操作失败：内联提示，勿用 pageError 挡掉整页列表 */
  const [orderActionError, setOrderActionError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersNextCursor, setOrdersNextCursor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState<{ id: string; state: string } | null>(null);
  const [previewOrder, setPreviewOrder] = useState<OrderDetailItem | null>(null);
  /** B-048：静默重拉首屏时不挡整页（`refreshOrders({ silent: true })`） */
  const [listSyncing, setListSyncing] = useState(false);

  useEffect(() => {
    if (!isGuideOrdersListHat(ordersListHat)) {
      setGuideRowId(null);
      setGuideHatResolved(true);
      return;
    }
    let cancelled = false;
    setGuideHatResolved(false);
    void getMeGuideProfile()
      .then((body) => {
        if (cancelled) return;
        setGuideRowId(body.profile?.guide_id?.trim() ?? null);
        setGuideHatResolved(true);
      })
      .catch(() => {
        if (cancelled) return;
        setGuideRowId(null);
        setGuideHatResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ordersListHat]);

  const list = useMemo(() => {
    if (isGuideOrdersListHat(ordersListHat)) {
      return filterOrdersForGuideReception(rawList, guideRowId);
    }
    if (ordersListHat === "merchant") {
      return filterOrdersForMerchantSellerService(rawList);
    }
    return rawList;
  }, [rawList, ordersListHat, guideRowId]);

  /** B-071：非法 `state=` 从 URL 剔除，避免仅前端假筛选 */
  useEffect(() => {
    if (!rawOrdersStateQ) return;
    if (ordersListStateParam != null) return;
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    p.delete(ORDERS_LIST_STATE_QUERY);
    const q = p.toString();
    router.replace(buildPathnameSearchHref(pathname, q));
  }, [rawOrdersStateQ, ordersListStateParam, pathname, router, searchParams]);

  const setOrdersListStateInUrl = useCallback(
    (next: string) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      if (!next) p.delete(ORDERS_LIST_STATE_QUERY);
      else p.set(ORDERS_LIST_STATE_QUERY, next);
      const q = p.toString();
      router.replace(buildPathnameSearchHref(pathname, q));
    },
    [pathname, router, searchParams],
  );

  const refreshOrders = useCallback(
    (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      if (!silent) {
        setLoading(true);
        setLoadMoreError(null);
        setOrderActionError(null);
        setOrdersNextCursor(null);
        setOrdersHasMore(false);
      } else {
        setListSyncing(true);
      }
      getOrders(
        buildOrdersListGetParams({
          stateParam: ordersListStateParam,
          searchQ: ordersListSearchParam,
          hat: ordersListHatForApi(ordersListHat),
        }),
      )
        .then((r) => {
          const raw = (r.items as OrderListItem[]) ?? [];
          const deduped = dedupeListById(raw, (o) => String(o.id ?? ""));
          setRawList(filterOrdersForOrdersListPage(deduped, ordersListStateParam));
          const p = r.page;
          setOrdersHasMore(!!p?.has_more);
          setOrdersNextCursor(typeof p?.next_cursor === "string" && p.next_cursor ? p.next_cursor : null);
          setPageError(null);
          setLoadMoreError(null);
        })
        .catch((err) => {
          if (err instanceof Error && err.message === "login_required") {
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(ordersLoginReturnPath)}`);
            return;
          }
          if (typeof window !== "undefined") {
            console.error("OrdersPage refreshOrders:", err);
          }
          if (silent) {
            setOrderActionError(mapApiReadError(err, t, "orders_requestFailed"));
          } else {
            setPageError(mapApiReadError(err, t, "orders_requestFailed"));
          }
        })
        .finally(() => {
          if (!silent) setLoading(false);
          else setListSyncing(false);
        });
    },
    [router, ordersLoginReturnPath, t, ordersListStateParam, ordersListSearchParam, ordersListHat],
  );

  const loadMoreOrders = useCallback(() => {
    if (!ordersNextCursor || !ordersHasMore || loadingMore) return;
    setLoadMoreError(null);
    setLoadingMore(true);
    getOrders(
      buildOrdersListGetParams({
        cursor: ordersNextCursor,
        stateParam: ordersListStateParam,
        searchQ: ordersListSearchParam,
        hat: ordersListHatForApi(ordersListHat),
      }),
    )
      .then((r) => {
        setRawList((prev) => {
          const merged = mergeListsUniqueById(prev, (r.items as OrderListItem[]) ?? [], (o) => String(o.id ?? ""));
          return filterOrdersForOrdersListPage(merged, ordersListStateParam);
        });
        const p = r.page;
        setOrdersHasMore(!!p?.has_more);
        setOrdersNextCursor(typeof p?.next_cursor === "string" && p.next_cursor ? p.next_cursor : null);
        setLoadMoreError(null);
      })
      .catch((err) => {
        if (err instanceof Error && err.message === "login_required") {
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(ordersLoginReturnPath)}`);
          return;
        }
        if (typeof window !== "undefined") {
          console.error("OrdersPage loadMoreOrders:", err);
        }
        setLoadMoreError(mapApiReadError(err, t, "orders_loadMore_map_fallback"));
      })
      .finally(() => setLoadingMore(false));
  }, [
    ordersNextCursor,
    ordersHasMore,
    loadingMore,
    router,
    ordersLoginReturnPath,
    t,
    ordersListStateParam,
    ordersListSearchParam,
    ordersListHat,
  ]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const shouldPollOrdersForEscrowAlign = useMemo(
    () => list.some(orderListItemWatchesForBackendEscrowSync),
    [list],
  );

  useEffect(() => {
    if (!shouldPollOrdersForEscrowAlign) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      refreshOrders({ silent: true });
    };
    const intervalId = setInterval(tick, ORDERS_ESCROW_AUTO_SYNC_POLL_MS);
    const onVis = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") tick();
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis);
    }
    return () => {
      clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVis);
      }
    };
  }, [shouldPollOrdersForEscrowAlign, refreshOrders]);

  const previewOrderId = previewOrder?.id;
  /** B-069：静默 `getOrders` 后把当前预览卡与列表同源字段对齐（含 Accepted→Escrowed） */
  useEffect(() => {
    if (!previewOrderId) return;
    const id = String(previewOrderId);
    const row = list.find((o) => String(o.id) === id);
    if (!row) return;
    const next = orderListItemToDetailDrawer(row);
    setPreviewOrder((prev) => {
      if (!prev || String(prev.id) !== id) return prev;
      if (
        prev.state === next.state &&
        prev.status === next.status &&
        (prev.sub_status ?? "") === (next.sub_status ?? "") &&
        prev.escrow_address === next.escrow_address
      ) {
        return prev;
      }
      return next;
    });
  }, [list, previewOrderId]);

  const expectOrderBanner = useOrdersListExpectOrderBanner({
    expectOrderId,
    pathname,
    searchParams,
    replaceHref: (href) => {
      router.replace(href);
    },
    loading,
    listSyncing,
    list,
    refreshOrders,
  });

  const removeFromList = useCallback((orderId: string) => {
    setRawList((prev) => prev.filter((o) => String(o.id) !== orderId));
  }, []);

  const executeDeleteOrder = useCallback(
    async (orderId: string, stateOrStatus: string) => {
      if (deletingId) return;
      setOrderActionError(null);
      setDeletingId(orderId);
      const state = (stateOrStatus ?? "").toLowerCase();
      /** 已是终态取消：仅本地从列表移除（与 GET 列表仍可能含 cancelled 行的「清理视图」一致） */
      if (state === "cancelled" || state === "canceled") {
        removeFromList(orderId);
        removeLandingOrderIdFromSession(orderId);
        clearCachedLandingDraftCap();
        setPreviewOrder((po) => (po && String(po.id) === orderId ? null : po));
        setDeletingId(null);
        return;
      }
      try {
        const raw = await orderCancel(orderId, getIdempotencyKey());
        const data = raw as { order?: { id?: string; status?: string; state?: string } };
        setRawList((prev) => patchOrderListAfterCancelSuccess(prev, orderId, data.order));
        setPreviewOrder((po) => patchPreviewOrderAfterCancelSuccess(po, orderId, data.order));
        removeLandingOrderIdFromSession(orderId);
        clearCachedLandingDraftCap();
      } catch (err) {
        if (typeof window !== "undefined") {
          console.error("OrdersPage orderCancel:", err);
        }
        setOrderActionError(mapApiReadError(err, t, "order_error_cancel_failed"));
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, removeFromList, t],
  );

  const handleDeleteOrder = useCallback(
    (orderId: string, stateOrStatus: string) => {
      if (deletingId) return;
      setPendingDeleteOrder({ id: orderId, state: stateOrStatus });
    },
    [deletingId],
  );

  const cancelDeleteOrder = useCallback(() => {
    if (deletingId) return;
    setPendingDeleteOrder(null);
  }, [deletingId]);

  const confirmDeleteOrder = useCallback(async () => {
    if (!pendingDeleteOrder || deletingId) return;
    const { id, state } = pendingDeleteOrder;
    setPendingDeleteOrder(null);
    await executeDeleteOrder(id, state);
  }, [pendingDeleteOrder, deletingId, executeDeleteOrder]);


  const effectiveLoading = loading || (isGuideOrdersListHat(ordersListHat) && !guideHatResolved);

  return {
    t,
    loading: effectiveLoading,
    ordersListHat,
    guideRowId,
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
  };
}
