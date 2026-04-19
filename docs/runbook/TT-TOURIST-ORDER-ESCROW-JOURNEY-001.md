# TT-TOURIST-ORDER-ESCROW-JOURNEY-001 · 旅行者主旅程：下单 → 支付 → 托管完成

**卡号**：`TT-TOURIST-ORDER-ESCROW-JOURNEY-001`  
**母表**：**B-436**（与 [`TT-TOURIST-JOURNEY-PROGRAM-001`](TT-TOURIST-JOURNEY-PROGRAM-001.md) **同批**；**互证** **B-410** **见** **PROGRAM** **文首**）  
**类型**：垂直切片 · 用户旅程（旅行者侧主链路）  
**日期**：2026-04-17  
**状态**：未封口  
**权威契约**：[04 §3.4](../spec/04-后端与API.md) HTTP 路径；页面地图 [13-1 表 1](../spec/13-1-UI产品级SSOT与页面规范.md)；状态与步骤 [53](../spec/53-阶段开发技术文档.md) §三  

**边界**：本卡描述 **旅行者（旅行者）视角** 从 **创建订单** 到 **托管链路达成可演示的「完成」态**（含 **Escrow 链上入金与协议区操作**；资金终态释放/评分细节以 **01/03/53** 为准）。**不包含**：治理/金库/FeeRouter 专项验收（见 [`TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md`](TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md)）；**不包含**向导侧完整独立旅程（可另开 TT）。**改合约 / API / indexer / 前端接线** 时须按黄金基线做五维回归并对照 **run_20260417**；**纯文档** 仅抽查 rollup §3。

**分阶段执行（推荐）**：按优先级 **P01→P07** 逐张完成 — **[`TT-TOURIST-JOURNEY-PROGRAM-001`](TT-TOURIST-JOURNEY-PROGRAM-001.md)**。

---

## 1 · 旅程一句话

已登录旅行者：在 **市场或向导页** 发起需求 → **`/orders/new` 下单** → 经 **向导接单与双边确认**（需第二账号或测试编排）→ **`confirm-final-plan`** → **`/escrow/[id]` 协议区** 完成 **入金/链上步骤** → 订单进入 **可验收的完成/终态路径**（含 **`/pay` 深链与列表联动**）。

---

## 2 · 页面清单（建议顺序 · Next `frontend/app/`）

| 顺序 | 路由 | 说明 |
|------|------|------|
| 0 | `/auth/login`（或 `/auth/register`） | 旅行者登录；深链回跳见现有 auth 任务卡 |
| 1 | `/market` | 自由市场；抽屉/列表进订单详情（与 `GET /api/v1/discover/orders` 同源） |
| 2 | `/guides`、`/guides/[id]`（可选） | 从向导档案深链到下单 `?guide_id=` |
| 3 | `/orders/new` | 创建订单（`postOrder` → `POST /api/v1/orders`） |
| 4 | `/orders` | 我的订单列表（`GET /api/v1/orders`；含终态筛选 query 时与 B-071 一致） |
| 5 | `/pay?orderId=<uuid>` | 支付入口 hub；与托管页、`getOrder` 联动 |
| 6 | `/escrow/[id]` | **EscrowDetail**：终版确认、入金、链上读、协议暂停门闸（B-067/B-068 等） |
| 7 | `/escrow/[id]/rate`（若走评分子页） | 见路由是否存在；否则评分在 Escrow 主流程内 |

**非顶栏但常用深链**：`/pay`、订单抽屉、市场弹窗 — 与 [04 §3.4「前端页面路由」段](../spec/04-后端与API.md) 一致。

---

## 3 · 依赖 API（须与 04 §3.4 一致 · 最小集）

**元数据 / 门闸**

- `GET /meta`（暂停门闸、七键、`chain.contracts`、FeeRouter 观测等）

**订单主链**

- `POST /api/v1/orders` — 创建订单  
- `GET /api/v1/orders` — 列表（可选 `state`、`cursor`）  
- `GET /api/v1/orders/:id` — 详情（`escrow_address`、`itinerary`、`chain_id` 等）  
- `GET /api/v1/discover/orders` — 市场列表（向导抢单前草稿可见性）  
- `POST /api/v1/orders/:id/confirm-final-plan` — 终版确认（Draft 等前置条件见 04）  
- `PATCH /api/v1/orders/:id/itinerary` — Escrowed 前改行程（若旅程包含改行程）  
- `POST /api/v1/orders/:id/accept` — **向导接单**（旅行者旅程中由 **另一账号** 执行；验收需脚本或手动）  
- `POST /api/v1/orders/:id/confirm-bilateral` — 双边确认（旅行者与向导各调用）  
- `POST /api/v1/orders/:id/mock-pay` — 仅 **`P3_CHAIN_OFF=1`** 等链下模式；否则 **501**  
- `POST /api/v1/orders/:id/set-escrow-address` — 链下 mock 写入托管地址（与运行模式一致）  
- `GET /api/v1/orders/:id/chain-sync-status` — 可选展示链同步（Escrow 详情已部分消费）

**可选并行**

- `GET/POST /api/v1/orders/:id/messages` — TT 社区聊天改行程（53 主线可含）  
- `POST /api/v1/orders/:id/confirm-completion`、`POST …/reviews`、`POST …/confirm-rating` — **完成/评分/释放** 与 01/03/53 一致；**不得**把「确认完成」误解为单笔即链上放款（见 04 表内说明）

**前端合约读写的路径** 以 **[14](../spec/14-合约-API-ABI-前后端对齐.md)** + `Escrow` ABI 为准（`/escrow/[id]` 内 `useEscrowDetail` 等）。

---

## 4 · 当前缺口（已知 · 验收前须逐项消解或标注豁免）

| # | 缺口 | 说明 |
|---|------|------|
| G1 | **双角色** | 接单须 **向导账号**；单人开发需 **两浏览器配置** 或 **脚本/种子用户** 编排 |
| G2 | **链 vs 链下** | 真链入金需 **钱包 + Sepolia 资产 + 合约地址与 `/meta` 同源**；`mock-pay` / `set-escrow-address` 仅测试形态 |
| G3 | **53 体验债** | §〇 **200ms 跳转**、赛博风一致性、景区图、协议摘要细节等 — 见 [53](../spec/53-阶段开发技术文档.md)；与本卡「能跑通」可分期 |
| G4 | **状态机完整度** | 「托管完成」若定义为 **Completed + 释放**，须对齐 **53/01** 与 **reviews/confirm-rating** 实际实现；避免口头夸大 |
| G5 | **观测/索引** | `chain-sync-status`、indexer 落后时的 UX — 与 110/04 一致，不冒充已上链 |

---

## 5 · 验收标准（可勾选）

### 5.1 路由与登录

- [ ] 未登录访问 `/orders/new` 时，行为符合产品约定（拦截登录或明确提示），登录后能回到下单意图  
- [ ] `/market` → 可打开订单卡片/抽屉并 **导航到下单或绑定 `guide_id`**（与实现一致）  
- [ ] `/orders/new` 提交成功后可到达 **`/orders` 或订单详情**，且 **`order.id`** 可用于后续深链  

### 5.2 订单与 API 契约

- [ ] `POST /api/v1/orders` 成功响应可被前端消费，且 **`GET /api/v1/orders/:id`** 与列表项 **状态/金额/行程** 无矛盾  
- [ ] **`GET /api/v1/orders`** 与 **`GET /api/v1/orders/:id`** 在 **Accepted / Escrowed** 等关键态字段与 04 一致（含 `escrow_address` 出现时机）  

### 5.3 向导接单与双边（跨账号）

- [ ] **向导账号** 可对 **`Created`** 态订单 **`POST …/accept`**，旅行者侧列表/详情 **同步**  
- [ ] 双方 **`POST …/confirm-bilateral`** 后，步骤条/文案进入下一业务阶段（与 `OrderFlowSteps` 一致）  

### 5.4 终版确认 → 托管页

- [ ] **`POST …/confirm-final-plan`** 成功后的前端行为符合 **B-070**（刷新订单、**`/escrow/[id]`**、锚点滚动等）  
- [ ] **`/escrow/[id]`** 在 **`escrow_address` 已绑定** 时可完成 **入金路径**（真链或允许的 mock 路径）  

### 5.5 支付 Hub 与托管联动

- [ ] **`/pay?orderId=`** 能解析 UUID，错误时有 **`ApiErrorAlert`/边界提示**（与已有 pay 任务卡一致）  
- [ ] 从 `/pay` 进入 **`/escrow/[id]`** 时 **`orderEscrowPrefetch`** 行为不破坏首屏（与现有实现一致）  

### 5.6 完成定义（本卡最小）

- [ ] 订单达到 **`completed`**（或本卡书面定义的「托管完成」终态），且 **页面展示与 `GET /api/v1/orders/:id` 一致**  
- [ ] 若包含评分/释放：**`POST …/reviews` 或 `confirm-rating`** 与 04 条件一致，**无误导成功态**  

### 5.7 工程门禁（改代码的 PR）

- [ ] `cargo test -p traveltrust-api`  
- [ ] `bash scripts/run-check-04-routes.sh`  
- [ ] 涉及接线时：[`TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md`](TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md) **§X** 与 **run_20260417** 对照  

---

## 6 · 母表与索引登记（封口前）

1. **母表** **B-436** **已登记**（**含** **PROGRAM +** **P01～P07**）。  
2. **from-stash** **一览** **396～404** **已登记**；**封口后** 迁入 [`docs/AI任务卡索引.md`](../AI任务卡索引.md)。  

---

**文档版本**：1.1 · 2026-04-17
