# TT-TOURIST-JOURNEY-PROGRAM-001 · 旅行者主旅程 · 分阶段执行程序（总表）

**母表**：**B-436**（[`docs/任务母表.md`](../任务母表.md)）  
**母旅程**：[`TT-TOURIST-ORDER-ESCROW-JOURNEY-001`](TT-TOURIST-ORDER-ESCROW-JOURNEY-001.md)（全览 + 缺口）  
**日期**：2026-04-17  
**用法**：按 **执行顺序** 从上到下做；**完成上一张再开下一张**。改 **合约 / API / indexer / 前端接线** 时遵守 [`TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md`](TT-TESTNET-GOLDEN-BASELINE-REGRESSION.md) **§X**。

**与 B-410 / TT-B410 的关系**：**B-410** **已封口**（**`TT-B410-USER-FLOW-E2E-ORDER-STATE-UNIFIED-001`** **+** **`b410-user-flow-e2e-gate.sh`**），定义 **订→接→托管→支付→终态** **串联** **与** **机读闸**。**B-436** **不替代** **B-410**；本 PROGRAM 为 **同一主链** **的** **分阶段手搓清单**（**P01～P07**），便于 **单人按周推进**。二者 **冲突时** **以** **04 §3.4** **+** **B-410** **Runbook** **为准**。

**P07 主路径（API）**：**PASS**（2026-04-17）— 详见 [`TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001`](TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001.md) 文首「已实跑序列」；环境 **`P3_CHAIN_OFF=1`**，`GET /meta` **`orders.order_mock_pay_enabled=true`**。P01～P06 **未**在本批一并重跑；PROGRAM 全链路 **封口**仍须按序勾选或书面豁免。

### 本批 P07 未覆盖（单独台账）

| 类别 | 项 |
|------|-----|
| **错误路径** | 评价/完成态 **403/400/409** 负例；`GET …/reviews` 匿名 **401**；`mock-pay` / `confirm-completion` 冲突态；信任门禁 |
| **并发边界** | 重复写、双账号竞态、幂等重放 |
| **非主路径** | 浏览器 Escrow 页；真链入金；`confirm-rating` / intent 路径；链上 release 与投影晚到 |

### 当前执行焦点（默认）

- **仅** 启动 **母表 [B-438](../任务母表.md)** **/** **[`TT-TOURIST-JOURNEY-P01-AUTH-MARKET-001`](TT-TOURIST-JOURNEY-P01-AUTH-MARKET-001.md)**（登录 + **`/market`** 只读）。  
- **P02～P07** **不** 并行开工，直至 P01 **验收勾选** 完成（或 **书面豁免**）。豁免须写明 **环境** **与** **理由**。

---

## 优先级说明

| 层级 | 含义 |
|------|------|
| **P0** | 不打通则后续无法验收（登录、市场只读、建单可见） |
| **P1** | 主链路业务态（接单、双边、进托管） |
| **P2** | 入金与支付 hub、链上/或 mock |
| **P3** | 完成/评价/释放路径（与 53/01 终态一致） |

---

## 执行顺序（任务卡组合）

| 顺序 | 优先级 | 任务卡 | 一句话 |
|------|--------|--------|--------|
| 1 | **P0** | [`TT-TOURIST-JOURNEY-P01-AUTH-MARKET-001`](TT-TOURIST-JOURNEY-P01-AUTH-MARKET-001.md) | 旅行者登录 + `/market` 只读（`discover/orders`） |
| 2 | **P0** | [`TT-TOURIST-JOURNEY-P02-CREATE-ORDER-LIST-001`](TT-TOURIST-JOURNEY-P02-CREATE-ORDER-LIST-001.md) | `/orders/new` 建单 + `/orders` 列表 + `GET :id` |
| 3 | **P1** | [`TT-TOURIST-JOURNEY-P03-GUIDE-ACCEPT-001`](TT-TOURIST-JOURNEY-P03-GUIDE-ACCEPT-001.md) | 向导账号 `POST …/accept`，旅行者侧一致 |
| 4 | **P1** | [`TT-TOURIST-JOURNEY-P04-BILATERAL-001`](TT-TOURIST-JOURNEY-P04-BILATERAL-001.md) | 双方 `confirm-bilateral` |
| 5 | **P1** | [`TT-TOURIST-JOURNEY-P05-CONFIRM-FINAL-ESCROW-001`](TT-TOURIST-JOURNEY-P05-CONFIRM-FINAL-ESCROW-001.md) | `confirm-final-plan` + 进 `/escrow/[id]`（B-070） |
| 6 | **P2** | [`TT-TOURIST-JOURNEY-P06-PAY-DEPOSIT-001`](TT-TOURIST-JOURNEY-P06-PAY-DEPOSIT-001.md) | `/pay` 深链 + Escrow 入金（mock 或真链） |
| 7 | **P3** | [`TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001`](TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001.md) | 完成态 + 评价/释放最小路径 · **主路径 PASS**（HTTP · 2026-04-17） |

**依赖链**：1 → 2 → 3 → 4 → 5 → 6 → 7（**3 起必须双账号**：旅行者 + 向导）。

---

## 封口与母表

- **母表** **B-436** **已登记**（**总程序** **+** **母旅程** **+** **P01～P07**）；**P01** **专卡** **B-438** **见** **[`TT-TOURIST-JOURNEY-P01-AUTH-MARKET-001`](TT-TOURIST-JOURNEY-P01-AUTH-MARKET-001.md)**。  
- [`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) **一览** **396～404** **已登记**（**未封口**）。封口后迁入 [`docs/AI任务卡索引.md`](../AI任务卡索引.md)。  
- **PROGRAM 全流程绿** 后可将 **母旅程** [`TT-TOURIST-ORDER-ESCROW-JOURNEY-001`](TT-TOURIST-ORDER-ESCROW-JOURNEY-001.md) **标为** **可封口候选**（**与** **B-410** **并列** **叙述** **，** **不** **合并** **编号** **）。

**文档版本**：1.3 · 2026-04-17
