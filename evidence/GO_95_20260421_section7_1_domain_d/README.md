# GO_95 · §7.1 域 D（订单 / 支付 / 托管）审计证据 · 2026-04-21

## 前端路由与 **04 §3.4** 表

| 前端路径 | 实现要点 |
|----------|----------|
| **`/orders`** | **`frontend/app/orders/page.tsx`**：**`getOrders`**/**`getGuide`**/**`orderCancel`** 等（**`@/lib/apiClient`**）；列表态机与投影展示（**`orderProjectionDisplayStatus`**、**`ordersListStateQuery`**、**`filterOrdersForTransactionalMyOrdersSurface`** 等）；与 **F-008～009**/**04** 同源叙述。 |
| **`/orders/new`** | **`frontend/app/orders/new/page.tsx`**：**`postOrder`**/**`getGuides`**；**`OrderFlowSteps`**。 |
| **`/pay`** | **`frontend/app/pay/page.tsx`**：**`orderMockPay`**（**`POST …/orders/:id/mock-pay`**，与 **`frontend/lib/api.ts`** **`routes.orderMockPay`**/**04** 同源）；**mock-pay UI** 仅当 **`allowChainOffMockPayUi()`** 且 **`readOrderMockPayEnabledFromMeta(meta)`** 为真（与 **§3 F-010**/**`travelTrustUiGuards`** 闸一致）；页内注释 **95 · F-010** 三态与 **`showMockPayCta`** 同源。 |
| **`/escrow/[id]`** | **`frontend/app/escrow/[id]/page.tsx`**：**`EscrowDetailSection`**；**`generateMetadata`** 对非法 **UUID** 走 **notFound** 语义。 |
| **`/escrow/[id]/rate`** | **`frontend/app/escrow/[id]/rate/page.tsx`**（评价流壳；与 **F-027** 横切对读，**不**替代 **§8.2** 行完成）。 |

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（**04** 前端表 ↔ **`frontend/app`**）
```

## 边界

**不**替代 **§8.2** **F-008～011**/**F-010** 行完成或生产资金域终验；**不**替代 **93 B 域** 全量 **PASS**/**`report.json`**。
