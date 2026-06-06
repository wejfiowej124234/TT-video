"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { OrdersPageLoadingView } from "./OrdersPageLoadingView";

/** 我的订单：与列表页 L5 布局同构，降低 CLS（51-31-25 / 52） */
export default function OrdersLoading() {
  const { t } = useTranslation();
  return <OrdersPageLoadingView t={t} />;
}
