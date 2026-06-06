"use client";

import { useCallback, useEffect, useRef } from "react";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { OrdersListSearchIcon } from "@/components/orders/OrdersListMetaIcons";

export function OrdersListSearchBar({
  t,
  searchQuery,
  onSearchQueryChange,
  searchInputId,
  searchPending = false,
  searchScopeLoadedOnly = false,
  embedded = false,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  searchQuery: string;
  onSearchQueryChange: (next: string) => void;
  searchInputId: string;
  searchPending?: boolean;
  /** 仍有分页时提示搜索仅覆盖已加载订单 */
  searchScopeLoadedOnly?: boolean;
  embedded?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = searchQuery.trim();
  const clearSearch = useCallback(() => {
    onSearchQueryChange("");
    inputRef.current?.blur();
  }, [onSearchQueryChange]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      const inEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (inEditable) return;
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (e.key === "Escape" && trimmed) {
        e.preventDefault();
        clearSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [trimmed, clearSearch]);

  return (
    <div
      className={embedded ? "min-w-0" : TT_ORDERS_LIST_L5.searchWrap}
      role="search"
      data-tt-orders-search="1"
    >
      <label htmlFor={searchInputId} className="sr-only">
        {t("orders_list_search_label")}
      </label>
      <div className="relative min-w-0 flex-1">
        <span className={`${TT_ORDERS_LIST_L5.searchIcon} inline-flex`} aria-hidden>
          <OrdersListSearchIcon className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          id={searchInputId}
          type="search"
          enterKeyHint="search"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && trimmed) {
              e.preventDefault();
              clearSearch();
            }
          }}
          placeholder={t("orders_list_search_placeholder")}
          className={`${TT_ORDERS_LIST_L5.searchInput}${trimmed || searchPending ? " pr-10" : ""}`}
          aria-label={t("orders_list_search_aria")}
          aria-busy={searchPending ? true : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {searchPending ? (
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${TT_ORDERS_LIST_L5.searchPendingDot}`}
            role="status"
            aria-label={t("orders_list_search_pending")}
          />
        ) : trimmed ? (
          <button
            type="button"
            className={TT_ORDERS_LIST_L5.searchClearBtn}
            onClick={clearSearch}
            aria-label={t("orders_list_search_clear_aria")}
          >
            ✕
          </button>
        ) : null}
      </div>
      {searchScopeLoadedOnly ? (
        <p className={TT_ORDERS_LIST_L5.searchScopeHint} role="note" data-tt-orders-search-scope-hint="1">
          {t("orders_list_search_scope_hint")}
        </p>
      ) : null}
      <p className="sr-only">{t("orders_list_search_shortcut_hint")}</p>
    </div>
  );
}
