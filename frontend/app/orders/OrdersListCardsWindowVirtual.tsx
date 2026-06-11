"use client";

import type { ReactNode, RefObject } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { OrderListItem } from "@/lib/apiClient";
import {
  ORDERS_LIST_VIRTUAL_ESTIMATE_PX,
  ORDERS_LIST_VIRTUAL_GAP_PX,
  ORDERS_LIST_VIRTUAL_OVERSCAN,
} from "@/lib/orders/ordersListVirtualConstants";

export function OrdersListCardsWindowVirtual({
  list,
  listFocusRef,
  onListFocus,
  onListKeyDown,
  ariaLabel,
  renderItem,
}: {
  list: OrderListItem[];
  listFocusRef: RefObject<HTMLElement | null>;
  onListFocus: () => void;
  onListKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  ariaLabel: string;
  renderItem: (item: OrderListItem, index: number) => ReactNode;
}) {
  const virtualizer = useWindowVirtualizer({
    count: list.length,
    estimateSize: () => ORDERS_LIST_VIRTUAL_ESTIMATE_PX,
    overscan: ORDERS_LIST_VIRTUAL_OVERSCAN,
    gap: ORDERS_LIST_VIRTUAL_GAP_PX,
    getItemKey: (index) => String(list[index]?.id ?? index),
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={listFocusRef as RefObject<HTMLDivElement | null>}
      className="relative w-full outline-none"
      role="list"
      tabIndex={list.length > 0 ? 0 : undefined}
      data-tt-orders-card-list="1"
      data-tt-orders-card-list-virtual="1"
      aria-label={ariaLabel}
      onFocus={onListFocus}
      onKeyDown={onListKeyDown}
    >
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {items.map((vi) => {
          const item = list[vi.index];
          if (!item) return null;
          return (
            <div
              key={String(item.id ?? vi.index)}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              role="listitem"
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${vi.start}px)` }}
            >
              {renderItem(item, vi.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
