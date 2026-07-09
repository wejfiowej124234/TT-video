# Protocol Conformance Matrix (PCM) · Vacancy Ledger v1

---

## Protocol Version Freeze

| 项 | 值 |
|----|-----|
| **Protocol Version** | **Vacancy Ledger V1** |
| **Spec Status** | **FROZEN** |
| **Implementation Status** | **S3 COMPLETE · S4a W3 COMPLETE · W7 Sepolia Runtime ACTIVE** |
| **PCM Version** | v1.8-20260709 |

**版本纪律（写死）：**

- **FROZEN 期间：** 仅允许 **Implementation**（Gas/storage/event/interface 优化 · 测试 · 接入）— **禁止** 擅自改经济语义。
- **Spec 升级唯一路径：** Governance Spec Change → SSOT bump（如 **V1 → V1.1**）→ Review → PCM 行更新 → 实现。
- **禁止：** FROZEN 状态下通过 PR「顺便」改 180d / 25% / 75% / VL 恒等式 / Epoch Gate。

---

**Matrix ID:** `protocol-conformance-matrix-vacancy-ledger-v1`  
**阶段：** ② 测试网合约实现 · **≠** ③ Production GO

**上位 SSOT（经济规则已锁 · 实现跟着 SSOT）：**

| 文档 | 职责 |
|------|------|
| [protocol-ssot.v1.md §3b～§3c](protocol-ssot.v1.md) | 数值参数 · 实现纪律 · Sprint 顺序 |
| [country-pool-net-profit-accounting-spec-v1.md §6.6～§6.7](country-pool-net-profit-accounting-spec-v1.md) | 会计 prose · U/G 规则 · VL 不变量 |
| [state-machine.v1.md §4b](state-machine.v1.md) | `vacancy_ledger` 状态机 |
| [country-pool-settlement-gate2.2-implementation-readiness-checklist.md §8](country-pool-settlement-gate2.2-implementation-readiness-checklist.md) | Sprint Gate · **G22-D-05** |

**Companion（全协议级）：** [TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md](TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md)

**Risk 图例（审计 / 回归 / PR Review）：**

| Risk | 含义 |
|------|------|
| **Critical** | 不变量 / 反套利 / 参数真源 — **禁止** 无 SSOT 变更合并 |
| **High** | 经济边界 / 隔离 — 须 invariant + 双人 review |
| **Medium** | 可观测性 / 状态命名 — 须测试，不可 silent 改 |

---

## 0. 开发流水线（FROZEN）

```text
Protocol → SSOT → PCM → Contract → Invariant Test → Integration → Indexer → Dashboard
```

**禁止：** 想到功能 → 写代码 → 再改文档。

### 0.1 代码层纪律（S1 起 · 全协议模块沿用）

**目录：按协议分层，不按业务分层**

```text
contracts/src/vacancy/
├── VacancyLedgerLib.sol          # Ledger struct + 纯算法
├── UnallocatedStewardPathVault.sol
├── VacancyEvents.sol
├── VacancyErrors.sol
├── VacancyTypes.sol
└── VacancyGovernance.sol
```

| 规则 | 说明 |
|------|------|
| **DIR-01** | Ledger / Event / Error / Types **不得** 全部塞进单一 Vault |
| **DIR-02** | 新协议模块复用同一分层：`Lib` · `Types` · `Errors` · `Events` · `Governance` · `Vault` |

**Magic Number：零硬编码**

| 规则 | 说明 |
|------|------|
| **GP-CODE-01** | 经济参数 **仅** 读 `vacancyParams.*`（如 `vacancySweepRateBps`） |
| **GP-CODE-02** | SSOT 默认值 **仅** 出现在 deploy script / test helper — **不在** Lib 算法中 |

**函数纯度：evaluate → execute**

| 规则 | 说明 |
|------|------|
| **PURE-01** | `evaluateVacancySweep()` **仅** 计算 · 返回 `SweepPlan` |
| **PURE-02** | `executeSweep(plan)` 负责 emit · transfer · ledger update · `sweepEnabled` |

**Error / Event**

| 规则 | 说明 |
|------|------|
| **ERR-01** | 使用 `VacancyErrors` custom error — **禁止** 裸 `require(string)` |
| **EV-CODE-01** | 六 Vacancy 事件 **均** 含 `uint16 version`（V1 默认 `1`） |

**实现状态（S1+S2 · 2026-07-09）**

| 交付 | 路径 | 测试 |
|------|------|------|
| Core | `contracts/src/vacancy/*` | `test/vacancy/VacancyLedgerCore.t.sol` · **11/11** |
| Invariant | `test/vacancy/VacancyLedgerInvariant.t.sol` | **G22-D-05** · **18/18** · 256 runs × 5 invariants |
| Handler | `test/vacancy/handlers/VacancyLedgerHandler.sol` | deposit · sweep · disburse · reenable |
| Fixture | `test/vacancy/fixtures/VacancyInvariantFixture.sol` | VL-01～VL-05 checks |

---

## 1. PCM 主表（Spec → Risk → Module → Test → Audit）

**图例：** S2 完成后测试列标记 **IMPLEMENTED** + `.t.sol` 路径。

**Sprint 归属：** **S1** = VacancyLedger Core · **S2** = Fuzz invariant · **S3** = Ledger 接入 · **S4** = 展示层

### 1.1 Ledger Invariants（VL-*）

| Spec ID | Risk | 协议要求（摘要） | 实现模块 | 函数 / 路径 | Sprint | 测试用例 | 审计检查点 |
|---------|------|------------------|----------|-------------|--------|----------|------------|
| **VL-01** | **Critical** | `principal == swept + reserve + disbursed` | `VacancyLedgerCore`¹ | `depositToReserve` · `evaluateVacancySweep` · `disburseJurisdictionReserve` | S1·S2 | **IMPLEMENTED** · `invariant_VL01_ledgerIdentity` · `VacancyLedgerCore.t.sol` · `VacancyLedgerInvariant.t.sol` | `view ledger()` 与事件四维一致 |
| **VL-02** | **Critical** | `reserve,swept,disbursed >= 0` | `VacancyLedgerCore`¹ | 全部 mutating | S1·S2 | **IMPLEMENTED** · `invariant_VL02_nonNegative` · `VacancyLedgerInvariant.t.sol` | 负值 revert |
| **VL-03** | **High** | `swept <= principal × cap_bps` | `VacancyLedgerCore`¹ | `evaluateVacancySweep` | S1·S2 | **IMPLEMENTED** · `invariant_VL03_sweepCap` · `VacancyLedgerInvariant.t.sol` | 累计 swept ≤ cap |
| **VL-04** | **High** | `sweepEnabled=false` ⇒ reserve ≥ floor | `VacancyLedgerCore`¹ | `evaluateVacancySweep` · `ReserveReached` | S1·S2 | **IMPLEMENTED** · `invariant_VL04_reserveFloor` · `VacancyLedgerInvariant.t.sol` | floor 后不可 sweep 破底 |
| **VL-05** | **Critical** | `disbursed` 仅经 governance disburse | `VacancyLedgerCore`¹ | `disburseJurisdictionReserve` | S1·S2 | **IMPLEMENTED** · `invariant_VL05_disburseOnlyGov` · `VacancyLedgerInvariant.t.sol` | 无 Timelock 不变 disbursed |

**S1 物理载体：** `contracts/src/vacancy/`（`UnallocatedStewardPathVault` + `VacancyLedgerLib`）— **仅 Core API，不接入 Ledger/Settlement/API**。

### 1.2 Accounting Rules（U-07～U-09）

| Spec ID | Risk | 协议要求（摘要） | 实现模块 | 函数 / 路径 | Sprint | 测试用例 | 审计检查点 |
|---------|------|------------------|----------|-------------|--------|----------|------------|
| **U-07** | **High** | Vacancy sweep → `GovernanceTreasury`（≠ U-02 55% 腿） | `VacancyLedgerCore`¹ | `executeSweep` | S1 | **IMPLEMENTED** · `test_executeSweep_transfersToTreasuryAndUpdatesLedger` · `VacancyLedgerCore.t.sol` | `SweepExecuted.to` = Treasury |
| **U-08** | **Critical** | 地板 reserve 禁止无提案 sweep/burn | `VacancyLedgerCore`¹ | `evaluateVacancySweep` | S1·S2 | **IMPLEMENTED** · `test_U08_noSweepBelowFloor` · `VacancyLedgerInvariant.t.sol` | floor 以下不可动 |
| **U-09** | **High** | 禁止跨 jurisdiction 混账 | `UnallocatedStewardPathVault` | `immutable jurisdiction` | S1 | **IMPLEMENTED** · constructor immutability · `VacancyLedgerCore.t.sol` | 一 J 一实例 |

### 1.3 Steward Activation Gate（G-*）

| Spec ID | Risk | 协议要求（摘要） | 实现模块 | 函数 / 路径 | Sprint | 测试用例 | 审计检查点 |
|---------|------|------------------|----------|-------------|--------|----------|------------|
| **G-01** | **Critical** | 写入 `stewardActivationEpochId` | `CountryPoolNetProfitLedger` | `setActiveStewardConfig` | **S3b** | **IMPLEMENTED** · `test_G01_activationEpochWritten` · `CountryPoolNetProfitVacancyS3b.t.sol` | 新激活 = `latestEpochId` |
| **G-02** | **Critical** | 禁止 release 历史 epoch | Vault + Ledger | `releaseToStewardPath(releaseEpochId)` guard | **S3b** | **IMPLEMENTED** · `test_G02_releaseBlockedForHistoricalEpoch` · `CountryPoolNetProfitVacancyS3b.t.sol` | `releaseEpochId <= activationEpochId` revert |
| **G-03** | **Critical** | 仅 post-activation 45% → StewardPath | `CountryPoolNetProfitLedger` | `_routeStewardLeg` · `epochId > stewardActivationEpochId` | **S3b** | **IMPLEMENTED** · `test_G03_postActivationSplitToStewardPath` · `test_G03_preActivationSplitStaysUnallocated` · `CountryPoolNetProfitVacancyS3b.t.sol` | 同 epoch 激活 → Unallocated |
| **G-04** | **Critical** | Reserve 仅 DAO disburse · 非 activate 自动发 | `UnallocatedStewardPathVault` | `disburseJurisdictionReserve` · `setDisburseRecipientAllowed` | S1·S2·**S3c** | **IMPLEMENTED** · `invariant_VL05_disburseOnlyGov` · `CountryPoolNetProfitVacancyS3c.t.sol` | Timelock-only · allowlist · 禁 StewardPath |

### 1.4 Sweep · 状态机 · 参数 · 事件

| Spec ID | Risk | 协议要求（摘要） | 实现模块 | 函数 / 路径 | Sprint | 测试用例（PLANNED） | 审计检查点 |
|---------|------|------------------|----------|-------------|--------|---------------------|------------|
| **SM-01** | **High** | 状态机四态 + 回归 ACTIVE | `CountryPoolNetProfitLedger` | `vacancyState` · `_updateVacancyState` | **S3a** | **IMPLEMENTED** · `test_SM01_vacancyStateTransitions` · `CountryPoolNetProfitVacancyS3a.t.sol` | GRACE→SWEEP on split |
| **SM-02** | **Medium** | `ReserveReached` 事件 only · 仍 SWEEP | `VacancyLedgerCore`¹ | `executeSweep` | S1 | **IMPLEMENTED** · `test_executeSweep_threeQuartersThenReserveReached` · `VacancyLedgerCore.t.sol` | 无 reserve 终态 enum |
| **SM-03** | **High** | sweep 关闭后不自动恢复 | `VacancyLedgerCore`¹ | `sweepEnabled` · governance re-enable | S1·S2·**S3a** | **IMPLEMENTED** · `test_S3a_sweepDisabledDoesNotAutoReenable` · `VacancyLedgerInvariant.t.sol` | 仅 `setVacancySweepEnabled` |
| **TR-01** | **Critical** | Sweep 仅经 settlement 链 | `CountryPoolNetProfitLedger` | `splitNetProfit`→`evaluateAndExecuteVacancySweep` | **S3a** | **IMPLEMENTED** · `test_integration_TR01_sweepOnlyViaSplitNetProfit` · `CountryPoolNetProfitVacancyS3a.t.sol` | Ledger-only sweep 入口 |
| **GP-01** | **Critical** | 参数读 governance storage · 不写死 | `VacancyLedgerCore`¹ | `vacancyParams` view/set | S1·S2 | **IMPLEMENTED** · `test_setVacancyParams_readsFromStorageNotLiterals` · `test_boundary_invalidParams_*` · `VacancyLedgerCore.t.sol` · `VacancyLedgerInvariant.t.sol` | 与 SSOT default 可对照 |
| **EV-01** | **Medium** | 六事件 ABI 冻结 · Vault 侧 emit | Vault (+ Ledger S3) | 见 §2 | S1·S3 | `test_EV01_events` | Indexer schema |

---

## 2. 事件 PCM

| 事件 | Risk | Emit Sprint | 模块 | 触发 |
|------|------|-------------|------|------|
| `VacancyEntered` | High | **S3a** ✅ | Ledger | → GRACE from ACTIVE |
| `GraceStarted` | Medium | **S3a** ✅ | Ledger | grace timer start |
| `SweepExecuted` | High | **S1** | Vault | `evaluateVacancySweep` |
| `ReserveReached` | Medium | **S1** | Vault | sweep 关闭 |
| `StewardActivated` | Critical | **S3b** ✅ | Ledger | → STEWARD_ACTIVE · G-01 |
| `JurisdictionReserveDisbursed` | Critical | **S1** | Vault | `disburseJurisdictionReserve` |

**S1：** 六事件 **signature + NatSpec 冻结**；Vault 负责 emit 其三；Ledger 三事件 **S3 接入**。

**Dashboard（S4）：** Vault → Indexer → UI **Read Only** · **禁止** `reserve = principal - swept - disbursed` 前端重算。

---

## 3. Sprint Definition of Done

### Sprint 1 · VacancyLedger Core（S1 · 唯一目标）

**不以「功能数量」衡量，以「协议模块完成度」衡量。**

#### S1 Exit Criteria（全部满足 = Sprint 1 成功）

**协议实现**

| # | 交付项 | 验收 |
|---|--------|------|
| I-01 | `VacancyLedger` 数据结构 | storage/view 与 §6.6.2 一致 |
| I-02 | `depositToReserve()` | 单元测试 green · VL-01 每笔 deposit 后成立 |
| I-03 | `evaluateVacancySweep()` | cap/floor/linear 公式与 SSOT 一致 |
| I-04 | `disburseJurisdictionReserve()` | 仅 Timelock/owner · VL-05 |
| I-05 | Governance Parameters 读取 | **不写死** 180/25/75/25 · GP-01 |
| I-06 | 六事件 **定义** 完成 | Vault 负责 emit：`SweepExecuted` · `ReserveReached` · `JurisdictionReserveDisbursed`；其余三事件 signature 冻结待 S3 |

**协议验证**

| # | 交付项 | 验收 |
|---|--------|------|
| V-01 | `invariant_VL01_ledgerIdentity` | **必须通过**（S1 最低验收杠） |
| V-02 | **零编译依赖** | 与 Ledger · Settlement · API · Indexer **无任何 import/调用** |
| V-03 | NatSpec 100% | 每个 `public`/`external` 含 Spec ID + PCM 行 + Risk |

**协议边界（S1 内禁止突破）**

| ❌ 禁止 |
|--------|
| 不接 `CountryPoolNetProfitLedger` |
| 不接 `splitNetProfit` |
| 不接 Settlement |
| 不接 API |
| 不接 Dashboard / UI / Indexer |

**成功定义：** Sprint 1 结束时仍是 **完全独立、可验证的协议模块** — 即成功。

**PCM 行：** §1.1 VL-* · §1.2 U-* · G-04 · SM-02/03 · GP-01 · EV-01（Vault 部分）→ **IMPLEMENTED**

### Sprint 2 · 证明协议（S2 · **G22-D-05** · ✅ COMPLETE）

**核心指标：100% Invariant，不是 100% Coverage。**

| 类别 | DoD | 状态 |
|------|-----|------|
| **Gate** | `forge test --match-contract VacancyLedgerInvariant` exit 0 | ✅ **18/18** |
| **Fuzz 不变量** | `invariant_VL01`～`VL05` · `invariant_SM03` · 256 runs × 128k calls | ✅ |
| **Handler** | `VacancyLedgerHandler.sol` — deposit · sweep · disburse · reenable | ✅ |
| **边界** | zero amount · insufficient reserve · invalid params · non-owner | ✅ |
| **辅助** | Line coverage 可参考 · **不得** 替代 invariant 作为 DoD | — |

**测试目录：**

```text
contracts/test/vacancy/
├── VacancyLedgerInvariant.t.sol
├── handlers/VacancyLedgerHandler.sol
└── fixtures/VacancyInvariantFixture.sol
```

### Sprint 3a · Ledger 接入 — split → sweep（✅ COMPLETE · 2026-07-09）

**唯一目标：** `splitNetProfit()` → `evaluateAndExecuteVacancySweep()` — **不接 API / Dashboard / Indexer**

| # | DoD | 状态 |
|---|-----|------|
| 1 | 无 Active Seat 时 `splitNetProfit` 写入 VacancyLedger（`depositFromLedger`） | ✅ |
| 2 | **仅** Quarter Settlement 触发 sweep（`splitNetProfit` 链） | ✅ TR-01 |
| 3 | 宽限期内不 sweep | ✅ `test_S3a_noSweepDuringGracePeriod` |
| 4 | 宽限结束后按 plan sweep | ✅ `test_S3a_sweepAfterGraceViaSplitNetProfit` |
| 5 | `sweepEnabled=false` 后不自动恢复 | ✅ `test_S3a_sweepDisabledDoesNotAutoReenable` |
| 6 | `CountryPoolNetProfit*` 回归 | ✅ **61/61** |
| 7 | PCM S3a 行 IMPLEMENTED | ✅ |

**S3a 禁止：** StewardActivationEpoch 释放 · DAO UI · Indexer · Dashboard · `/governance/params`

**测试：** `contracts/test/vacancy/CountryPoolNetProfitVacancyS3a.t.sol`

### Sprint 3b · StewardActivationEpoch Gate（✅ COMPLETE · 2026-07-09）

**唯一目标：** 新 Steward 仅可领取激活后 epoch 的新增 45% — **禁止** 历史 Unallocated / Reserve 转移

| # | DoD | 状态 |
|---|-----|------|
| 1 | `setActiveStewardConfig` 写入 `stewardActivationEpochId` | ✅ G-01 |
| 2 | `epochId <= activationEpochId` 禁止 `releaseToStewardPath` | ✅ G-02 |
| 3 | `epochId > activationEpochId` 才进入 StewardPath | ✅ G-03 |
| 4 | 历史 reserve / swept / disbursed 不因激活转移 | ✅ `test_activationPreservesVacancyLedgerBalances` |
| 5 | VacancyLedger 激活时 **不 reset** · 仅 `vacancyState → STEWARD_ACTIVE` | ✅ |
| 6 | G-01～G-03 测试 IMPLEMENTED | ✅ `CountryPoolNetProfitVacancyS3b.t.sol` |
| 7 | `CountryPoolNetProfit*` 回归全绿 | ✅ **66/66** |

**S3b 禁止：** DAO Disbursement UI · Dashboard · Indexer · API · 前端公示页

**ABI 变更（ intentional ）：** `releaseToStewardPath(uint256 amount, uint256 releaseEpochId, bytes32 proposalRef)` · selector `0xdfa1aad4`

**测试：** `contracts/test/vacancy/CountryPoolNetProfitVacancyS3b.t.sol`

### Sprint 3c · Jurisdiction Reserve DAO Disbursement（✅ COMPLETE · 2026-07-09）

**唯一目标：** Governor → Timelock → `disburseJurisdictionReserve` → Restricted Treasury — **不接 Indexer / Dashboard / API**

| # | DoD | 状态 |
|---|-----|------|
| 1 | `disburseJurisdictionReserve(amount, recipient, proposalRef)` 生产路径 | ✅ |
| 2 | 仅 Timelock / Governor 路径 · 非治理 revert | ✅ `test_only_governance_can_disburse` |
| 3 | `setDisburseRecipientAllowed` 白名单 · 禁 StewardPath/Ledger recipient | ✅ |
| 4 | disburse 后 VL-01 成立 · principal / swept 不变 | ✅ `test_disburse_preserves_principal` |
| 5 | reserve ↓ · disbursed ↑ | ✅ `test_disburse_updates_reserve` |
| 6 | `JurisdictionReserveDisbursed` emit | ✅ `test_disburse_emits_event` |
| 7 | Steward 不可 claim reserve | ✅ `test_steward_cannot_claim_reserve` |
| 8 | Governance payload · ABI manifest | ✅ `CPNP_DISBURSE_*` · `CPNP_SET_DISBURSE_RECIPIENT` |
| 9 | `CountryPoolNetProfit*` + Vacancy 回归全绿 | ✅ |

**S3c 禁止：** Dashboard · Indexer · Admin UI · `/governance/params` API

**测试：** `contracts/test/vacancy/CountryPoolNetProfitVacancyS3c.t.sol`

### Sprint 3 · Ledger 接入（✅ COMPLETE · S3a+S3b+S3c）

| 步骤 | 范围 | PCM |
|------|------|-----|
| **S3a** | `splitNetProfit` → `evaluateVacancySweep` · SM-01 · TR-01 · Ledger 三事件 | TR-01 · SM-01 · EV Ledger |
| **S3b** | `StewardActivationEpoch` · G-01～G-03 | G-01～G-03 ✅ |
| **S3c** | DAO disburse 生产路径 · Restricted Treasury allowlist | G-04 ✅ |

### Sprint 4 · 展示层（S4 · 分 S4a / S4b）

| 阶段 | 范围 | 状态 |
|------|------|------|
| **S4a** | Indexer · 六事件 · `vacancy_ledger_projections` · schema v1 · **W3 reconcile gate** | **COMPLETE** |
| **S4b** | Admin / Operations View · **禁止**前端重算 reserve | **COMPLETE** (W4b) |
| **W4a** | Governance `/governance/vacancy-ledger` · Protocol Transparency | **COMPLETE** |
| **W4b** | Admin `/admin/vacancy-ledger` · Protocol Operations Console (read-only) | **COMPLETE** |

#### S4a · 链下读取层（Indexer · 2026-07-09）

**目标：** 链上 Vacancy 状态可观察 — **不接 Dashboard**

| # | DoD | 状态 |
|---|-----|------|
| 1 | 监听六事件（EV-01） | ✅ `vacancy_ledger_indexer.rs` · `event_name_from_topic0` |
| 2 | 生成 jurisdiction snapshot JSON（**不**重算 reserve） | ✅ `VacancyLedgerSnapshot` |
| 3 | DB 投影 `vacancy_ledger_projections` | ✅ migration `20260709120000` |
| 4 | `indexer-tick` upsert 路径 | ✅ |
| 5 | Schema SSOT | ✅ `vacancy-ledger-indexer-schema-v1.json` |
| 6 | Admin read API（只读 · S4b 前置） | ✅ `GET /api/v1/admin/vacancy-ledger/:jurisdiction` |
| 7 | **W3a** Reconcile gate · projection ↔ `vacancyLedger()` + ledger views | ✅ `vacancy_ledger_reconcile.rs` · `check-web3-vacancy-indexer-reconcile-gate.sh` |
| 8 | **W3b** 六事件 → projection 测试 | ✅ Rust lib tests · 无 reserve 重算 |
| 9 | DE Sepolia live boundary | ✅ **LIVE_V1** · `live_de_reconcile_when_env_set` PASS · W7 post-activation |

**Gate ID:** `WEB3_VACANCY_INDEXER_RECONCILE` · `bash scripts/gates/check-web3-vacancy-indexer-reconcile-gate.sh`

#### Protocol vs Runtime Deployment（2026-07-09）

**Gate ID:** `VACANCY_DEPLOYMENT_READINESS` · `bash scripts/gates/check-vacancy-deployment-readiness-gate.sh`

**W4a API:** `GET /api/v1/governance/vacancy-ledger` · `protocolVersion` / `runtimeStatus` / `reconcileStatus` / jurisdictions + timeline

**W4a UI:** `/governance/vacancy-ledger` · Vacancy Ledger Transparency · Indexer-only · no RPC · no reserve recompute

**W4b API:** `GET /api/v1/admin/vacancy-ledger` · reconciliation · indexer health · event explorer · runtime capability

**W4b UI:** `/admin/vacancy-ledger` · Protocol Operations Console · read-only · no sweep/disburse/upgrade/deploy

**API build debt (isolated):** `API_BUILD_HEALTH` · `registry/api-build-health.v1.yaml` — full bin compile debt must not conflate with Vacancy gates

**SSOT:** `registry/vacancy-v1-runtime-deployment-status.v1.yaml`

| Layer | Status | 说明 |
|-------|--------|------|
| Protocol implementation | **PASS** | 本地 Vacancy V1 源码 + Forge |
| Local Forge tests | **PASS** | S1–S3 + invariant |
| Indexer (W3) | **PASS** | 六事件 projection · capability probe |
| Sepolia DE Vacancy V1 runtime | **ACTIVE** | W7 deploy · capability probe · live reconcile |
| Production Vacancy V1 runtime | **PENDING** | 未部署 |

**纪律：** 「协议完成」≠「链上已升级」。W4 Governance read-only 可在 runtime PENDING 时进行，UI 须展示 runtime 状态。

**Env：** `UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS` · `COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS` · `VACANCY_RECONCILE_LIVE=1`（仅 Vacancy V1 链上视图可用时）

#### S4b · Protocol Operations Console（✅ COMPLETE · W4b · 2026-07-09）

**定位：** Protocol Operations Console — 服务运维 / 财务 / 审计 / 链上排障；**不是**普通 Admin 写面板。

**纪律：** UI **仅**展示 Indexer 字段 — **禁止** `reserve = principal - swept - disbursed` · **禁止** sweep / allowlist / disburse / upgrade / deploy（须 Governor → Timelock）

| # | DoD | 状态 |
|---|-----|------|
| 1 | Reconciliation 状态（reconcileStatus · drift · blocks） | ✅ `vacancy_ops` · admin API |
| 2 | Indexer 健康（lag · event count · last timestamp） | ✅ |
| 3 | Event Explorer（indexed 六事件 · tx/block/amount） | ✅ `list_vacancy_event_explorer` |
| 4 | Runtime capability 面板（Protocol V1 vs Q-F01 Legacy） | ✅ |
| 5 | 前端只读 contract test | ✅ `vacancy-ledger-ops-readonly.spec.ts` |

**页面字段：** Principal · Swept · Reserve · Disbursed · State · Reconcile · Indexer lag · Events

**数据链：** Vault → Indexer → Admin Ops Console（只读）

### Vacancy Ledger V1 Completion Gate

**Gate ID:** `VACANCY_LEDGER_V1_PROTOCOL_COMPLETE`

| 条件 | 验证 |
|------|------|
| S1 PASS | `VacancyLedgerCore` |
| S2 PASS | `VacancyLedgerInvariant` · G22-D-05 |
| S3a/b/c PASS | `CountryPoolNetProfitVacancyS3*` |
| PCM 全 IMPLEMENTED（协议层） | PCM v1.8 |
| Forge 全绿 | `scripts/ops/vacancy-ledger-v1-protocol-complete-gate.sh` |

### Sprint 4 · 展示层（legacy 一行）

Vault/Ledger → Indexer → Dashboard/Admin/API · **Read Only** · PCM §2 Indexer 列填实。

---

## 4. NatSpec 模板（S1 强制）

```solidity
/// @notice Credit vacant-path deposit into Jurisdiction Reserve ledger leg.
/// @dev Spec: VL-01, U-07 | Accounting: §6.6.2 deposit | State: SWEEP | PCM: §1.1 VL-01 | Risk: Critical
function depositToReserve(uint256 amount, uint256 epochId) external;
```

---

## 5. PCM 维护规则

| 规则 | 说明 |
|------|------|
| **PCM-01** | Spec 变更 → SSOT → PCM → Code |
| **PCM-02** | 每 PR 更新测试列 + Risk 行 sign-off |
| **PCM-03** | **Critical** 行须审计 explicit ack |
| **PCM-04** | Spec **FROZEN** 时仅 **Implementation** PR |

### 5.1 PR 审查纪律（Spec → Code → Test → Review）

**凡 PR 修改 **Critical** PCM 行（或对应实现路径），PR 描述 **必须** 包含：**

1. **Spec ID**（如 `VL-01` · `G-04` · `TR-01`）
2. **PCM 行引用**（如 `PCM §1.1 VL-01`）
3. **测试结果**（如 `invariant_VL01_ledgerIdentity` pass · 或 fuzz run 链接）

**模板（PR 描述粘贴）：**

```markdown
## PCM Conformance
| Spec ID | Risk | PCM | Tests |
|---------|------|-----|-------|
| VL-01 | Critical | §1.1 | invariant_VL01_ledgerIdentity ✓ |
```

**无 Critical 行改动的 PR：** 可选填；**有 Critical 改动而未填 → 拒绝合并。**

---

## 6. 变更记录

| Version | Date | Note |
|---------|------|------|
| v1.11-20260709 | 2026-07-09 | **W4b COMPLETE** · Protocol Operations Console · `GET /api/v1/admin/vacancy-ledger` · `API_BUILD_HEALTH` gate isolated |
| v1.10-20260709 | 2026-07-09 | **W4a COMPLETE** · `GET /api/v1/governance/vacancy-ledger` · `/governance/vacancy-ledger` transparency UI |
| v1.9-20260709 | 2026-07-09 | **S4a W3 COMPLETE** · `VACANCY_DEPLOYMENT_READINESS` · runtime PENDING vs protocol PASS |
| v1.7-20260709 | 2026-07-09 | **S3c COMPLETE** · DAO disburse Timelock path · **S3 协议闭环** |
| v1.6-20260709 | 2026-07-09 | **S3b COMPLETE** · StewardActivationEpoch Gate · G-01～G-03 · release ABI 3-arg |
| v1.5-20260709 | 2026-07-09 | **S3a COMPLETE** · splitNetProfit→evaluateAndExecuteVacancySweep · SM-01 · TR-01 · EV Ledger |
| v1.4-20260709 | 2026-07-09 | S2 invariant suite IMPLEMENTED · G22-D-05 green · VL-01～VL-05 PCM 测试列更新 |
| v1.3-20260709 | 2026-07-09 | S1 实现落地 · §0.1 代码层纪律 · `contracts/src/vacancy/` |
| v1.2-20260709 | 2026-07-09 | S1 Exit Criteria（I/V 清单 + 边界）· S2 invariant 主指标 · PR Critical 审查纪律 §5.1 |
| v1.1-20260709 | 2026-07-09 | Protocol Version Freeze · Risk 列 · S1=VacancyLedger Core · depositToReserve |
| v1-20260709 | 2026-07-09 | 首版 FROZEN |
