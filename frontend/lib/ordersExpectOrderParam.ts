/** B-048：`/orders/new` 创建成功后回列表时携带，用于列表页对齐新单或提示刷新 */
export const ORDERS_EXPECT_ORDER_QUERY = "expect_order" as const;

export function ordersListHrefAfterCreate(orderId: string): string {
  const q = new URLSearchParams();
  q.set(ORDERS_EXPECT_ORDER_QUERY, orderId);
  return `/orders?${q.toString()}`;
}
