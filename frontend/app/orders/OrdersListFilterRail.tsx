"use client";

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ORDERS_LIST_FILTER_TAB_OPTIONS, ORDERS_LIST_IN_PROGRESS_VALUE } from "@/lib/ordersListStateQuery";
import type { OrdersListStateCounts } from "@/lib/orders/ordersListStateCounts";
import { ordersListFilterTabCount } from "@/lib/orders/ordersListStateCounts";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { OrdersListFilterTabCountBadge } from "./OrdersListFilterTabCountBadge";

type TabKey = string;

/**
 * 筛选胶囊条 · 纯 CSS `sticky` + 滑动暖金指示 pill（无 IntersectionObserver）。
 */
export function OrdersListFilterRail({
  t,
  ordersStateFilterId,
  ordersListStateParam,
  setOrdersListStateInUrl,
  stateCounts,
  countsLoadedOnly = false,
  embedded = false,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ordersStateFilterId: string;
  ordersListStateParam: string | null | undefined;
  setOrdersListStateInUrl: (next: string) => void;
  stateCounts: OrdersListStateCounts;
  /** 仍有未加载分页时，Tab 计数仅为已加载旁证 */
  countsLoadedOnly?: boolean;
  embedded?: boolean;
}) {
  const activeState = ordersListStateParam ?? "";

  const filterTabs = [
    { value: "", labelKey: "orders_list_state_all" as const },
    ...ORDERS_LIST_FILTER_TAB_OPTIONS,
  ];

  const countsSignature = `${stateCounts.__all__}:${stateCounts.in_progress}:${stateCounts.completed}:${stateCounts.cancelled}:${stateCounts.disputed}`;

  const scrollRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<TabKey, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const tabKey = (value: string) => value || "__rail_all__";

  useLayoutEffect(() => {
    const update = () => {
      const btn = tabRefs.current.get(tabKey(activeState));
      const bar = barRef.current;
      if (!btn || !bar) return;
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    update();
    const scroll = scrollRef.current;
    const btn = tabRefs.current.get(tabKey(activeState));
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    window.addEventListener("resize", update);
    scroll?.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      scroll?.removeEventListener("scroll", update);
    };
  }, [activeState, filterTabs.length, countsSignature]);

  return (
    <div
      className={embedded ? TT_ORDERS_LIST_L5.filterRailEmbedded : `${TT_ORDERS_LIST_L5.stickyFilterRail} -mt-1`}
      role="region"
      aria-labelledby={ordersStateFilterId}
      data-tt-orders-filter-rail="1"
    >
      <p id={ordersStateFilterId} className={TT_ORDERS_LIST_L5.filterRailLabel}>
        {t("orders_list_stateFilter_label")}
      </p>
      <div className={`mx-auto flex w-full max-w-4xl flex-col gap-2 ${embedded ? "" : "pt-2"} sm:flex-row sm:items-center`}>
        <div ref={scrollRef} className={TT_ORDERS_LIST_L5.filterBarScroll}>
          <div
            ref={barRef}
            className={`${TT_ORDERS_LIST_L5.filterBar} relative w-max min-w-full flex-nowrap sm:w-auto sm:flex-wrap`}
            role="group"
            aria-labelledby={ordersStateFilterId}
          >
            {indicator && indicator.width > 0 ? (
              <div
                className={TT_ORDERS_LIST_L5.filterTabIndicator}
                style={{ left: indicator.left, width: indicator.width }}
                aria-hidden
              />
            ) : null}
            {filterTabs.map((tab) => {
              const selected = activeState === tab.value;
              const key = tabKey(tab.value);
              const tabCount = ordersListFilterTabCount(stateCounts, tab.value);
              const tabLabel = t(tab.labelKey);
              const countBadgeClass = selected
                ? TT_ORDERS_LIST_L5.filterTabCountOnIndicator
                : TT_ORDERS_LIST_L5.filterTabCountBadge;
              return (
                <form
                  key={key}
                  className="inline shrink-0"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    setOrdersListStateInUrl(tab.value);
                  }}
                >
                  <button
                    ref={(el) => {
                      if (el) tabRefs.current.set(key, el);
                      else tabRefs.current.delete(key);
                    }}
                    type="submit"
                    aria-pressed={selected}
                    className={`${TT_ORDERS_LIST_L5.filterTabBase} whitespace-nowrap ${
                      selected
                        ? `${TT_ORDERS_LIST_L5.filterTabOnIndicator} border border-transparent bg-transparent shadow-none ring-0`
                        : TT_ORDERS_LIST_L5.filterTabIdle
                    }`}
                    aria-label={t("orders_list_filter_tab_count_aria", { label: tabLabel, count: tabCount })}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{tabLabel}</span>
                      {tabCount > 0 ? (
                        <OrdersListFilterTabCountBadge
                          count={tabCount}
                          approximate={countsLoadedOnly}
                          className={countBadgeClass}
                          title={t("orders_list_filter_tab_count_title")}
                        />
                      ) : null}
                    </span>
                  </button>
                </form>
              );
            })}
          </div>
        </div>
        {countsLoadedOnly ? (
          <p className={TT_ORDERS_LIST_L5.searchScopeHint} role="note" data-tt-orders-filter-count-hint="1">
            {activeState === ORDERS_LIST_IN_PROGRESS_VALUE
              ? t("orders_list_in_progress_scope_hint")
              : t("orders_list_filter_count_loaded_only_hint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
