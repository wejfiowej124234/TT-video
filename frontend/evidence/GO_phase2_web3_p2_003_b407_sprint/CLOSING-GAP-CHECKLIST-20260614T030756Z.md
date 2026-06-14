# Phase ② · WEB3-P2-003 + B-407 Sprint · Closing Gap 清单

**生成：** 20260614T030756Z · **API:** `https://tt-api-staging.fly.dev`  
**Sprint 结论：** **PASS** · Sepolia **createEscrow + real token deposit + state sync**

**阶段纪律：** ① → **②** → ③；本清单 **② PASS ≠ ③ Production GO**

---

## 本 Sprint 已闭（② · 非 mock 资金闭环）

| # | 项 | 状态 | 证据 |
|---|-----|------|------|
| 1 | G-0～G-4 + Sepolia preflight | PASS | `steps-20260614T030756Z/S01-pregate/` |
| 2 | 订单走廊（register → final-plan） | PASS | `S02-order-corridor/` |
| 3 | **B-407** `createEscrow` on Sepolia | PASS | `S03-create-escrow/` |
| 4 | `POST …/set-escrow-address` | PASS | `S04-bind-escrow-api/` |
| 5 | **WEB3-P2-003** traveler approve + deposit | PASS | `S05-real-deposit/` |
| 6 | indexer-tick + chain-sync + GET order | PASS | `S06-state-sync/` |
| 7 | rollback probes（mock-pay reject） | PASS | `S07-rollback/` |

**诚实边界：**

- ② **Sepolia MockERC20**（`FUND_STACK_TOKEN_ADDRESS`）· **≠** ③ 主网 USDC/PSP
- **无** `mock-pay` · **无** Stripe live
- **无** release/distribute（B-407 runner 另轨）· **PRA GO ≠ Production GO**

---

## 宽轨仍 OPEN

| Gap | 未完成应在哪阶 |
|-----|----------------|
| B-407 release + FeeRouter distribute | ② 另证 |
| G1 R-003 staging full-matrix GO | ② |
| G4 Stripe 真收单 | ② / **③** |
| Production CDN / HLS (G7) | **③** |
| Production GO | **③** |

**SSOT：** [PHASE2-WEB3-P2-003-B407-SPRINT-FREEZE.md](./PHASE2-WEB3-P2-003-B407-SPRINT-FREEZE.md)
