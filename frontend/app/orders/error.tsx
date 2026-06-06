"use client";

import { OrdersSegmentErrorView } from "@/components/orders/OrdersSegmentErrorView";

/** 订单路由 · 页面级错误边界；L5 暖色壳 */
export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <OrdersSegmentErrorView
      error={error}
      reset={reset}
      segment="orders"
      boundaryMarker="orders"
      retryMarker="orders-page"
    />
  );
}
