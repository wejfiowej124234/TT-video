# `/orders` · 我的订单

**阶段：① 本地** · **非五主路由**（产品控制台 L5）

## 读序

| 顺序 | 文档 |
|------|------|
| ① | **[GO_local_orders_l5](../../../evidence/GO_local_orders_l5/README.md)** — 列表走廊 L5 证据 SSOT |
| ② | **本目录代码** · `lib/orders/ordersListL5.ts` |
| ③ | [`/pay` README](../pay/README.md) · [`/escrow/[id]` README](../escrow/[id]/README.md) |

## 路由

| 路径 | 入口 | 说明 |
|------|------|------|
| `/orders` | `page.tsx` → `OrdersListPageMain` | 列表 · 筛选 · 搜索 · 卡片 |
| `/orders/new` | `new/page.tsx` → `OrdersNewPageMain` | 创建订单 |
| `/orders/[id]` | `[id]/page.tsx` | **redirect** → `/escrow/[id]` |

## 机读（动列表 / 新建页须 exit 0）

```bash
bash scripts/dev/run-orders-l5-green.sh
```

**API + 深链烟测：**

```bash
bash scripts/dev/smoke-orders-list-local.sh
bash scripts/dev/smoke-orders-pay-escrow-local.sh
```

**走廊总闸（含可选 E2E）：**

```bash
bash scripts/dev/run-orders-corridor-local.sh
```

**G-0 留痕：**

```bash
bash scripts/dev/record-orders-corridor-acceptance-log.sh
```

## 数据链（①）

- 列表：`GET /api/v1/orders` — `limit` · `cursor` · `state` · `q` · `orders_chain_id`
- 卡片 → `/pay?orderId=` · `/escrow/[id]`（`data-tt-orders-list-pay-link` · `data-tt-orders-list-card-escrow-link`）
