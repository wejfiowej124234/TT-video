"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { OrdersListRouteSuspense } from "@/components/orders/OrdersListRouteSuspense";
import OrdersListPageMain from "./OrdersListPageMain";

/** 我的订单路由入口（L5 · FilterRail sticky · v20260529） */
export default function OrdersPage() {
  const { t } = useTranslation();
  return (
    <OrdersListRouteSuspense>
      <div className="contents" aria-label={t("orders_myOrders")}>
        <OrdersListPageMain />
      </div>
    </OrdersListRouteSuspense>
  );
}
