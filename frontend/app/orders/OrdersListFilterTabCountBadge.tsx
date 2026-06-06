"use client";

import { useEffect, useRef, useState } from "react";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";

/** 筛选 Tab 计数徽章 · 数值变化时暖金 bump（加载更多后平滑更新） */
export function OrdersListFilterTabCountBadge({
  count,
  approximate = false,
  className,
  title,
}: {
  count: number;
  approximate?: boolean;
  className: string;
  title: string;
}) {
  const prevCountRef = useRef(count);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (prevCountRef.current === count) return;
    prevCountRef.current = count;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 420);
    return () => window.clearTimeout(timer);
  }, [count]);

  return (
    <span
      className={`${className} ${bump ? TT_ORDERS_LIST_L5.filterTabCountBump : ""}`}
      aria-hidden
      title={title}
      data-tt-orders-filter-tab-count={count}
      data-tt-orders-filter-tab-count-approx={approximate ? "1" : undefined}
      data-tt-orders-filter-tab-count-bump={bump ? "1" : undefined}
    >
      {approximate ? `≥${count}` : count}
    </span>
  );
}
