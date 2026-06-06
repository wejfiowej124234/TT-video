# GO_local_web3_itinerary_l5 · ① 创新行程链路 L5 证据

**阶段：① 本地** — **`/` 表单 → 1× `POST /itineraries` → 1 预览卡 → 预览解锁 → `/escrow/[id]` 草稿 Experience → Market 绑向导**  
**非本包：** ② Stripe / 测试网真付 / 链上 escrow deposit / staging `release_gate=GO`

**UI 代码真源（必读）：** [`app/(home)/README.md`](../../app/(home)/README.md) · **`LANDING-MARKET-PAGES-CODE-SSOT`**（四页 UI/数据链）[`../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md`](../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · `frontend/app/(home)/page.tsx`

**互指：**

| 文档 | 用途 |
|------|------|
| [`docs/spec/80`](../../../docs/spec/80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md) | 路由 ↔ API ↔ 行程门禁 |
| [`GO_local_enterprise_10`](../GO_local_enterprise_10/README.md) | 走廊 10 总闸 + Playwright |
| [`FIVE-MAIN-ROUTES-PHASE1-FREEZE`](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) | `/` UI 冻结 |
| **[`ESCROW-ORDER-PAGE-PHASE1-CLOSURE`](./ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md)** | **订单页 Phase ① 收口声明（多维对齐 · ACTIVE）** |
| **[`ESCROW-DRAFT-EXPERIENCE-FREEZE`](./ESCROW-DRAFT-EXPERIENCE-FREEZE.md)** | **`/escrow/[id]` 草稿 Experience UI 冻结（2026-05-28）** |
| [`app/escrow/[id]/README.md`](../../app/escrow/[id]/README.md) | 路由读序 |
| [`components/escrow/EscrowDetail/README.md`](../../components/escrow/EscrowDetail/README.md) | Escrow 组件 |
| [`GO_local_phase1/site10.acceptance.latest.log`](../GO_local_phase1/site10.acceptance.latest.log) | 全站 10 G-0 留痕 |

---

## 端到端链路（① · 与现码对拍）

```
LandingHeroForm
  → useLandingPage.handleSubmit
  → postItineraryCreate (1×)
  → resultOrderIds[0] + **localStorage**（跨 tab · 旧 session 迁移）
ItineraryResultsSection (ITINERARY_CARD_COUNT=1)
  → UnlockModal → getOrder (预览解锁)
  → link /escrow/:id
EscrowDetail (Experience 暖色壳)
  → PATCH itinerary / guide · 保存发布 Draft→Created
  → /market?view=split&bindGuideToOrder=
  → confirm-final-plan → mock-pay (P3_CHAIN_OFF=1 · Accepted)
```

---

## 产品 L5 收口（文件级 SSOT）

| 环节 | 行为 | 代码 |
|------|------|------|
| 生成 | **1 次** `POST /itineraries`；body 含 `party_size` / `num_rooms` / `cities[]` / 预算区间 | `useLandingPage.ts` |
| 预览位 | **`constants.ts` → `ITINERARY_CARD_COUNT = 1`**（同 `order_id`） | `ItineraryResultsSection.tsx` |
| Session | **localStorage** 恢复订单 id / 解锁集 · 跨 tab · 旧 session 迁移 | `landingItinerarySession.ts` · `marketFavoritesStorage.ts` |
| 解锁 | `getOrder`；`unlockError`；`TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN`；**无真 USDC** | `UnlockModal.tsx` |
| 结果卡 | 无假评分；预算 USDT/USDC；解锁后链 `/escrow/{id}` | `itineraryResultsUtils.ts` |
| Escrow 草稿 | PATCH guide · Market bind 深链 · `published_to_market` | `EscrowDetail/*` · `lib/marketOrderCardFromGetOrder.ts` |
| 后端安全 | confirm CAS · Accepted 禁 PATCH 行程 · mock_pay 门闸 | `crates/api` itinerary 测试子集（见走廊 10 脚本） |

---

## 机读验收（须 exit 0）

```bash
bash scripts/dev/run-web3-itinerary-l5-green.sh
bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh
```

末行：`TT_WEB3_ITINERARY_L5_GREEN: OK` · `TT_WEB3_ITINERARY_FULL_CHAIN_SMOKE: OK`

**向导绑定（共享 DB / 长跑 API）：** 烟测经 [`scripts/dev/lib/tt-patch-order-assignable-guide.sh`](../../../scripts/dev/lib/tt-patch-order-assignable-guide.sh) 遍历 catalog 可用向导；全忙则注册新向导 + stake，避免 `PATCH guide HTTP 409`。机读对拍：`lib/web3ItineraryFullChainGate.contract.test.ts`。

**订单列表 → 支付 / Escrow（辅助入口 · ① · 详见 [`GO_local_orders_l5`](../../../evidence/GO_local_orders_l5/README.md)）：**

```bash
bash scripts/dev/run-orders-corridor-local.sh
```

对拍：`/orders` 卡 `data-tt-orders-list-card-escrow-link` / `data-tt-orders-list-pay-link` → `/escrow/[id]` · `/pay?orderId=`；协议子块暖色 L5 见 `lib/escrowProtocolUi.ts` · `lib/pay/payHubL5.ts`（**非**草稿 Experience 冻结范围）。

**走廊 10（含 Playwright · `SKIP_E2E=1` 可跳过浏览器）：**

```bash
bash scripts/dev/run-enterprise-local-10.sh
```

末行：`TT_ENTERPRISE_LOCAL_10: OK`

---

## 订单页 Phase ① 收口（2026-05-28 · ACTIVE）

**[`ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md`](./ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md)** — 产品 · 代码 · 文档 · 机读 **四维收口**；草稿 Experience **维护期** 入口。

**[`ESCROW-DRAFT-EXPERIENCE-FREEZE.md`](./ESCROW-DRAFT-EXPERIENCE-FREEZE.md)** — UI 硬闸细则；动 `EscrowDetail` / `EscrowDraft*` 须 **`run-web3-itinerary-l5-green.sh` exit 0**（含 `escrowDraftExperienceUiFreeze`）。

---

## ① L5 满分口径

| 维度 | 收口 |
|------|------|
| Landing→Escrow | 1× POST · 1 预览卡 · 解锁 · `/escrow` |
| Escrow→Market | `bindGuideToOrder` 深链 · 左栏本单 · **bindOrderBackfillError** |
| 确认终版 | Created 允许 `confirm-final-plan`；experience 须 confirm 后 mock-pay |
| 五主防回归 | `five-main-routes-ui-antiregression-gate.sh`（`/` 段扩展契约） |
| 烟测 | `smoke-landing-itinerary-flow-local` + `smoke-escrow-draft-guide-bind-local` + **`smoke-orders-list-local`** + **`smoke-orders-pay-escrow-local`**（列表辅助链） |

---

## 诚实边界

| 可宣称（①） | 禁止冒充 |
|-------------|----------|
| 机读绿集 + API 烟测 + 走廊 Playwright **1 spec** | ② staging `release_gate=GO` |
| `UnlockModal` = 预览加载 | 真 USDC 扣款已验收 |
| mock-pay 本地占位 | ③ 主网 Escrow / Production GO |

**② 待办：** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) · [PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)
