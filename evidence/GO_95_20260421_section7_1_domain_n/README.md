# GO_95 · §7.1 域 N（Discover / 自由市场列表 API）审计证据 · 2026-04-21

## **`/discover` 路由（历史路径 · 04 §3.4）**

| 层 | 行为 |
|----|------|
| **`frontend/middleware.ts`** | **`pathname === "/discover"`** → **`NextResponse.redirect`** 至 **`/market`**，**`clone()`** 保留 **query/hash**（注释 **29 §10**）。 |
| **`frontend/app/discover/page.tsx`** | **`DiscoverReplaceToMarket`**：**`router.replace`** 至 **`/market`**，**query** 非空时拼 **`?${qs}`**（与 **middleware** 同意图；**Suspense** + **`useSearchParams`**）。 |

**结论**：**`/discover`** **不**在本页调用 **`getDiscoverOrders`**；与 **04**「**主 UI `/market`**、Next **`/discover`** 重定向」一致。

## **`GET /api/v1/discover/orders` 消费面（主列表在 `/market`）**

- **`frontend/lib/api.ts`**：**`routes.discoverOrders`** = **`/api/v1/discover/orders`**（注释 **P16/17** · HTTP 路径保留 **discover**）。  
- **`frontend/lib/apiClient/discover.ts`**：**`getDiscoverOrders`** → **`apiUrl(routes.discoverOrders)`** + **`country`/`city`/`limit`/`cursor`** query。  
- **`frontend/components/market/useMarketPage.ts`**：列表加载调用 **`getDiscoverOrders`**（**`/market`** 主数据源）。  
- **单测**：**`frontend/lib/apiClient/discover.test.ts`**（**54-S9**）；**`discoverOrderItemContract.test.ts`**、**`discoverOrderDedupeKey*.ts`** 与 **04/52** 叙事互指。

## 与 **`/market`** 产品 IA（**不**混读）

- **列表 API**：**Discover 订单卡** = **`GET …/discover/orders`**（**`useMarketPage`**）。  
- **子站橱窗/收购（94）**：**`routes.market*`** + **`MarketStandaloneBusinessPage`** 等属 **§7.1 域 F**；本域 **N** 只闭 **`/discover` 重定向** + **`discover/orders`** 契约与 **`/market`** 消费关系，**不**把 **94 listings** 误记为 **discover/orders** 已审闭。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（登记日）
```

## 边界

**不**替代 **§7.1 域 F** 全扇面；**不**替代 **93 B** 市场域人工回归；**不**将 **middleware 302** 与 **客户端 `replace`** 双轨误读为路由表冲突（二者同目标 **`/market`**）。
