# TT-PHASE2-CONTRACT-DEPLOYMENT-READINESS

**阶段口径：** **① 本地 → ② 测试网（Sepolia）→ ③ 主网/生产**

**文档类型：** Phase ② **链上部署前合约审查** — 权限表 · 升级策略 · Sepolia 顺序 · registry/API 同步

**审查日期：** 2026-06-05

**架构决策（② 写死）：**

| 决策 | ② 测试网 |
|------|----------|
| **Escrow** | **不可升级** — 每单 **`new Escrow(factory)`** 全量部署，**不引入 Escrow Proxy / EIP-1167** |
| **分层** | **Immutable Core**（Escrow 资金终态）+ **Governable Shell**（FeeRouter / Timelock 白名单目标 / 运维 Pause） |
| **Proxy / UUPS** | **全仓库 `contracts/src/` 零实现** — Shell 变更靠 **新部署 + Timelock 改指针**，非原地换 Implementation |

**诚实边界：** 本文基于 **代码 + 部署脚本** 静态审查；**`forge test` 全绿 ≠ 外部审计 ≠ ③ Production GO**。Sepolia 广播前须 Owner 确认 **Timelock.admin = 多签**（非部署 EOA 长期持有）。

**互指：** [TT-PHASE2-STAGING-READINESS-REPORT](./TT-PHASE2-STAGING-READINESS-REPORT.md) · [TT-9630](./TT-9630-protocol-convergence-testnet-pregate.md) · [TT-9629](./TT-9629-protocol-convergence-steward-stake-testnet.md) · [contracts/README](../../contracts/README.md) · [08-4 §Immutable Core](../spec/08-4-对外口径包.md)

---

## 1 · 总表

| 项 | 结论 |
|----|------|
| **Escrow 可升级？** | **否** — 无 owner · 无 Proxy · 部署后 bytecode 固定 |
| **② 是否引入 Escrow Proxy？** | **否（明确禁止）** |
| **Governable Shell** | FeeRouter · RegionVault · Timelock 调度 · Factory guardian pause · Protocol V0 `owner` 配置 |
| **forge test** | **104 passed**（审查日 `cd contracts && forge test`） |
| **registry 地址槽** | **`testnet_template` 仍 null** — 部署后必填 |
| **外部审计** | **未做** — ③ 前缺口 |

---

## 2 · Immutable Core vs Governable Shell（② 边界）

```
┌─────────────────────────────────────────────────────────────┐
│ Immutable Core（不可升级 · ② 不引入 Proxy）                    │
│  Escrow（每单实例）· 释放/退款/裁决数学 · init 后参数封存        │
└─────────────────────────────────────────────────────────────┘
                              │
                    platformFeeRecipient
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Governable Shell（逻辑仍非 Proxy；靠 Timelock owner 改配置）     │
│  FeeRouter · RegionVault · ReserveVault · Treasury          │
│  EscrowFactory.guardian（仅 pause 新单）                      │
│  RegionStewardStakePool / CountryPool*V0 owner（配置/运维）     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 治理层（Timelock + Governor · delay 部署后 immutable）          │
│  GovernanceTimelock · TravelTrustGovernor · GovernanceVotesToken│
└─────────────────────────────────────────────────────────────┘
```

**历史订单：** 已部署 Escrow **永不**因 Shell 迁址而改逻辑；迁 FeeRouter 时仅 **新单** `platformFeeRecipient` 指向新 Router（Runbook §7.1）。

---

## 3 · 分合约权限表

图例：

- **可升级**：是否存在 Proxy/UUPS/delegatecall 换逻辑 → 本仓库均为 **否**
- **② Timelock 绑定**：Sepolia 推荐控制面；**必须** / **应该** / **部署脚本默认（须改）** / **N/A**
- **Pauser**：能暂停用户路径的角色（非 Solidity `Pauser` 合约名）

### 3.1 Escrow（Immutable Core）

| 角色 | 存在？ | 地址（② 推荐） | 权限 | 可升级 | Timelock/多签 |
|------|--------|----------------|------|--------|---------------|
| **owner** | **无** | — | — | **否** | N/A |
| **guardian** | **无** | — | — | **否** | N/A |
| **admin** | **无** | — | — | **否** | N/A |
| **pauser** | **无** | — | — | **否** | N/A |
| **factory** | 有（immutable 引用） | EscrowFactory | 仅 **`init`** 一次 | **否** | N/A |

**用户/仲裁路径（无 admin 后门）：**

| 函数 | 调用方 | 资金效果 |
|------|--------|----------|
| `deposit` | traveler | 入金 → Funded |
| `refund` | traveler | 全额退 traveler |
| `release` / `releasePartialRefund` / `releaseSlashed` | **无角色门闸**（Funded 态） | 按 BPS/附录分账 |
| `openDispute` | **无角色门闸** | → Disputed |
| `executeResolution` | **无角色门闸**（Disputed 态） | 三腿守恒裁决 |

**审查结论：** 无 `emergencyWithdraw` · 无 `upgradeTo` · 无 `onlyOwner` — **符合 Immutable Core**。`release*` / `openDispute` 无 caller 约束为 **产品/keeper 设计**，非升级面；若需仅 traveler/guide 可触发，属 **V2 新合约**，**非 Proxy 升级**。

**部署模式：** `EscrowFactory.createEscrow` → **`new Escrow(this)`**（**非** minimal proxy；`implementation` 字段为占位）。

---

### 3.2 EscrowFactory（Shell · 新单门闸）

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **guardian** | **是** | **多签或 Timelock admin 多签** | `setFactoryPaused` · `transferGuardian` | **否** | **应该**（脚本默认 deployer ❌） |
| **owner** | **无** | — | — | **否** | N/A |
| **admin** | **无** | — | — | **否** | N/A |
| **pauser** | **= guardian** | 同上 | `factoryPaused=true` 阻断 **新** `createEscrow` | **否** | **应该** |

**不影响：** 已部署 Escrow 实例继续履约（B-091）。

**Deploy.s.sol / DeployFundStackUnderTimelock：** `new EscrowFactory(deployer)` — **Sepolia 广播后须 `transferGuardian(多签)`**。

---

### 3.3 FeeRouter（Shell · 费路由）

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **owner** | **是** | **`GovernanceTimelock` 地址** | `distribute` · `setRoutingConfig` · `setDistributePaused` · `transferOwnership` | **否**（ bytecode 固定；配置可变） | **必须** |
| **guardian** | **无** | — | — | **否** | N/A |
| **admin** | **无** | — | — | **否** | N/A |
| **pauser** | **= owner** | Timelock | `setDistributePaused(true)` 阻断新拆分 | **否** | **必须** |

**Timelock 路径：** `schedule`/`scheduleByGovernor` → `execute` → 调用 `setRoutingConfig` 等（须 **`allowedExecutionTarget[feeRouter]=true`**）。

**Deploy.s.sol：** `FeeRouter(owner=timelock)` ✅

---

### 3.4 RegionVault（Shell · 国家桶）

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **owner** | **是** | **Timelock** | `forward` · `emitRegionShareSnapshotLine` · `transferOwnership` | **否** | **必须** |
| **guardian/admin/pauser** | **无** | — | — | **否** | N/A |

**DeployFundStackUnderTimelock：** `RegionVault(timelockAddr)` ✅

---

### 3.5 GovernanceTimelock（治理执行层）

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **admin** | **是** | **多签（N-of-M）** | `schedule` · `setGovernor` · `setAllowedExecutionTarget` | **否** | **必须** |
| **governor** | **是**（可变） | **TravelTrustGovernor** | `scheduleByGovernor` | **否** | 部署后 `setGovernor` |
| **delay** | **immutable** | 构造注入 | — | **否** | Sepolia 可 120s；③ 另议 |
| **pauser** | **无独立** | — | 间接：Shell 合约 `*Paused` | — | — |

**B-407 白名单：** 仅 `allowedExecutionTarget[target]=true` 可被 schedule/execute — **不能**对任意地址 call。

**绕过风险：** `admin` EOA 单签 = **终极控制路径** — **② 禁止长期保持 deployer EOA**。

---

### 3.6 TravelTrustGovernor（治理提案层）

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **owner/admin/guardian** | **无** | — | — | **否** | N/A |
| **token / timelock** | **immutable 引用** | TTG · Timelock | — | **否** | 构造绑定 |
| **votingDelay/Period/threshold/quorum** | **immutable** | 构造注入 | — | **否** | — |
| **orderRatingReviewWindowDays** | 可变 | **仅 Timelock** 可调 | `setOrderRatingReviewWindowDays` | **否** | 治理 proposal → queue → execute |

**不能改：** Escrow 逻辑 · 历史订单参数 · TTG 总量（Governor 无 mint）。

---

### 3.7 GovernanceVotesToken（TTG）

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **owner/admin** | **无** | — | — | **否** | N/A |
| **mint** | **仅 constructor 一次** | 初始给 deployer | 之后 **无** public mint | **否** | 分配后分散/锁仓 |

**② 注意：** `DeployGovernanceStack` 默认 **10M TTG → deployer**；测试网须规划分配（团队桶脚本见 contracts/README）。

---

### 3.8 RegionStewardStakePool（Protocol P2 · V1）

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **owner** | **是** | **Timelock** | `configureJurisdiction` · `transferOwnership` | **否** | **必须**（脚本默认 deployer ❌） |
| **guardian/admin/pauser** | **无** | — | — | **否** | N/A |

**immutable：** `ttg` · `ttgTotalSupplyUnits` · `releaseDelaySeconds` · `releaseVestSeconds`

**用户路径：** `stake` · `requestRelease` · `claimReleased` — 无 owner 干预用户本金（除 jurisdiction 配置）。

**演进：** 逻辑变更 = **部署 `RegionStewardStakePoolV1` 新地址** + registry/API 切指针 — **非 Proxy**。

---

### 3.9 CountryPoolLedgerV0

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **owner** | **是** | **Timelock** | `credit` · `transferOwnership` | **否** | **应该** |
| **pilotJurisdiction** | **immutable** | 构造注入（如 CN/DE） | — | **否** | — |

**无用户 withdraw：** 仅 owner `credit` 拉 token 入账。

---

### 3.10 CountryPoolSubVaultsV0

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **owner** | **是** | **Timelock** | `configureSubVaults` · `transferOwnership` | **否** | **应该** |

**不托管资产** — 纯地址登记表。

---

### 3.11 CountryPoolRedemptionEpochV0

| 角色 | 存在？ | ② 推荐绑定 | 权限 | 可升级 | Timelock/多签 |
|------|--------|------------|------|--------|---------------|
| **owner** | **是** | **Timelock** | `openEpoch` · `settleEpoch` · `transferOwnership` | **否** | **必须**（脚本默认 deployer ❌） |
| **guardian/admin/pauser** | **无** | — | — | **否** | N/A |

**immutable：** `asset` · `jurisdiction` · `maxNavPctBps` · `windowSeconds`

**用户路径：** `requestRedemption` · `cancelRedemption` · `claim` · `fundRedemptionVault`

**registry 键：** `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS`

---

## 4 · 升级策略矩阵（汇总）

| 合约 | Proxy/UUPS | 逻辑升级方式 | ② 策略 |
|------|------------|--------------|--------|
| **Escrow** | **无** | **不可** — 仅新单新实例 | **Immutable Core · 禁止 Proxy** |
| **EscrowFactory** | **无** | 新 Factory 地址 + 前端/API 切工厂 | guardian → 多签 |
| **FeeRouter** | **无** | 新 Router + Escrow `platformFeeRecipient` 迁址 + Timelock `setRoutingConfig` | Shell · owner=Timelock |
| **RegionVault** | **无** | 新 Vault + FeeRouter 路由指向 | Shell · owner=Timelock |
| **GovernanceTimelock** | **无** | **不可** — 新 Timelock = 新治理栈 | admin=多签 |
| **TravelTrustGovernor** | **无** | **不可** — 新 Governor 部署 | 与 Timelock 绑死 |
| **GovernanceVotesToken** | **无** | **不可** — 新 token = 新治理资产 | ② 一次部署 |
| **RegionStewardStakePool** | **无** | **V2 新合约** + env/registry | owner→Timelock |
| **CountryPool*V0** | **无** | **V1 新合约**（文件名已示 V0） | owner→Timelock |

---

## 5 · Sepolia ② 推荐部署顺序

**前置（序 0 · ① 机读）：**

```bash
cd contracts && forge build && forge test && cd ..
bash scripts/dev/sync-abi-from-forge.sh
bash scripts/gates/check-protocol-convergence-pregate.sh
bash scripts/dev/smoke-protocol-quote-parity-local.sh
```

**禁止：** 在已有 `TIMELOCK_ADDRESS` 时整包 `Deploy.s.sol --broadcast`（会 `new GovernanceTimelock` · 与 B-434/B-435 冲突）。

### 序 1 · 治理栈

| 步 | 脚本 | 产出 env 键 |
|----|------|-------------|
| 1.1 | `forge script script/DeployGovernanceStack.s.sol --rpc-url $CHAIN_RPC_URL --broadcast` | `GOVERNANCE_TOKEN_ADDRESS` · `TIMELOCK_ADDRESS` · `GOVERNOR_ADDRESS` |

**环境：** `PRIVATE_KEY`（部署 EOA）· 可选 `GOVERNANCE_TIMELOCK_DELAY_SECONDS=120`（Sepolia 快测）

**广播后立即：** 规划 TTG 分配；**不要将 Timelock.admin 长期留 deployer EOA** — 转入多签（或 Sepolia 测试多签钱包）。

### 序 2 · 资金栈（绑已有 Timelock）

| 步 | 脚本 | 产出 env 键 |
|----|------|-------------|
| 2.1 | `TIMELOCK_ADDRESS=0x… PRIVATE_KEY=<Timelock.admin EOA>` · `DeployFundStackUnderTimelock.s.sol --broadcast` | `ESCROW_FACTORY_ADDRESS` · `FEE_ROUTER_ADDRESS` · `GUIDE_STAKING_ADDRESS` · `STAKING_PROVIDER_ADDRESS` · `TREASURY_ADDRESS` · RegionVault 等 |

**验证：** `cast call $TIMELOCK admin()` == `vm.addr(PRIVATE_KEY)`

**本步已正确：** FeeRouter.owner · RegionVault.owner · 双池 slasher = Timelock ✅

### 序 3 · Factory guardian 收口

| 步 | 动作 |
|----|------|
| 3.1 | `EscrowFactory.transferGuardian(<多签或 Timelock admin 多签>)` |
| 3.2 | 确认 deployer **不再** 能 `setFactoryPaused` |

### 序 4 · Protocol Convergence（TT-9630 / TT-9629）

| 步 | 脚本 | env 键 |
|----|------|--------|
| 4.1 | `STEWARD_TTG_ADDRESS=$GOVERNANCE_TOKEN_ADDRESS` · `DeployRegionStewardStakePool.s.sol --broadcast` | `REGION_STEWARD_STAKE_POOL_ADDRESS` |
| 4.2 | `RegionStewardStakePool.transferOwnership(TIMELOCK)` | — |
| 4.3 | `DeployCountryPoolRedemptionEpochV0.s.sol --broadcast` | `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` |
| 4.4 | `CountryPoolRedemptionEpochV0.transferOwnership(TIMELOCK)` | — |
| 4.5 | （可选）`CountryPoolSubVaultsV0` · `CountryPoolLedgerV0` 部署 + owner→Timelock | 项目内扩展 env（见 §6） |

### 序 5 · Timelock 白名单补登

| 步 | 动作 |
|----|------|
| 5.1 | 若后续部署 Governor 可执行目标： `setAllowedExecutionTarget(regionStewardPool, true)` 等（**仅当**治理 proposal 需调用） |
| 5.2 | 确认 FeeRouter / Treasury / ReserveVault / RegionVault / Governor / TTG 已在 `DeployGovernanceStack` / `DeployFundStack` 中登记 |

### 序 6 · 部署后只读对拍

```bash
bash scripts/dev/smoke-steward-stake-testnet-readonly.sh
CHAIN_RPC_URL=… REGION_STEWARD_STAKE_POOL_ADDRESS=… \
  bash scripts/gates/check-protocol-quote-parity.sh
# API staging 就绪后：
PROTOCOL_QUOTE_HTTP=1 API_BASE=https://<staging-api> \
  python scripts/gates/check-protocol-quote-parity.py --http
```

### 序 7 · 证据归档

| 路径 | 内容 |
|------|------|
| `evidence/GO_phase2_steward_stake_sepolia/` | broadcast 日志 · 地址 · 只读 smoke |
| `registry/protocol-convergence-deployments.v1.yaml` | `testnet_template` 填址 + `chain_id` |

---

## 6 · registry / API / 前端地址同步清单

### 6.1 registry（机读）

**文件：** [`registry/protocol-convergence-deployments.v1.yaml`](../../registry/protocol-convergence-deployments.v1.yaml)

| 字段 | 部署后动作 |
|------|------------|
| `environments.testnet_template.chain_id` | 填 **11155111**（Sepolia）或实际测试网 |
| `region_steward_stake_pool_address` | = `REGION_STEWARD_STAKE_POOL_ADDRESS` |
| `country_pool_redemption_epoch_cn_address` | = `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` |
| `protocol_ssot.content_sha256` | SSOT yaml 变更时同批 `compute-protocol-ssot-hash.py` |

**闸：** `bash scripts/gates/check-protocol-convergence-pregate.sh`

### 6.2 根 `.env`（API 进程 · 勿提交）

| 环境变量 | 来源合约 | `GET /meta` 是否暴露 |
|----------|----------|---------------------|
| `CHAIN_RPC_URL` | — | 间接 |
| `CHAIN_ID` | Sepolia **11155111** | 是 |
| `GOVERNANCE_TOKEN_ADDRESS` | GovernanceVotesToken | **chain.contracts** |
| `GOVERNOR_ADDRESS` | TravelTrustGovernor | **chain.contracts** |
| `TIMELOCK_ADDRESS` | GovernanceTimelock | **chain.contracts** |
| `FEE_ROUTER_ADDRESS` | FeeRouter | **chain.contracts** |
| `TREASURY_ADDRESS` | GovernanceTreasury | **chain.contracts** |
| `GUIDE_STAKING_ADDRESS` | GuideIdentityStakingPool | **chain.contracts** |
| `STAKING_PROVIDER_ADDRESS` | ProviderIdentityStakingPool | **chain.contracts** |
| `ESCROW_FACTORY_ADDRESS` | EscrowFactory | 扩展 / indexer |
| `REGION_STEWARD_STAKE_POOL_ADDRESS` | RegionStewardStakePool | stake-quote/status |
| `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` | CountryPoolRedemptionEpochV0 | redemption/quote |

**B-110 SSOT 闸（可选 ② 开）：** `GOVERNANCE_GOVERNOR_*_CHAIN_SSOT=1` 等 — 见 `.env.example` 注释。

**重启：** 改 `.env` 后 **须重启 `traveltrust-api`**。

### 6.3 前端（Next.js）

| 变量 | 须与链上一致 |
|------|--------------|
| `NEXT_PUBLIC_CHAIN_ID` | `CHAIN_ID` |
| `NEXT_PUBLIC_RPC_URL` | Sepolia RPC |
| `NEXT_PUBLIC_FEE_ROUTER_ADDRESS` | `FEE_ROUTER_ADDRESS` |
| `NEXT_PUBLIC_ESCROW_DEV_TOOLS` | ② staging **勿** 默认 1（仅 dev） |

### 6.4 Escrow 创建时链上参数

| 字段 | ② 规则 |
|------|--------|
| `platformFeeRecipient` | **= `FEE_ROUTER_ADDRESS`**（83/84 · Runbook §7.1） |
| `token` | 测试网 USDC 或 MockERC20 · 与 allowlist 一致 |
| `platformFeeBps` | init 后 **不可改** |

**迁址：** 新 FeeRouter 部署后 — **仅新 Escrow** 写新 recipient；旧 Escrow **不变**。

### 6.5 API 路由对拍（Protocol Convergence）

| 路由 | 链上真源 |
|------|----------|
| `GET /api/v1/steward/stake-quote` | `RegionStewardStakePool.minStakeAmount(j)` + SSOT yaml |
| `GET /api/v1/steward/stake-status` | 池状态 + 用户 stake |
| `GET /api/v1/redemption/quote` | `CountryPoolRedemptionEpochV0.maxNavPctBps` · `windowSeconds` |
| `GET /api/v1/governance/protocol-reference` | `protocol_ssot_version` + hash |

---

## 7 · 部署前阻塞项（Owner 勾选）

| ID | 项 | 清零标准 | ☐ |
|----|-----|----------|---|
| C-01 | G-1/G-2 staging | [TT-PHASE2-STAGING-READINESS-REPORT](./TT-PHASE2-STAGING-READINESS-REPORT.md) §2 机读绿 | ☐ |
| C-02 | 序 0 pregate | `check-protocol-convergence-pregate.sh` exit 0 | ☐ |
| C-03 | Timelock.admin | 多签或 documented Sepolia 测试多签 | ☐ |
| C-04 | Factory.guardian | 非 deployer EOA | ☐ |
| C-05 | P2 pool owner | RegionSteward + CountryPool → Timelock | ☐ |
| C-06 | registry 填址 | `testnet_template` 非 null | ☐ |
| C-07 | API `.env` 七键 | 与 broadcast 日志一致 · `/meta` 对拍 | ☐ |
| C-08 | 只读 smoke | `smoke-steward-stake-testnet-readonly.sh` exit 0 | ☐ |
| C-09 | Escrow Proxy | **确认不引入** — 代码审查 ✅ | ☑ |

---

## 8 · 机读摘要

```text
TT_PHASE2_CONTRACT_DEPLOYMENT_READINESS: PREPARED (static review 2026-06-05)
Architecture: Immutable Core (Escrow per-order deploy) + Governable Shell (Timelock-owned config)
Escrow Proxy: FORBIDDEN for Phase ②
Upgrade pattern: NONE in codebase; evolution = new contract + pointer migration
forge test: 104/104 passed
Sepolia order: DeployGovernanceStack → DeployFundStackUnderTimelock → guardian/owner hardening → Protocol P2 deploy → registry/API sync → readonly smoke
Blockers: Timelock.admin multisig · P2 owner→Timelock · registry null slots · external audit (Phase ③)
Next: clear C-01..C-08 then broadcast Sepolia per §5
```

---

## 9 · 变更记录

| Date | Note |
|------|------|
| 2026-06-05 | 初版：Phase ② 部署前分合约权限表 · Immutable Core 决策 · Sepolia 顺序 · sync 清单 |

---

**End of TT-PHASE2-CONTRACT-DEPLOYMENT-READINESS · Escrow 不可升级 · ② 禁止 Escrow Proxy**
