"use client";

import { useEffect, useState, useCallback, useMemo, useRef, useId, type FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getOrders, getGuide, orderCancel, getIdempotencyKey, type OrderListItem } from "@/lib/apiClient";
import OrderDetailDrawer, { type OrderDetailItem } from "@/components/market/OrderDetailDrawer";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LocaleProvider";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { OrdersListPageLoadingSkeleton } from "@/components/orders/OrdersListPageLoadingSkeleton";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import {
  orderBadgeVariantFromApiOrder,
  orderProjectionDivergesFromOrderState,
  orderProjectionTerminalDegraded,
  orderStatusLabelKeyFromApiOrder,
} from "@/lib/orderProjectionDisplayStatus";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { dedupeListById, mergeListsUniqueById } from "@/lib/dedupeListById";
import { ordersNewHrefForGuide } from "@/lib/ordersGuideDeepLink";
import { isDraftOrderListState } from "@/lib/isDraftOrderListState";
import { filterOrdersForTransactionalMyOrdersSurface } from "@/lib/communityMeMyOrdersModel";
import { stashEscrowOrderPrefetchFromListItem } from "@/lib/orderEscrowPrefetch";
import { patchOrderListAfterCancelSuccess, patchPreviewOrderAfterCancelSuccess } from "@/lib/ordersListAfterCancel";
import { ORDERS_EXPECT_ORDER_QUERY } from "@/lib/ordersExpectOrderParam";
import {
  ORDERS_ESCROW_AUTO_SYNC_POLL_MS,
  orderListItemWatchesForBackendEscrowSync,
} from "@/lib/ordersEscrowAutoSyncPoll";
import {
  ORDERS_LIST_STATE_QUERY,
  ORDERS_LIST_TERMINAL_FILTER_OPTIONS,
  normalizeOrdersListStateQueryParam,
} from "@/lib/ordersListStateQuery";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { OrdersListRouteSuspense } from "@/components/orders/OrdersListRouteSuspense";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { isUuidString } from "@/lib/isUuidString";
import { parseGuideDetailForRoute } from "@/lib/guideDetailRoutePayload";
import { buildPathnameSearchHref } from "@/lib/marketLoginReturnPath";

/** 本地静态资源，避免生产依赖第三方图床与隐私/可用性风险 */
const ORDER_PLACEHOLDER_IMAGE = "/market-backdrop-travel-guilin-sunset.png";

const ORDERS_PAGE_SIZE = 30;

type BookGuideResolve =
  | "idle"
  | "checking"
  | "valid"
  | "invalid_not_found"
  | "invalid_load"
  /** `book_guide` 非 UUID：不发起无意义请求 */
  | "invalid_book_guide_id";

/** 列表项 → 市场行程抽屉（`GET /api/v1/orders` 与 `GET /api/v1/discover/orders` 同形字段；OrderDetailDrawer 有 embedded itinerary 则跳过 getOrder） */
function orderListItemToDetailDrawer(item: OrderListItem): OrderDetailItem {
  return {
    id: String(item.id),
    amount: item.amount,
    currency: item.currency,
    state: item.state,
    status: item.status,
    sub_status: item.sub_status,
    display_status: item.display_status,
    projection_terminal: item.projection_terminal,
    destination: item.destination,
    country: item.country,
    city: item.city,
    days: item.days,
    image: item.image ?? null,
    escrow_address: item.escrow_address ?? null,
    breakdown: item.breakdown ?? null,
    itinerary: item.itinerary ?? null,
  };
}

/** 我的订单（真实世界标准 UI/UX：卡片图+状态徽章+主次操作）；支持 ?book_guide=:id 预约向导引导 */
function OrdersPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bookGuideParam = useMemo(() => (searchParams.get("book_guide") ?? "").trim(), [searchParams]);
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
  const ordersStateFilterId = useId();
  /** B-036：`book_guide` 须 `getGuide` 命中才展示「预约」正反馈；否则 banner + /guides /market */
  const [bookGuideResolve, setBookGuideResolve] = useState<BookGuideResolve>("idle");
  const bookGuideFetchGen = useRef(0);

  useEffect(() => {
    if (!bookGuideParam) {
      setBookGuideResolve("idle");
      return;
    }
    if (!isUuidString(bookGuideParam)) {
      setBookGuideResolve("invalid_book_guide_id");
      return;
    }
    const gen = ++bookGuideFetchGen.current;
    setBookGuideResolve("checking");
    getGuide(bookGuideParam)
      .then((raw) => {
        if (gen !== bookGuideFetchGen.current) return;
        if (!parseGuideDetailForRoute(raw, bookGuideParam)) {
          setBookGuideResolve("invalid_load");
          return;
        }
        setBookGuideResolve("valid");
      })
      .catch((err) => {
        if (gen !== bookGuideFetchGen.current) return;
        const msg = err instanceof Error ? err.message : "";
        if (msg === "guide_not_found" || msg === "not_found") {
          setBookGuideResolve("invalid_not_found");
          return;
        }
        if (typeof window !== "undefined") {
          console.error("OrdersPage book_guide getGuide:", err);
        }
        setBookGuideResolve("invalid_load");
      });
  }, [bookGuideParam]);
  const ordersLoginReturnPath = useMemo(() => {
    const base = pathname && pathname !== "/" ? pathname : "/orders";
    const q = searchParams?.toString() ?? "";
    return q ? `${base}?${q}` : base;
  }, [pathname, searchParams]);
  const [list, setList] = useState<OrderListItem[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  /** 列表已展示时取消订单等操作失败：内联提示，勿用 pageError 挡掉整页列表 */
  const [orderActionError, setOrderActionError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersNextCursor, setOrdersNextCursor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<OrderDetailItem | null>(null);
  /** B-048：静默重拉首屏时不挡整页（`refreshOrders({ silent: true })`） */
  const [listSyncing, setListSyncing] = useState(false);
  const [expectOrderBanner, setExpectOrderBanner] = useState(false);
  const expectSilentRetryScheduled = useRef(false);
  const expectSilentRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stripExpectOrderQuery = useCallback(() => {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    if (!p.has(ORDERS_EXPECT_ORDER_QUERY)) return;
    p.delete(ORDERS_EXPECT_ORDER_QUERY);
    const q = p.toString();
    router.replace(buildPathnameSearchHref(pathname, q));
  }, [pathname, router, searchParams]);

  /** B-071：非法 `state=` 从 URL 剔除，避免仅前端假筛选 */
  useEffect(() => {
    if (!rawOrdersStateQ) return;
    if (ordersListStateParam != null) return;
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    p.delete(ORDERS_LIST_STATE_QUERY);
    const q = p.toString();
    router.replace(buildPathnameSearchHref(pathname, q));
  }, [rawOrdersStateQ, ordersListStateParam, pathname, router, searchParams]);

  /** 非法 `expect_order` 与列表 UUID 不一致时只会误提示；从 URL 剔除（与非法 `state=` 同源策略） */
  useEffect(() => {
    if (!expectOrderId) return;
    if (isUuidString(expectOrderId)) return;
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    p.delete(ORDERS_EXPECT_ORDER_QUERY);
    const q = p.toString();
    router.replace(buildPathnameSearchHref(pathname, q));
  }, [expectOrderId, pathname, router, searchParams]);

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
      getOrders({ limit: ORDERS_PAGE_SIZE, state: ordersListStateParam ?? undefined })
        .then((r) => {
          const raw = (r.items as OrderListItem[]) ?? [];
          const deduped = dedupeListById(raw, (o) => String(o.id ?? ""));
          setList(filterOrdersForTransactionalMyOrdersSurface(deduped));
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
    [router, ordersLoginReturnPath, t, ordersListStateParam],
  );

  const loadMoreOrders = useCallback(() => {
    if (!ordersNextCursor || !ordersHasMore || loadingMore) return;
    setLoadMoreError(null);
    setLoadingMore(true);
    getOrders({
      limit: ORDERS_PAGE_SIZE,
      cursor: ordersNextCursor,
      state: ordersListStateParam ?? undefined,
    })
      .then((r) => {
        setList((prev) => {
          const merged = mergeListsUniqueById(prev, (r.items as OrderListItem[]) ?? [], (o) => String(o.id ?? ""));
          return filterOrdersForTransactionalMyOrdersSurface(merged);
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
  }, [ordersNextCursor, ordersHasMore, loadingMore, router, ordersLoginReturnPath, t, ordersListStateParam]);

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

  useEffect(() => {
    if (!expectOrderId) {
      setExpectOrderBanner(false);
      expectSilentRetryScheduled.current = false;
      if (expectSilentRetryTimeoutRef.current != null) {
        clearTimeout(expectSilentRetryTimeoutRef.current);
        expectSilentRetryTimeoutRef.current = null;
      }
      return;
    }
    if (loading || listSyncing) return;

    const found = list.some((o) => String(o.id) === expectOrderId);
    if (found) {
      setExpectOrderBanner(false);
      expectSilentRetryScheduled.current = false;
      if (expectSilentRetryTimeoutRef.current != null) {
        clearTimeout(expectSilentRetryTimeoutRef.current);
        expectSilentRetryTimeoutRef.current = null;
      }
      stripExpectOrderQuery();
      return;
    }

    if (!expectSilentRetryScheduled.current) {
      expectSilentRetryScheduled.current = true;
      expectSilentRetryTimeoutRef.current = setTimeout(() => {
        expectSilentRetryTimeoutRef.current = null;
        refreshOrders({ silent: true });
      }, 650);
      return () => {
        if (expectSilentRetryTimeoutRef.current != null) {
          clearTimeout(expectSilentRetryTimeoutRef.current);
          expectSilentRetryTimeoutRef.current = null;
        }
        expectSilentRetryScheduled.current = false;
      };
    }

    setExpectOrderBanner(true);
  }, [expectOrderId, loading, listSyncing, list, refreshOrders, stripExpectOrderQuery]);

  const removeFromList = useCallback((orderId: string) => {
    setList((prev) => prev.filter((o) => String(o.id) !== orderId));
  }, []);

  const handleDeleteOrder = useCallback(
    async (
      orderId: string,
      stateOrStatus: string,
      tConfirm: (k: string) => string
    ) => {
      if (deletingId) return;
      if (!window.confirm(tConfirm("escrow_deleteConfirm"))) return;
      setOrderActionError(null);
      setDeletingId(orderId);
      const state = (stateOrStatus ?? "").toLowerCase();
      /** 已是终态取消：仅本地从列表移除（与 GET 列表仍可能含 cancelled 行的「清理视图」一致） */
      if (state === "cancelled" || state === "canceled") {
        removeFromList(orderId);
        setPreviewOrder((po) => (po && String(po.id) === orderId ? null : po));
        setDeletingId(null);
        return;
      }
      try {
        const raw = await orderCancel(orderId, getIdempotencyKey());
        const data = raw as { order?: { id?: string; status?: string; state?: string } };
        setList((prev) => patchOrderListAfterCancelSuccess(prev, orderId, data.order));
        setPreviewOrder((po) => patchPreviewOrderAfterCancelSuccess(po, orderId, data.order));
      } catch (err) {
        if (typeof window !== "undefined") {
          console.error("OrdersPage orderCancel:", err);
        }
        setOrderActionError(mapApiReadError(err, t, "order_error_cancel_failed"));
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, removeFromList, t]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-main" aria-label={t("orders_myOrders")}>
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12" aria-busy="true">
          <h1 className="sr-only">{t("orders_myOrders")}</h1>
          <p className="sr-only" role="status">
            {t("common_loading")}
          </p>
          <div className="mb-8 space-y-3">
            <div className="h-10 w-56 max-w-[70%] rounded-lg bg-ink-100 animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-full max-w-xl rounded bg-ink-50 animate-pulse motion-reduce:animate-none" />
            <div className="h-14 w-full max-w-3xl rounded-[var(--radius-md)] bg-ink-50/90 animate-pulse motion-reduce:animate-none" />
          </div>
          <OrdersListPageLoadingSkeleton />
        </section>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-12 flex justify-center">
          <ProductCrossNav
            ariaLabelKey="orders_list_relatedNav_aria"
            showGuides
            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
          />
        </div>
      </main>
    );
  }
  if (pageError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-main p-8" aria-label={t("orders_myOrders")}>
        <div className="max-w-md w-full space-y-4">
          <h1 className="sr-only">{t("orders_myOrders")}</h1>
          <ApiErrorAlert message={pageError} />
          <form
            className="flex justify-center"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              refreshOrders();
            }}
          >
            <button
              type="submit"
              data-tt-orders-page-error-retry="1"
              aria-label={t("common_retry")}
              className={`${touchTargetLink44Classes} rounded-full border border-travel-500/50 bg-travel-500/10 px-4 py-2 text-meta font-medium text-travel-700 hover:text-travel-800 hover:bg-travel-500/20 motion-sub min-h-[44px] inline-flex items-center justify-center ${travelFocusRingOffset2Classes}`}
            >
              {t("common_retry")}
            </button>
          </form>
          <p className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-small text-ink-600">
            <Link
              href={`/auth/login?returnUrl=${encodeURIComponent(ordersLoginReturnPath)}`}
              className={`${touchTargetLink44Classes} text-travel-500 underline underline-offset-2 ${travelFocusRingOffset2Classes}`}
            >
              {t("orders_goLogin")}
            </Link>
            <span className="text-ink-300" aria-hidden>
              ·
            </span>
            <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 underline underline-offset-2 ${travelFocusRingOffset2Classes}`}>
              {t("orders_nav_home")}
            </Link>
            <span className="text-ink-300" aria-hidden>
              ·
            </span>
            <Link href="/help" className={`${touchTargetLink44Classes} text-travel-500 underline underline-offset-2 ${travelFocusRingOffset2Classes}`}>
              {t("help_title")}
            </Link>
          </p>
          <ProductCrossNav ariaLabelKey="orders_list_relatedNav_aria" showGuides />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-main" aria-label={t("orders_myOrders")}>
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8">
          <h1 className="text-h2 font-bold text-ink-900 tracking-tight">{t("orders_myOrders")}</h1>
          <p className="text-body text-ink-600 mt-1">{t("orders_desc")}</p>
          <p className="mt-3 rounded-[var(--radius-md)] border border-ink-200/80 bg-bg-soft/90 px-3 py-2 text-meta leading-snug text-ink-700">
            {t("orders_list_hides_marketplace_drafts")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label htmlFor={ordersStateFilterId} className="text-small font-medium text-ink-700">
              {t("orders_list_stateFilter_label")}
            </label>
            <select
              id={ordersStateFilterId}
              value={ordersListStateParam ?? ""}
              onChange={(e) => setOrdersListStateInUrl(e.target.value)}
              className={`min-h-[44px] rounded-[var(--radius-md)] border border-ink-200 bg-bg-console px-3 py-2 text-small text-ink-900 focus:outline-none ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              <option value="">{t("orders_list_state_all")}</option>
              {ORDERS_LIST_TERMINAL_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </header>

        {orderActionError ? (
          <div className="mb-6 space-y-2 rounded-[var(--radius-lg)] border border-ink-200/80 bg-bg-console/80 p-4 shadow-soft" role="alert" aria-live="polite">
            <ApiErrorAlert message={orderActionError} />
            <div className="flex flex-wrap items-center gap-2">
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  refreshOrders();
                }}
              >
                <button
                  type="submit"
                  data-tt-orders-inline-action-retry="1"
                  disabled={loading}
                  aria-busy={loading ? true : undefined}
                  className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes}`}
                >
                  {loading ? t("common_retrying") : t("common_retry")}
                </button>
              </form>
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  setOrderActionError(null);
                }}
              >
                <button
                  type="submit"
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] text-ink-600 hover:bg-ink-100 hover:text-ink-900 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                  aria-label={t("common_closeAlert")}
                >
                  ✕
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {expectOrderId && expectOrderBanner ? (
          <div
            className="mb-6 rounded-[var(--radius-lg)] border border-ink-200/80 bg-bg-soft/80 p-4 shadow-soft"
            role="status"
            aria-live="polite"
          >
            <p className="text-small text-ink-800">{t("orders_list_expectNewOrder_banner")}</p>
            <form
              className="mt-3 inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (listSyncing) return;
                refreshOrders({ silent: true });
              }}
            >
              <button
                type="submit"
                data-tt-orders-expect-order-refresh="1"
                disabled={listSyncing}
                aria-busy={listSyncing ? true : undefined}
                className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes}`}
              >
                {listSyncing ? t("common_retrying") : t("orders_list_expectNewOrder_refresh")}
              </button>
            </form>
          </div>
        ) : null}

        {bookGuideParam ? (
          <>
            {bookGuideResolve === "checking" ? (
              <div
                className="mb-6 rounded-[var(--radius-xl)] border border-ink-200/90 bg-bg-soft p-4 sm:p-5"
                role="status"
                aria-live="polite"
              >
                <p className="text-small text-ink-700">{t("orders_bookGuide_checking")}</p>
              </div>
            ) : null}
            {bookGuideResolve === "invalid_not_found" ||
            bookGuideResolve === "invalid_load" ||
            bookGuideResolve === "invalid_book_guide_id" ? (
              <div
                className="mb-6 rounded-[var(--radius-xl)] border border-warning/45 bg-warning/10 p-4 sm:p-5"
                role="alert"
                aria-live="polite"
              >
                <p className="text-small font-semibold text-ink-900 mb-1">
                  {bookGuideResolve === "invalid_book_guide_id"
                    ? t("orders_bookGuide_badIdTitle")
                    : bookGuideResolve === "invalid_not_found"
                      ? t("orders_bookGuide_invalidTitle")
                      : t("orders_bookGuide_verifyFailedTitle")}
                </p>
                <p className="text-meta text-ink-700 mb-4">
                  {bookGuideResolve === "invalid_book_guide_id"
                    ? t("orders_bookGuide_badIdDesc")
                    : bookGuideResolve === "invalid_not_found"
                      ? t("orders_bookGuide_invalidDesc")
                      : t("orders_bookGuide_verifyFailedDesc")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/guides"
                    className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                  >
                    {t("orders_guides")}
                  </Link>
                  <Link
                    href="/market"
                    className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                  >
                    {t("orders_market")}
                  </Link>
                  <Link
                    href="/orders"
                    className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-ink-200 px-4 py-2 text-small text-ink-600 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                  >
                    {t("orders_bookGuide_clearParam")}
                  </Link>
                </div>
              </div>
            ) : null}
            {bookGuideResolve === "valid" ? (
              <div
                className="mb-6 rounded-[var(--radius-xl)] border border-travel-500/30 bg-travel-500/5 p-4 sm:p-5"
                role="status"
              >
                <p className="text-small font-semibold text-ink-800 mb-1">{t("orders_bookingHint")}</p>
                <p className="text-meta text-ink-600 mb-4">{t("orders_bookingDesc")}</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={ordersNewHrefForGuide(bookGuideParam)}
                    className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                  >
                    {t("orders_bookingQuickCreate")}
                  </Link>
                  <Link
                    href="/"
                    className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-travel-500/40 bg-white px-4 py-2 text-small font-medium text-travel-800 hover:bg-travel-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                  >
                    {t("orders_goCreateItin")}
                  </Link>
                  <Link
                    href={`/itinerary/new?guide_id=${encodeURIComponent(bookGuideParam)}`}
                    className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                  >
                    {t("orders_createDraft")}
                  </Link>
                  <Link
                    href="/market"
                    className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-ink-200 px-4 py-2 text-small text-ink-600 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                  >
                    {t("orders_backMarket")}
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {list.length === 0 ? (
          <div className="py-10 text-center space-y-4" role="status" aria-label={t("orders_empty")}>
            <p className="text-body text-ink-500 max-w-md mx-auto">{t("orders_empty")}</p>
            <p className="text-meta text-ink-500 max-w-md mx-auto">{t("orders_emptySub")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] bg-travel-500 px-5 py-2.5 text-small font-medium text-white hover:bg-travel-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
              >
                {t("empty_goCreateItinerary")}
              </Link>
              <Link
                href="/itinerary/new"
                className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-ink-300 bg-white px-5 py-2.5 text-small font-medium text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
              >
                {t("empty_createDraft")}
              </Link>
            </div>
            <ProductCrossNav
              ariaLabelKey="orders_list_relatedNav_aria"
              showGuides
              className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
            />
          </div>
        ) : (
          <>
          <p className="text-meta text-ink-500 mb-3" role="note">
            {t("orders_clickCardHint")}
          </p>
          <ul className="space-y-4" role="list">
            {list.map((item, i) => {
              const id = item?.id ?? String(i);
              const state = (item?.state ?? item?.status ?? "").toLowerCase();
              const statusKey = orderStatusLabelKeyFromApiOrder(item);
              const statusLabel = t(statusKey) || state || t("ui_em_dash");
              const variant = orderBadgeVariantFromApiOrder(item);
              const projectionDiverges = orderProjectionDivergesFromOrderState(item);
              const projectionDegraded = orderProjectionTerminalDegraded(item);
              const isDraftOrder = isDraftOrderListState(state);
              const canDelete =
                state === "created" ||
                state === "accepted" ||
                state === "draft" ||
                state === "cancelled" ||
                state === "canceled";
              const dest = item?.destination ?? item?.city ?? item?.country ?? id;
              const dateLine =
                item?.travel_date && item?.days != null
                  ? `${item.travel_date} · ${item.days} ${t("orders_days")}`
                  : item?.travel_date ?? (item?.days != null ? `${item.days} ${t("orders_days")}` : null) ?? t("ui_em_dash");
              const imageUrl = item?.image || ORDER_PLACEHOLDER_IMAGE;

              const badgeClass =
                variant === "success"
                  ? "bg-success/10 text-success"
                  : variant === "danger"
                    ? "bg-danger/10 text-danger"
                    : variant === "warning"
                      ? "bg-warning/10 text-warning"
                      : "bg-ink-100 text-ink-600";

              const escrowHref = item?.id ? `/escrow/${encodeURIComponent(String(item.id))}` : null;
              const stashListItemEscrowPayPrefetch = () => stashEscrowOrderPrefetchFromListItem(item);
              const coverAlt = t("orders_cardCoverAlt", { dest: String(dest) });

              const summaryBlock = (
                <>
                  <h2 id={`order-title-${id}`} className="text-body font-semibold text-ink-900 truncate">
                    {dest}
                  </h2>
                  <p className="text-meta text-ink-500 mt-0.5">{dateLine}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex rounded-[var(--radius-md)] px-2.5 py-0.5 text-meta font-medium ${badgeClass}`}>
                      {statusLabel}
                    </span>
                    {item?.amount != null && (
                      <span className="text-body font-semibold text-ink-900">
                        {item.amount} {item?.currency ?? t("order_defaultSettlementToken")}
                      </span>
                    )}
                  </div>
                  {(projectionDiverges || projectionDegraded) ? (
                    <p className="text-meta text-white mt-1.5 leading-snug" role="note">
                      {projectionDegraded
                        ? t("orders_projection_ssot_degraded")
                        : t("orders_projection_ssot_notice_divergent_short")}
                    </p>
                  ) : null}
                  {item.escrow_address ? (
                    <p
                      className="text-meta text-ink-500 mt-1.5 font-mono truncate max-w-full"
                      title={item.escrow_address}
                    >
                      {t("escrow_contract")}
                      {shortEvmAddress(item.escrow_address)}
                    </p>
                  ) : null}
                </>
              );

              return (
                <li key={id}>
                  <article
                    className={`relative rounded-[var(--radius-xl)] overflow-hidden transition-shadow motion-reduce:transition-none hover:shadow-medium motion-reduce:hover:shadow-none ${
                      isDraftOrder
                        ? "border-2 border-dashed border-travel-500/50 bg-travel-50/60 shadow-soft ring-1 ring-travel-500/10"
                        : "border border-ink-200 bg-white shadow-soft"
                    }`}
                    aria-labelledby={`order-title-${id}`}
                  >
                    {/* 54-S7：整卡一处可聚焦链接（aria-labelledby），避免与摘要/封面三重重复；付款/删除保持独立可点 */}
                    {escrowHref ? (
                      <Link
                        href={escrowHref}
                        onClick={stashListItemEscrowPayPrefetch}
                        className={`absolute inset-0 z-0 rounded-[var(--radius-xl)] ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                        aria-label={t("orders_cardLinkAria", { dest: String(dest) })}
                      />
                    ) : null}
                    <div className="relative z-10 flex flex-col sm:flex-row pointer-events-none">
                      <div className="relative w-full sm:w-44 shrink-0 aspect-[16/10] sm:aspect-auto sm:h-[180px] bg-ink-100">
                        <Image
                          src={imageUrl}
                          alt={coverAlt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 176px"
                          unoptimized
                          priority={i === 0}
                          fetchPriority={i === 0 ? "high" : "low"}
                        />
                      </div>
                      <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0 flex-1">{summaryBlock}</div>
                        <div className="relative z-20 flex flex-wrap items-center gap-2 shrink-0 pointer-events-auto">
                          {item?.id && escrowHref && isDraftOrder ? (
                            <Link
                              href={escrowHref}
                              onClick={stashListItemEscrowPayPrefetch}
                              className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                            >
                              {t("orders_draftContinueEdit")}
                            </Link>
                          ) : null}
                          {item?.id ? (
                            <form
                              className="inline"
                              onSubmit={(e: FormEvent) => {
                                e.preventDefault();
                                setPreviewOrder(orderListItemToDetailDrawer(item));
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-white px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console"
                              >
                                {t("orders_itineraryPreview")}
                              </button>
                            </form>
                          ) : null}
                          {item?.id && orderLikeMayOnchainDeposit(item) && (
                            <Link
                              href={`/pay?orderId=${encodeURIComponent(String(item.id))}`}
                              onClick={stashListItemEscrowPayPrefetch}
                              className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-travel-500/50 bg-travel-500/5 px-4 py-2 text-small font-medium text-travel-600 hover:bg-travel-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`}
                            >
                              {t("orders_payHub")}
                            </Link>
                          )}
                          {canDelete && item?.id && (
                            <form
                              className="inline"
                              onSubmit={(e: FormEvent) => {
                                e.preventDefault();
                                void handleDeleteOrder(id, state, t);
                              }}
                            >
                              <button
                                type="submit"
                                disabled={deletingId === item.id}
                                aria-busy={deletingId === item.id ? true : undefined}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 px-4 py-2 text-small font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console"
                                aria-label={t("escrow_deleteOrder")}
                              >
                                {deletingId === item.id ? t("common_submitting") : t("escrow_deleteOrder")}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          {loadMoreError != null ? (
            <div
              className="mt-6 rounded-[var(--radius-lg)] border border-ink-200/80 bg-bg-console/80 p-4 space-y-3 shadow-soft"
              role="alert"
              aria-live="polite"
              data-tt-orders-load-more-error="1"
            >
              <p className="text-meta leading-snug text-ink-700">{t("orders_loadMore_failed_intro")}</p>
              <ApiErrorAlert message={loadMoreError} />
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
                  className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingMore ? t("common_retrying") : t("common_retry")}
                </button>
              </form>
            </div>
          ) : null}
          {ordersHasMore && loadMoreError == null && (
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
                  className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-5 py-2.5 text-small font-medium text-ink-800 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? t("common_loadingMore") : t("common_loadMore")}
                </button>
              </form>
            </div>
          )}
          </>
        )}

        <OrderDetailDrawer order={previewOrder} onClose={() => setPreviewOrder(null)} loginReturnPath={ordersLoginReturnPath} />

        <footer className="mt-12 pt-8 border-t border-ink-200">
          <TrustInfraWall />
          <ProductCrossNav
            ariaLabelKey="orders_list_relatedNav_aria"
            showGuides
            className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
          />
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-meta text-ink-500">
            <Link href="/community/me" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
              {t("orders_me")}
            </Link>
            <Link href="/guides" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
              {t("orders_guides")}
            </Link>
          </p>
        </footer>
      </section>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <OrdersListRouteSuspense>
      <OrdersPageInner />
    </OrdersListRouteSuspense>
  );
}
