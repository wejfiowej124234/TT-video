"use client";

import { OrdersNewRouteSuspense } from "@/components/orders/OrdersNewRouteSuspense";
import { OrdersNewPageMain } from "./OrdersNewPageMain";
import { useOrdersNewPage } from "./useOrdersNewPage";

function NewOrderPageInner() {
  const vm = useOrdersNewPage();
  return <OrdersNewPageMain vm={vm} />;
}

export default function NewOrderPage() {
  return (
    <OrdersNewRouteSuspense>
      <NewOrderPageInner />
    </OrdersNewRouteSuspense>
  );
}
