# GO_local_orders_l5 · ① 订单列表走廊 L5 证据

**阶段：① 本地** — **`/orders` 列表 · `/orders/new` · 列表 → `/pay` · `/escrow/[id]`** 的产品 L5、筛选/API 对拍与机读绿集。  
**非本包：** ② 测试网 Stripe / staging `release_gate=GO`、③ 生产 PSP / 主网真链。

**代码真源：** `frontend/app/orders/` · `frontend/lib/orders/` · `frontend/lib/pay/payHubL5.ts`

**互指：**

| 文档 | 用途 |
|------|------|
| [`acceptance.latest.log`](./acceptance.latest.log) | **G-0 留痕** · 须含 `TT_ORDERS_CORRIDOR_LOCAL: OK` |
| [`app/orders/README.md`](../../app/orders/README.md) | 路由读序 · 机读闸 |
| [`GO_local_web3_itinerary_l5`](../GO_local_web3_itinerary_l5/README.md) | Landing → 解锁 → Escrow **草稿**（主创新链；与本包辅助入口并列） |
| [`ESCROW-ORDER-PAGE-PHASE1-CLOSURE`](../GO_local_web3_itinerary_l5/ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md) | Escrow 草稿 Phase ① 收口 |
| [`components/escrow/EscrowDetail/README.md`](../../components/escrow/EscrowDetail/README.md) | 协议壳 / Experience 双壳 |
| **04 §3.4** · **93** | `GET /api/v1/orders` · `q` · `state` · `orders_chain_id` |

---

## 端到端链路（① · 与现码对拍）

```
GET /api/v1/orders?limit&cursor&state&q&orders_chain_id
  → OrdersListPageMain (data-tt-orders-list-l5)
  → 筛选 / 搜索 / 键盘·滑动快捷操作
  → 卡片
       ├─ data-tt-orders-list-pay-link      → /pay?orderId=
       └─ data-tt-orders-list-card-escrow-link → /escrow/[id]
            ├─ 草稿 Experience（冻结 · 非本包主链）
            └─ 协议壳暖色 L5（escrowProtocolUi · ChatBlock variant=did）
/orders/:id → redirect /escrow/:id
/orders/new → OrdersNewPageMain (ordersNewL5)
```

---

## 产品 L5 收口（文件级 SSOT）

| 环节 | 行为 | 代码 |
|------|------|------|
| 列表壳 | 暖色深色控制台 · `data-tt-orders-page` | `lib/orders/ordersListL5.ts` · `OrdersListPageMain.tsx` |
| 状态筛选 | URL `state` + 进行中/终态计数 | `ordersListStateFilter.ts` · `ordersListStateCounts.ts` |
| API 查询 | `q` · `orders_chain_id` · cursor | `ordersListFetchParams.ts` · `orders.list.test.ts` |
| 搜索 | 客户端高亮 + 服务端 `q` | `ordersListClientSearch.ts` · `OrdersListSearchBar.tsx` |
| 卡片动作 | 支付 / 详情 / 滑动 reveal | `OrdersListCardItem.tsx` · `ordersListCardPrimaryAction.ts` |
| 新建订单 | `/orders/new` L5 | `lib/orders/ordersNewL5.ts` |
| 支付 Hub | `/pay?orderId=` 暖色壳 | `lib/pay/payHubL5.ts` · `app/pay/` |
| 列表→Escrow | prefetch sessionStorage · 面包屑 | `stashEscrowOrderPrefetchFromListItem` · `EscrowDetailOrdersBreadcrumb` |

---

## 机读验收（须 exit 0）

```bash
bash scripts/dev/run-orders-l5-green.sh
bash scripts/dev/smoke-orders-list-local.sh
bash scripts/dev/smoke-orders-pay-escrow-local.sh
```

末行：

- `TT_ORDERS_L5_GREEN: OK`
- `TT_ORDERS_LIST_SMOKE: OK`
- `TT_ORDERS_PAY_ESCROW_SMOKE: OK`

**走廊总闸（L5 + API 烟测 + 可选 Playwright）：**

```bash
bash scripts/dev/run-orders-corridor-local.sh
```

末行：`TT_ORDERS_CORRIDOR_LOCAL: OK`

**G-0 留痕（① · 可选自留 exit 0 日志）：**

```bash
bash scripts/dev/record-orders-corridor-acceptance-log.sh
# → frontend/evidence/GO_local_orders_l5/acceptance.latest.log
```

无浏览器：

```bash
SKIP_E2E=1 bash scripts/dev/run-orders-corridor-local.sh
```

Playwright 单跑：

```bash
cd frontend && npm run e2e:orders-corridor
```

---

## ① L5 满分口径

| 维度 | 收口 |
|------|------|
| 列表 UI / token | `ordersListL5.contract.test.ts` |
| 新建页 UI | `ordersNewL5.contract.test.ts` |
| 支付 Hub | `payHubL5.contract.test.ts` · `app/pay/page.test.tsx` |
| 列表→Escrow 标记 | `escrowProtocolUi.contract.test.ts` |
| API 列表参数 | `orders.list.test.ts` |
| 闸脚本对拍 | `ordersCorridorGate.contract.test.ts` |
| E2E（可选） | `e2e/orders-list-*.spec.ts`（走廊 4 条；左滑开合另 `orders-list-swipe-mobile.spec.ts` · 单测 `ordersListCardSwipe`） |

---

## 诚实边界

| 可宣称（①） | 禁止冒充 |
|-------------|----------|
| 绿集 + API 烟测 + 本地 Playwright 走廊 | ② staging 全矩阵 `GO` |
| mock-pay / 列表深链可达 | ③ 生产 PSP / 主网 Escrow GO |
| 协议壳暖色 L5 维护 | 草稿 Experience UI 已冻结范围的视觉改版 |

**② 待办：** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) · [PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)

**全站企业 10（①）：** 已编入 `bash scripts/dev/run-enterprise-site-10-local.sh`（L3b · 见 [ENTERPRISE-SITE-10-L5-MATRIX](../../../docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md) §1.2）。
