"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildPathnameSearchHref } from "@/lib/marketLoginReturnPath";
import type { OrderListItem } from "@/lib/apiClient";
import {
  ORDERS_LIST_SEARCH_QUERY,
  filterOrdersListByClientSearch,
  useDebouncedValue,
} from "@/lib/orders/ordersListClientSearch";

const SEARCH_DEBOUNCE_MS = 220;

export function useOrdersListClientSearch(list: OrderListItem[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = useMemo(
    () => (searchParams.get(ORDERS_LIST_SEARCH_QUERY) ?? "").trim(),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(urlQuery);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const searchPending = searchInput.trim() !== debouncedSearch.trim();

  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next === urlQuery) return;
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    if (!next) p.delete(ORDERS_LIST_SEARCH_QUERY);
    else p.set(ORDERS_LIST_SEARCH_QUERY, next);
    router.replace(buildPathnameSearchHref(pathname, p.toString()));
  }, [debouncedSearch, urlQuery, pathname, router, searchParams]);

  const displayedList = useMemo(
    () => filterOrdersListByClientSearch(list, debouncedSearch),
    [list, debouncedSearch],
  );
  const searchActive = debouncedSearch.trim().length > 0;

  const clearSearch = useCallback(() => setSearchInput(""), []);

  return {
    searchInput,
    setSearchInput,
    debouncedSearch,
    searchPending,
    searchActive,
    displayedList,
    clearSearch,
  };
}
