"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { OrderListItem } from "@/lib/apiClient";
import { getOrders } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { COMMUNITY_ME_ORDERS_DRAWER_PAGE_SIZE } from "@/lib/communityMeListPageSize";
import {
  filterOrdersForCommunityMeMyOrdersSurface,
  MY_ORDERS_DRAWER_MAX_PAGES,
} from "@/lib/communityMeMyOrdersModel";

export function useCommunityMeOrdersDrawerList(args: {
  fetchNonce: number;
  t: (k: string) => string;
  isLoggedIn: boolean;
  authPending: boolean;
}): {
  rows: OrderListItem[];
  setRows: Dispatch<SetStateAction<OrderListItem[]>>;
  loading: boolean;
  error: string | null;
  needLogin: boolean;
  ordersListTruncated: boolean;
  ordersHasMore: boolean;
  ordersLoadMoreBusy: boolean;
  loadMoreOrders: () => void;
} {
  const { fetchNonce, t, isLoggedIn, authPending } = args;
  const [rows, setRows] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pagesFetched, setPagesFetched] = useState(0);
  const [ordersListTruncated, setOrdersListTruncated] = useState(false);
  const [ordersLoadMoreBusy, setOrdersLoadMoreBusy] = useState(false);
  const loadMoreInFlightRef = useRef(false);

  const normalizeOrdersListPage = (
    page: { has_more?: boolean; next_cursor?: string | null } | undefined,
  ): { has_more?: boolean; next_cursor?: string } | undefined => {
    if (!page) return undefined;
    return { has_more: page.has_more, next_cursor: page.next_cursor ?? undefined };
  };

  const applyOrdersPage = useCallback(
    (raw: OrderListItem[], page: { has_more?: boolean; next_cursor?: string } | undefined, pageCount: number) => {
      const filtered = filterOrdersForCommunityMeMyOrdersSurface(raw);
      setRows((prev) => {
        if (pageCount <= 1) return filtered;
        const seen = new Set(prev.map((o) => String(o.id ?? "")));
        const appended = filtered.filter((o) => !seen.has(String(o.id ?? "")));
        return appended.length > 0 ? [...prev, ...appended] : prev;
      });
      setPagesFetched(pageCount);
      const apiHasMore = Boolean(page?.has_more && page.next_cursor);
      const atCap = pageCount >= MY_ORDERS_DRAWER_MAX_PAGES;
      if (atCap && apiHasMore) {
        setNextCursor(null);
        setOrdersListTruncated(true);
        return;
      }
      const cursor =
        apiHasMore && typeof page?.next_cursor === "string" && page.next_cursor.trim().length > 0
          ? page.next_cursor.trim()
          : null;
      setNextCursor(cursor);
      setOrdersListTruncated(Boolean(cursor) || (atCap && apiHasMore));
    },
    [],
  );

  useEffect(() => {
    if (authPending) return;
    if (!isLoggedIn) {
      setLoading(false);
      setRows([]);
      setError(null);
      setNeedLogin(false);
      setNextCursor(null);
      setPagesFetched(0);
      setOrdersListTruncated(false);
      return;
    }

    let cancelled = false;
    setNeedLogin(false);
    setLoading(true);
    setError(null);
    setNextCursor(null);
    setPagesFetched(0);
    setOrdersListTruncated(false);

    getOrders({ limit: COMMUNITY_ME_ORDERS_DRAWER_PAGE_SIZE })
      .then((r) => {
        if (cancelled) return;
        applyOrdersPage((r.items ?? []) as OrderListItem[], normalizeOrdersListPage(r.page), 1);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof Error && e.message === "login_required") {
          setNeedLogin(true);
          setRows([]);
          return;
        }
        setError(mapApiReadError(e, t, "orders_requestFailed"));
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authPending, isLoggedIn, fetchNonce, t, applyOrdersPage]);

  const ordersHasMore = Boolean(nextCursor) && pagesFetched < MY_ORDERS_DRAWER_MAX_PAGES;

  const loadMoreOrders = useCallback(() => {
    if (!nextCursor || !ordersHasMore || loadMoreInFlightRef.current || !isLoggedIn) return;
    loadMoreInFlightRef.current = true;
    setOrdersLoadMoreBusy(true);
    const cursor = nextCursor;
    getOrders({ limit: COMMUNITY_ME_ORDERS_DRAWER_PAGE_SIZE, cursor })
      .then((r) => {
        applyOrdersPage((r.items ?? []) as OrderListItem[], normalizeOrdersListPage(r.page), pagesFetched + 1);
      })
      .catch((e) => {
        if (e instanceof Error && e.message === "login_required") {
          setNeedLogin(true);
          return;
        }
        setError(mapApiReadError(e, t, "orders_requestFailed"));
      })
      .finally(() => {
        loadMoreInFlightRef.current = false;
        setOrdersLoadMoreBusy(false);
      });
  }, [applyOrdersPage, isLoggedIn, nextCursor, ordersHasMore, pagesFetched, t]);

  return {
    rows,
    setRows,
    loading,
    error,
    needLogin,
    ordersListTruncated,
    ordersHasMore,
    ordersLoadMoreBusy,
    loadMoreOrders,
  };
}
