# Phase ② · WEB3-P2-003 + B-407 Sprint（ACTIVE · 待首跑）

**阶段：② 测试网 / Sepolia** — **非** ③ Production GO

**前置：** [PHASE2-START-CHECKLIST-SPRINT](../GO_phase2_start_checklist_sprint/PHASE2-START-CHECKLIST-SPRINT-FREEZE.md) · `TT_PHASE2_G0_G4_ADMISSION: CLEAR` · Sepolia 链密钥

**API：** `https://tt-api-staging.fly.dev` · **链：** Sepolia `11155111`

**补齐项：** [WEB3-HOME-PHASE2-BACKLOG §WEB3-P2-003](../GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md) · [PHASE2-ENTERPRISE-GAP-AUDIT §WEB3-P2-003](../../../docs/runbook/PHASE2-ENTERPRISE-GAP-AUDIT.md)

---

## 目标（② · 非 mock 资金闭环）

| 轨 | 内容 |
|----|------|
| **WEB3-P2-003** | 旅行者 EOA **`approve` + `deposit`** · 订单 **`escrow_address`** · **非** `mock-pay` |
| **B-407** | **`EscrowFactory.createEscrow`** · **`POST …/set-escrow-address`** · **Funded** 状态 |
| **状态同步** | `indexer-tick`（best-effort）+ **`GET …/chain-sync-status`** + **`GET /orders/:id`** |
| **回滚验证** | 重复 `mock-pay` 拒绝 · 重复 `deposit` 链上 revert · anon `/me` 401 |

**诚实边界：**

- ② **Sepolia MockERC20**（`FUND_STACK_TOKEN_ADDRESS`）· **≠** ③ 主网 USDC / Production PSP
- **无** `release` + `FeeRouter.distribute`（`b407-revenue-e2e-real-chain-runner.sh` 另轨）
- **PRA unified pack GO** · **≠** **③ Production GO**（见 [175 PRA Blueprint](../../../docs/handbook/engineering/175-Production-Readiness-Audit-Program-Blueprint.md)）

---

## 7 步证据链

| Step | 链路 | 证据子目录 |
|------|------|------------|
| S01 | G-0～G-4 + Sepolia cast + staging `/meta` | `S01-pregate/` |
| S02 | register → final-plan（支付前） | `S02-order-corridor/` |
| S03 | **createEscrow** on Sepolia | `S03-create-escrow/` |
| S04 | **set-escrow-address** | `S04-bind-escrow-api/` |
| S05 | **real deposit**（WEB3-P2-003） | `S05-real-deposit/` |
| S06 | state sync | `S06-state-sync/` |
| S07 | rollback probes | `S07-rollback/` |

---

## 环境（`.env` · Owner-only 密钥）

| 变量 | 用途 |
|------|------|
| `B407_TRAVELER_PK` 或有效 `PRIVATE_KEY` | `createEscrow.traveler` + `deposit` signer |
| `B407_GUIDE_PK` | `createEscrow.guide` |
| `B407_FACTORY_DEPLOYER_PK` 或 `B407_RELAYER_PK` | `createEscrow` gas |
| `CHAIN_RPC_URL` | Sepolia RPC（须 `chain_id=11155111`） |
| `ESCROW_FACTORY_ADDRESS` · `FEE_ROUTER_ADDRESS` | 与 staging `/meta` 一致 |
| `FUND_STACK_TOKEN_ADDRESS` / `PAYMENT_TOKEN` | MockERC20 fund track |
| `INTERNAL_API_SECRET` | staging `indexer-tick`（推荐） |

---

## 机读验收

```bash
bash scripts/dev/record-phase2-web3-p2-003-b407-sprint-evidence.sh
```

末行：`TT_PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE: OK` → 自动进入 **Production Readiness Audit**（`pra-unified-release-evidence-pack.sh`）

跳过 PRA（仅 fund sprint）：`P2B407_SKIP_PRA=1 bash scripts/dev/record-phase2-web3-p2-003-b407-sprint-evidence.sh`

---

## 互证

- API mock 全链：[PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE](../GO_phase2_testnet_execution_sprint/PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE.md)
- Staging UI 全链：[PHASE2-STAGING-UI-REAL-USER-SPRINT-FREEZE](../GO_phase2_staging_ui_real_user_sprint/PHASE2-STAGING-UI-REAL-USER-SPRINT-FREEZE.md)
- B-407 release 轨：[TT-B407-REAL-CHAIN-REVENUE-E2E-001](../../../docs/runbook/TT-B407-REAL-CHAIN-REVENUE-E2E-001.md)
- PRA SSOT：[176 Production Readiness Audit Report](../../../docs/handbook/engineering/176-Production-Readiness-Audit-Report.md)

---

## 回滚 SSOT

[COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

每步 `rollback.md` 含 **Probe** 与 **Rollback** 引用。
