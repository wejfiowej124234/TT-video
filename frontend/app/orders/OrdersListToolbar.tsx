"use client";



import type { ReactNode } from "react";

import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";



/** 筛选 + 搜索 · 扁平 sticky 条（无独立暖金外框） */

export function OrdersListToolbar({ children }: { children: ReactNode }) {

  return (

    <div className={TT_ORDERS_LIST_L5.toolbarShell} data-tt-orders-toolbar="1">

      <div className={TT_ORDERS_LIST_L5.toolbarInnerFlat}>{children}</div>

    </div>

  );

}


