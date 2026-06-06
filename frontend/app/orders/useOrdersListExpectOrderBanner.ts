"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { OrderListItem } from "@/lib/apiClient";
import { isUuidString } from "@/lib/isUuidString";
import { ORDERS_EXPECT_ORDER_QUERY } from "@/lib/ordersExpectOrderParam";
import { buildPathnameSearchHref } from "@/lib/marketLoginReturnPath";

/** B-048：`expect_order` 深链静默重拉与「未在列表中看到该订单」横幅 */
export function useOrdersListExpectOrderBanner(args: {
  expectOrderId: string;
  pathname: string;
  searchParams: ReadonlyURLSearchParams;
  replaceHref: (href: string) => void;
  loading: boolean;
  listSyncing: boolean;
  list: OrderListItem[];
  refreshOrders: (options?: { silent?: boolean }) => void;
}): boolean {
  const { expectOrderId, pathname, searchParams, replaceHref, loading, listSyncing, list, refreshOrders } = args;
  const [expectOrderBanner, setExpectOrderBanner] = useState(false);
  const expectSilentRetryScheduled = useRef(false);
  const expectSilentRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stripExpectOrderQuery = useCallback(() => {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    if (!p.has(ORDERS_EXPECT_ORDER_QUERY)) return;
    p.delete(ORDERS_EXPECT_ORDER_QUERY);
    const q = p.toString();
    replaceHref(buildPathnameSearchHref(pathname, q));
  }, [pathname, replaceHref, searchParams]);

  /** 非法 `expect_order` 与列表 UUID 不一致时只会误提示；从 URL 剔除（与非法 `state=` 同源策略） */
  useEffect(() => {
    if (!expectOrderId) return;
    if (isUuidString(expectOrderId)) return;
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    p.delete(ORDERS_EXPECT_ORDER_QUERY);
    const q = p.toString();
    replaceHref(buildPathnameSearchHref(pathname, q));
  }, [expectOrderId, pathname, replaceHref, searchParams]);

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

  return expectOrderBanner;
}
