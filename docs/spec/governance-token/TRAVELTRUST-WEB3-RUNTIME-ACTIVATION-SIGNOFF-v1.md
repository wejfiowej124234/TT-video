# TravelTrust Web3 Runtime Activation — Owner Sign-off Package v1

**Package ID:** `WEB3_RUNTIME_ACTIVATION_SIGNOFF_V1`  
**Sprint:** **W6.5** · Owner Review & Runtime Activation Sign-off  
**Prior:** [W6 Activation Plan](./TRAVELTRUST-WEB3-RUNTIME-ACTIVATION-PLAN-v1.md) · [W5 Audit](./traveltrust-web3-protocol-master-audit-report-v1.md)  
**Machine mirror:** [registry/runtime-activation-signoff.v1.yaml](../../../registry/runtime-activation-signoff.v1.yaml)  
**Network scope:** Sepolia ② · **Not mainnet · Not Vacancy deploy until signed**

**Status:** ⏳ **WAITING OWNER APPROVAL** (evidence review · signature pending)  
**W7:** ⛔ **BLOCKED** until Owner signs [Evidence Review](./TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1.md) · `WEB3_RUNTIME_ACTIVATION_GATE`

---

## Layer status (accurate · do not conflate)

| Layer | Status |
|-------|--------|
| Protocol Layer | ✅ COMPLETE |
| Deployment Plan | ✅ VERIFIED |
| Fork Runtime Simulation | ✅ PASS |
| Sepolia Runtime Activation | ⏳ **WAITING OWNER APPROVAL** |
| Production Mainnet | ❌ **NOT STARTED** |

Fork simulation proved Vacancy V1 **can safely replace** Q-F01 if executed as designed — **not** that chain upgrade is already done.

**Owner one-pager:** [TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1.md](./TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1.md)  
**Runbook addendum (legacy interface):** [TRAVELTRUST-WEB3-VACANCY-W7-RUNBOOK-ADDENDUM-v1.md](./TRAVELTRUST-WEB3-VACANCY-W7-RUNBOOK-ADDENDUM-v1.md)

---

## Sprint state (accepted)

| Sprint | Status |
|--------|--------|
| W5 Web3 Master Audit | ✅ COMPLETE (`WARN` accepted) |
| W6 Runtime Activation Plan | ✅ COMPLETE |
| W6.5-B Historical Balance Audit | ✅ PASS |
| W7 Dry Run / Fork Simulation | ✅ PASS — [evidence](./evidence/vacancy-w7-dry-run/DRYRUN-RESULT-v1.md) |
| **W6.5 Owner Sign-off** | ⏳ **WAITING OWNER APPROVAL** |
| W7 Sepolia Broadcast | ⛔ BLOCKED |

**W6 value (confirmed):** Not every module needs on-chain upgrade. Upgrade paths are **legalized** before execution.

| Module class | W6 treatment | W7 action type |
|--------------|--------------|----------------|
| Treasury | Config drift — **not** new deploy | Env/API only |
| Vacancy DE | Migration — **not** proxy upgrade | New triplet + registry switch |
| Escrow V2 | **FUTURE_MAINNET_REQUIRED** — Sepolia V1 OK | Defer unless explicitly approved |

---

## Package under review

| Field | Value |
|-------|-------|
| Plan version | `runtime-activation-plan.v1.yaml` v1.0.0 |
| Active baseline | `gov_freeze_v2_clean_baseline` |
| Chain ID | `11155111` (Sepolia) |
| V2 Timelock | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` |
| Legacy DE Timelock | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` |
| Q-F01 legacy triplet | See §B.1 below |

---

## W7 执行前批准表（一页纸）

### A. Treasury（P0 · 配置 · 无链上部署）

| # | Item | Owner confirms |
|---|------|----------------|
| A1 | Env 统一：仅 `GOVERNANCE_TREASURY_P4CAP_ADDRESS` + `LEGACY_TREASURY_ADDRESS` | ☐ |
| A2 | 禁止 bare `TREASURY_ADDRESS` 进入 active env | ☐ |
| A3 | `GOVERNANCE_TREASURY_ADDRESS` 已迁移或别名到 P4Cap | ☐ |
| A4 | API：`treasury_address` 无 `REGION_VAULT_ADDRESS` fallback | ☐ |
| A5 | `GET /meta` treasury leg = P4Cap `0xc1de17cd…` only | ☐ |
| A6 | Fundstack verify：`FeeRouter.globalOps()` = Legacy `0x6a8323fb…` | ☐ |
| A7 | W3-AUDIT-001～003 关闭 | ☐ |
| A8 | **确认：不部署新 Treasury 合约** | ☐ |

**Owner note:** 风险来自读取错误，不是链上 Treasury 合约错误。

---

### B. Vacancy DE（P1 · 迁移 · 需链上 W7）

#### B.0 Immutable 已确认

| # | Item | Owner confirms |
|---|------|----------------|
| B0 | DE triplet **NON-PROXY / IMMUTABLE** — Option A `upgradeTo` **拒绝** | ☐ |
| B0 | W6 Option B（新 triplet + registry switch）已批准 | ☐ |

#### B.1 新地址关系 — 三者必须一起换

Vacancy V1 依赖 **Ledger state · Vault accounting · Steward release gate** — **不能只换其中一个**。

```
CountryPoolNetProfitLedger V1  ←→  vacancyState · stewardActivationEpochId · splitNetProfit
        |
UnallocatedStewardPathVault V1 ←→  vacancyLedger · sweepEnabled · Q-F01 path
        |
StewardPathVault V1            ←→  steward path 45% leg · release gate
```

| # | Item | Owner confirms |
|---|------|----------------|
| B1 | **三合约原子迁移**：Ledger + Unallocated + StewardPath 同批 W7 | ☐ |
| B1a | 新 Ledger 地址：___________________________ | ☐ |
| B1b | 新 Unallocated 地址：___________________________ | ☐ |
| B1c | 新 StewardPath 地址：___________________________ | ☐ |

**Legacy triplet（保留 · LEGACY_READ_ONLY）：**

| Contract | Legacy address |
|----------|----------------|
| CountryPoolNetProfitLedger | `0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa` |
| StewardPathVault | `0x6B3391c0b6297A5866c0bB7AD06dA99E08F0a3fb` |
| UnallocatedStewardPathVault | `0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0` |

#### B.2 Owner = V2 Timelock（非 EOA）

```
Governor → V2 Timelock (0x904a6c4c…) → new Ledger / Vaults
```

| # | Item | Owner confirms |
|---|------|----------------|
| B2 | 新 triplet `owner()` = V2 Timelock | ☐ |
| B2 | 无 EOA 长期 owner | ☐ |

#### B.3 历史余额迁移 — W7 前单独确认

**Owner / Ops 必须在 W7 前完成链上余额审计（只读）：**

| Vault / ledger | Check | Result (fill) |
|----------------|-------|---------------|
| Unallocated `0xAbE36…` | USDC balance | **0.495000 USDC** (495000 · 6 dec) |
| StewardPath `0x6B339…` | USDC balance | **0** |
| Ledger | open epoch / pending settlement | **None** — epoch 1 SPLIT_COMPLETED |
| Ledger | unclaimed accrual | **None** — split complete |

| Scenario | Approved migration path |
|----------|-------------------------|
| **All balances = 0 · no open settlement** | Deploy new → probe → registry switch |
| **Non-zero balance (actual)** | **☑ Selected** — Migration Proposal → Legacy Timelock → Transfer **0.495 USDC** → reconcile → then registry switch |

| # | Item | Owner confirms |
|---|------|----------------|
| B3 | 余额审计已完成（日期 UTC：________） | ☐ |
| B3 | 迁移策略选定：☐ 简单切换  ☐ 治理迁移 | ☐ |
| B3 | **禁止** 未经 Timelock 的直接 EOA 转账 | ☐ |

#### B.4 Registry 切换顺序（固定 · 不可先改 Registry）

```
① Deploy new contracts (V1 bytecode)
        ↓
② Probe new addresses (4 selectors PASS)
        ↓
③ Initialize / wire (globalTreasury · vault refs · owner)
        ↓
④ Registry + jurisdiction JSON + env update
        ↓
⑤ Indexer switch / backfill plan
        ↓
⑥ Live reconcile ENABLED
```

| # | Item | Owner confirms |
|---|------|----------------|
| B4 | W7 执行顺序按上述 ①→⑥，**禁止**先改 registry | ☐ |

#### B.5 双地址保留策略（审计友好）

| # | Item | Owner confirms |
|---|------|----------------|
| B5 | Legacy 地址写入 registry · `status: LEGACY_READ_ONLY` | ☐ |
| B5 | Active 地址 · `status: ACTIVE` | ☐ |
| B5 | 旧地址不从审计记录删除 | ☐ |

#### B.6 Rollback

| # | Item | Owner confirms |
|---|------|----------------|
| B6 | Probe 失败 → **不**切换 registry/env | ☐ |
| B6 | 回滚 = 恢复 registry 指针至 Q-F01 地址 | ☐ |

---

### C. Capability Probe（新地址 · W7 部署后）

| Selector | Function | Contract | Pass |
|----------|----------|----------|------|
| `ae607b9e` | `vacancyLedger()` | Unallocated V1 | ☐ |
| `a20b5507` | `sweepEnabled()` | Unallocated V1 | ☐ |
| `0d045440` | `vacancyState()` | Ledger V1 | ☐ |
| `123d1b10` | `stewardActivationEpochId()` | Ledger V1 | ☐ |

| # | Item | Owner confirms |
|---|------|----------------|
| C1 | 四 selector 在新 bytecode 上 **全部 PASS** | ☐ |
| C2 | Q-F01 旧地址 probe 仍可记录为 LEGACY（预期 FAIL selector） | ☐ |

---

### D. Reconcile

| # | Item | Owner confirms |
|---|------|----------------|
| D1 | 切换前：`reconcileStatus` / mode = `SKIPPED_PRE_V1`（预期） | ☐ |
| D2 | 切换后：live reconcile **PASS**（非 SKIPPED） | ☐ |
| D3 | `WEB3_VACANCY_INDEXER_RECONCILE` gate PASS on new addresses | ☐ |
| D4 | Ops console drift = false · runtime = ACTIVE | ☐ |

---

### E. Escrow V2（默认：不阻塞 W7 Vacancy 波）

| # | Item | Owner confirms |
|---|------|----------------|
| E1 | Escrow V2 = `FUTURE_MAINNET_REQUIRED` · Sepolia V1 ACTIVE 可接受 | ☐ |
| E2 | W7 波 **不含** EscrowFactory V2 deploy（除非另批批准） | ☐ |

---

### F. Dual Timelock（接受分割 · 不强行统一）

| Timelock | Role | W7 |
|----------|------|-----|
| V2 `0x904a6c4c…` | Gov proxies · **新 triplet owner** | Active |
| Legacy `0x0359d4fB…` | Q-F01 旧 triplet · 余额迁移 | Migration only |

| # | Item | Owner confirms |
|---|------|----------------|
| F1 | 短期接受双 Timelock · 职责已文档化 | ☐ |
| F2 | 不为“看起来统一”在 W7 做高风险 owner 合并 | ☐ |

---

### G. Gate & scope

| # | Item | Owner confirms |
|---|------|----------------|
| G1 | `check-web3-protocol-master-matrix-gate.sh` PASS | ☐ |
| G2 | W5 WARN 已知项（Treasury env · Vacancy runtime · Escrow V2 tier）已读 | ☐ |
| G3 | W7 范围：**☐ Treasury config only  ☐ + Vacancy DE migration** | ☐ |
| G4 | 不改 tokenomics · 不改 governance 参数 · 不改 proxy impl（本波） | ☐ |

---

## VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE

**Prerequisite to Owner sign (recommended) or conditional on Dry Run PASS.**

| Check | Status |
|-------|--------|
| New triplet deployment simulation | ☐ NOT_RUN |
| Owner = V2 Timelock verified | ☐ NOT_RUN |
| Capability probe (4 selectors) | ☐ NOT_RUN |
| 0.495 USDC migration simulation | ☐ NOT_RUN |
| Ledger state unchanged (legacy) | ☐ NOT_RUN |
| Registry switch rehearsal | ☐ NOT_RUN |
| Rollback path | ☐ NOT_RUN |

**Checklist:** [TRAVELTRUST-WEB3-VACANCY-W7-DRY-RUN-CHECKLIST-v1.md](./TRAVELTRUST-WEB3-VACANCY-W7-DRY-RUN-CHECKLIST-v1.md)  
**Gate:** `bash scripts/gates/check-vacancy-runtime-migration-dryrun-gate.sh`

---

## WEB3_RUNTIME_ACTIVATION_GATE

Gate may run **only after** sections A–G checked for the approved W7 wave.

| Precondition | Sign-off section |
|--------------|------------------|
| W6 plan approved | W6 COMPLETE |
| W6.5-B balance audit | [W6.5-B report](./VACANCY-QF01-HISTORICAL-BALANCE-AUDIT-v1.md) |
| W7 Dry Run | [Dry Run checklist](./TRAVELTRUST-WEB3-VACANCY-W7-DRY-RUN-CHECKLIST-v1.md) |
| Owner sign-off | **This document** |
| Treasury spec | A |
| Vacancy migration spec | B |
| Probe PASS | C |
| Reconcile PASS | D |

**Gate result (fill after W7 prep):** ☐ PASS · ☐ WARN · ☐ FAIL

---

## Signatures

| Role | Name | Signature | Date (UTC) |
|------|------|-----------|------------|
| **Owner** | | | |
| Engineering lead | | | |
| Security / Web3 reviewer | | | |

**Signed file path (after sign):**  
`docs/spec/governance-token/TRAVELTRUST-WEB3-RUNTIME-ACTIVATION-SIGNOFF-v1-SIGNED.md`

---

## After signoff

**Recommended order (before W7 Sepolia broadcast):**

```
W6.5-B PASS → W7 Dry Run PASS → Owner Evidence Review SIGN → WEB3_RUNTIME_ACTIVATION_GATE → W7 Broadcast
```

1. Review and sign [W7 Owner Evidence Review](./TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1.md) (one-page).  
2. Read [W7 Runbook Addendum](./TRAVELTRUST-WEB3-VACANCY-W7-RUNBOOK-ADDENDUM-v1.md) (legacy interface · migration strategy).  
3. Save signed copy of this package + evidence review (do not overwrite templates).  
4. Update `registry/runtime-activation-signoff.v1.yaml` → `status: SIGNED` + `signed_utc`.  
5. Run `WEB3_RUNTIME_ACTIVATION_GATE`.  
6. Only then: **W7 Sepolia Broadcast**.

**Until Owner sign:** ⛔ No Vacancy deploy · No registry switch · No Sepolia state change · **Mainnet not in scope.**

---

## W6.5 certificate

```
W6.5_RUNTIME_ACTIVATION_SIGNOFF: WAITING_OWNER_APPROVAL
PROTOCOL_LAYER: COMPLETE
DEPLOYMENT_PLAN: VERIFIED
FORK_RUNTIME_SIMULATION: PASS
SEPOLIA_RUNTIME_ACTIVATION: WAITING_OWNER_APPROVAL
PRODUCTION_MAINNET: NOT_STARTED
VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE: PASS
W7_SEPOLIA_BROADCAST: BLOCKED
```
