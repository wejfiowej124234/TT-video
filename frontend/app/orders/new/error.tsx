"use client";

import { OrdersSegmentErrorView } from "@/components/orders/OrdersSegmentErrorView";

/** 新建订单段 · 错误边界；L5 暖色壳 */
export default function OrdersNewSegmentError({
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
      segment="orders-new"
      boundaryMarker="orders-new"
      retryMarker="orders-new"
    />
  );
}
