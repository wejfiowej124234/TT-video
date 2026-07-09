# TT-PHASE2-FUND-STACK-SEPOLIA-BROADCAST-CHECKLIST

> **SUPERSEDED · READ-ONLY · LEGACY** — GovFreeze V2 **之前** Sepolia fund-stack broadcast 旁证；下文 `TIMELOCK_ADDRESS` 等为 **LEGACY** cutover 地址。**ACTIVE 读口：** [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 主网**

**文档类型：** Phase ② · `DeployFundStackUnderTimelock` **Sepolia broadcast 人工确认单**（**非**自动广播 · **非** ③ GO）

**互指：** [TT-PHASE2-CHAIN-DEPLOYMENT-GATE](./TT-PHASE2-CHAIN-DEPLOYMENT-GATE.md) · [TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST](./TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md) · [TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md) · [99-链上合约与池子总览](../spec/99-链上合约与池子总览.md)

**最后更新：** 2026-06-05T08:57Z · **签发态：BROADCAST COMPLETE**（序 2 Sepolia 已播 · env/registry 已回填 · 链上终验 16/16 PASS · **≠ ③ GO**）

---

## 0 · 硬纪律

| 项 | 要求 |
|----|------|
| **前置序 1** | **治理栈已播** · `TIMELOCK_ADDRESS` / `GOVERNANCE_TOKEN_ADDRESS` / `GOVERNOR_ADDRESS` 已填 env + registry |
| **② Sepolia · Agent 代跑** | **允许**：Owner **本轮明确授权** + **`TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1`** → **`bash scripts/dev/phase2-sepolia-broadcast-fundstack.sh`** |
| **禁止** | 裸 **`forge script … --broadcast`** · **CI 默认**调用 · **③ 主网** / **非 11155111** chain_id |
| **Safe admin 路径** | **不得**假设 `timelock.admin() == deployer`；Sepolia 须 **Phase A deployer + Phase B Safe owner** |
| **阶段** | 本单仅 **② Sepolia 测试 ETH** · **≠ ③** 主网 Production GO |
| **R-01** | 外部审计 **OPEN** — ② 窄广播可 proceed · **③ 前必须关** |

---

## 1 · 前置闸（须机读 exit 0）

| # | 检查项 | 命令 | Owner ☑ | exit |
|---|--------|------|:-------:|------|
| P-01 | 链部署闸 | `bash scripts/gates/check-phase2-chain-deployment-gate.sh` | ☐ | |
| P-02 | protocol pregate | `bash scripts/gates/check-protocol-convergence-pregate.sh` | ☐ | |
| P-03 | **§4 并集闸** | `bash scripts/gates/check-phase2-chain-broadcast-pregate.sh` | ☑ | **0** |
| P-04 | 序 1 治理栈 | `TIMELOCK_ADDRESS` 链上有 code · `admin()` → Safe | ☑ | **0** |
| P-05 | **FundStack dry-run** | `bash scripts/dev/phase2-sepolia-fundstack-dry-run.sh` | ☑ | **0** |
| P-06 | binding 验收 | 内嵌于 P-05 · 或 `bash scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh --from-log …` | ☑ | **0** |

**机读摘要行（pregate + dry-run 绿后期望）：**

- `TT_CHECK_PHASE2_CHAIN_BROADCAST_PREGATE: OK`
- `TT_PHASE2_SEPOLIA_FUNDSTACK_DRY_RUN: OK (no broadcast)`
- `FUNDSTACK_BINDING_CHECK: OK`
- `safeAdminPath true`

### 1.1 机读记录（2026-06-05T08:42Z · ISSUED）

| # | 命令 | exit | 证据 |
|---|------|------|------|
| P-03 pregate | `check-phase2-chain-broadcast-pregate.sh` | **0** | `TT_CHECK_PHASE2_CHAIN_BROADCAST_PREGATE: OK` |
| P-05 dry-run | `phase2-sepolia-fundstack-dry-run.sh` | **0** | `evidence/GO_phase2_chain_sepolia/fundstack-dry-run/latest/precheck.json` |
| P-06 bindings | `phase2-sepolia-fundstack-verify-bindings.sh --from-log` | **0** | 12× `VERIFY PASS` · owner/Timelock/legs |

**dry-run 模拟地址（nonce=80 · 播后必变 · 勿提前写入 env）：**

| 合约 | 模拟地址 |
|------|----------|
| FeeRouter | `0x81A8009210c5215100564c6E4123F672c4459306` |
| RegionVault | `0x2Ea061d50393c09af2f607Ee9f89679642A3a65B` |
| GovernanceTreasury | `0x6a8323fb2394A1e9655F7132F4E4B8222d2898be` |
| ReserveVault (fee track) | `0xbC541FAf26e139eF1f0AC22b52c4b4F85FFF7855` |
| EscrowFactory | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` |
| GuideIdentityStakingPool | `0x5bdACF35292bDd681103BBb50865d8D2Fd49653f` |

**gas 估算：** ~**0.653 ETH**（deployer Phase A）+ Safe owner Phase B gas · deployer 余额须 ≥ **0.70 ETH**

### 1.2 广播记录（2026-06-05T08:48–08:53Z · BROADCAST COMPLETE）

| 项 | 值 |
|----|-----|
| forge 结论 | `ONCHAIN EXECUTION COMPLETE & SUCCESSFUL` |
| `FUNDSTACK_BINDING_CHECK` | **OK**（broadcast log） |
| Safe Phase B | `Phase B safeOwner 0x6Bf7C7C8566747EefeE1719b06369dac1CBd5f8b` |
| 证据 | `evidence/GO_phase2_chain_sepolia/fundstack-broadcast/latest/broadcast-20260605T084821Z.json` |
| 链上终验 | `phase2-sepolia-fundstack-verify-bindings.sh` · **16/16 PASS** · RPC `https://1rpc.io/sepolia` |

**已播地址（Sepolia · ②）：**

| 合约 | 地址 |
|------|------|
| MockERC20 / `FUND_STACK_TOKEN_ADDRESS` | `0x241948bE49a778490c8A4Ae8D98b7537fE001f63` |
| EscrowFactory | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` |
| FeeRouter | `0x81A8009210c5215100564c6E4123F672c4459306` |
| RegionVault | `0x2Ea061d50393c09af2f607Ee9f89679642A3a65B` |
| GovernanceTreasury | `0x6a8323fb2394A1e9655F7132F4E4B8222d2898be` |
| ReserveVault | `0xbC541FAf26e139eF1f0AC22b52c4b4F85FFF7855` |
| GuideIdentityStakingPool | `0x5bdACF35292bDd681103BBb50865d8D2Fd49653f` |
| ProviderIdentityStakingPool | `0xa90cA23767C1DdcA1Eb8AB292185e9af1106b075` |
| Registry | `0xc50913e154f850583D0afbE9158a75E0e2167AAb` |

**Phase A 首 tx（MockERC20 CREATE）：** `0xd7b8692e40f126981488b5f1e01bd1b5c44f50385db612b7f25dec8e0735c139`  
**Phase B allowlist（Safe exec ×4）：** `0x380e7eda…4426` · `0x6d17a05c…157` · `0xd2302669…2cb` · `0x08d21896…667b`

---

## 2 · 公开链上 / 控制面（填址 · 不含私钥）

| 项 | 值 / 来源 | Owner 核对 ☑ |
|----|-----------|:------------:|
| `chain_id` | **11155111** (Sepolia) | ☑ |
| deployer EOA | `0x104FCb93B5e097F92c93Ee4621C487C6C953D212` | ☑ |
| deployer Sepolia 余额 | ≥ **0.70 ETH**（播前 ~4.83 ETH） | ☑ |
| `TIMELOCK_ADDRESS` | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` | ☑ |
| `TIMELOCK_ADMIN_ADDRESS` (Safe) | `0x7c018293396325077bb4D039930dcEe11B7Fb1Cf` | ☑ |
| Safe admin ≠ deployer | **是** | ☑ |
| Safe owner 已备 gas | `0x6Bf7C7C8566747EefeE1719b06369dac1CBd5f8b` · Phase B 已执行 | ☑ |
| `CHAIN_RPC_URL` | broadcast `https://sepolia.drpc.org` · verify 可用 `https://1rpc.io/sepolia` | ☑ |

---

## 3 · 部署内容（序 2 · FundStack）

### 3.1 Phase A · deployer `PRIVATE_KEY`

| 合约 | 控制面绑定 |
|------|------------|
| `MockERC20`（或 `FUND_STACK_TOKEN_ADDRESS`） | 质押 token |
| `EscrowFactory` | `guardian = Timelock` |
| `GuideIdentityStakingPool` | `slasher = Timelock` |
| `ProviderIdentityStakingPool` | `slasher = Timelock` |
| `Registry` | — |
| `RegionVault` | `owner = Timelock` |
| `GovernanceTreasury` | `owner = spender = Timelock` |
| `ReserveVault` | `timelock = Timelock` |
| `FeeRouter` | `owner = Timelock` |
| `InvestorDistributionClaim` | `owner = resolveChainOwner` |
| `RegionDistributionClaim` | `owner = resolveChainOwner` |

### 3.2 FeeRouter 四腿（GlobalPool 路由 · 无独立 GlobalPool 合约）

| 腿 | 指向 | 验收 |
|----|------|------|
| `countryBucket` | `RegionVault` | `cast call $FEE_ROUTER "countryBucket()(address)"` |
| `globalStakers` | `GuideIdentityStakingPool` | `globalStakers()` |
| `globalReserve` | `ReserveVault` | `globalReserve()` |
| `globalOps` | `GovernanceTreasury` | `globalOps()` |

### 3.3 Phase B · Safe owner `TIMELOCK_SAFE_OWNER_KEYS`

| 动作 | 目标 |
|------|------|
| `setAllowedExecutionTarget` ×4 | FeeRouter · Treasury · ReserveVault · RegionVault |

**Phase B 单独重跑（Phase A 已播、allowlist 失败时）：**

```bash
# 填 FEE_ROUTER_ADDRESS · TREASURY_ADDRESS · RESERVE_VAULT_ADDRESS · REGION_VAULT_ADDRESS
forge script script/ConfigureFundStackTimelockViaSafe.s.sol:ConfigureFundStackTimelockViaSafe \
  --rpc-url "$CHAIN_RPC_URL" --broadcast --slow -vv
```

**真源：** `contracts/script/DeployFundStackUnderTimelock.s.sol` · `Phase2SafeExec.configureFundStackTimelockViaSafe`

---

## 4 · broadcast 命令（Owner 亲手 · 或 Agent 代跑）

### 4.1 推荐 · Agent / Owner 统一入口（② Sepolia only）

```bash
export CHAIN_RPC_URL=https://sepolia.drpc.org
export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1

bash scripts/dev/phase2-sepolia-broadcast-fundstack.sh
# → TT_PHASE2_SEPOLIA_FUNDSTACK_BROADCAST: OK
# → evidence/GO_phase2_chain_sepolia/fundstack-broadcast/latest/broadcast-*.json
```

脚本内硬闸：**chain_id=11155111** · pregate exit 0 · FundStack dry-run exit 0 · deployer ≥ **0.70 ETH** · Safe 有 code · `TIMELOCK_ADDRESS` 已设。

### 4.2 等价 · Owner 亲手（不推荐裸跑 forge）

```bash
set -a && source scripts/dev/.env.phase2-chain-deploy.local && set +a
bash scripts/gates/check-phase2-chain-broadcast-pregate.sh
bash scripts/dev/phase2-sepolia-fundstack-dry-run.sh
cd contracts
forge script script/DeployFundStackUnderTimelock.s.sol:DeployFundStackUnderTimelock \
  --rpc-url "$CHAIN_RPC_URL" --broadcast --slow -vv
```

---

## 5 · 广播后 15 分钟内（Owner 动作）

| # | 动作 | 命令 / 文件 | ☑ |
|---|------|-------------|:-:|
| B-01 | 记录地址 | `broadcast/DeployFundStackUnderTimelock.s.sol/11155111/run-latest.json` | ☑ |
| B-02 | 写入 env | `.env.phase2-chain-deploy.local` + 根 `.env` Sepolia 段（**未改** TT ANVIL LOCAL · **未触** ③） | ☑ |
| B-03 | registry | `protocol-convergence-deployments.v1.yaml` · `escrow_factory_address` · `fee_router_address` | ☑ |
| B-04 | owner/Timelock | `phase2-sepolia-fundstack-verify-bindings.sh` · **16/16 PASS** | ☑ |
| B-05 | allowlist ×4 | FeeRouter · Treasury · ReserveVault · RegionVault → `true` | ☑ |
| B-06 | FeeRouter 四腿 | countryBucket / globalStakers / globalReserve / globalOps → 四目标 | ☑ |
| B-07 | G-09/G-10 | [TT-PHASE2-CHAIN-DEPLOYMENT-GATE](./TT-PHASE2-CHAIN-DEPLOYMENT-GATE.md) §4 broadcast 后表 | ☐ |

**链上验收期望（`phase2-sepolia-fundstack-verify-bindings.sh`）：**

- FeeRouter / RegionVault / Treasury / ReserveVault **owner 或 timelock** → `TIMELOCK_ADDRESS`
- Treasury **spender** → `TIMELOCK_ADDRESS`
- FeeRouter **四腿** → RegionVault / GuidePool / ReserveVault / Treasury
- Timelock **allowlist** → 四目标均为 `true`

---

## 6 · Owner 签字（人工）

| 字段 | 填写 |
|------|------|
| **日期 (UTC)** | 2026-06-05 |
| **Owner** | Sebastian Ward（塞巴斯蒂安·沃德） |
| **pregate exit 0 证据** | `TT_CHECK_PHASE2_CHAIN_BROADCAST_PREGATE: OK` |
| **dry-run exit 0 证据** | `evidence/GO_phase2_chain_sepolia/fundstack-dry-run/latest/precheck.json` |
| **broadcast 证据** | `evidence/GO_phase2_chain_sepolia/fundstack-broadcast/latest/broadcast-20260605T084821Z.json` |
| **链上终验** | `phase2-sepolia-fundstack-verify-bindings.sh` · 16/16 PASS · `https://1rpc.io/sepolia` |
| **broadcast tx 哈希** | Phase A 首 tx `0xd7b8692e…` · Phase B ×4 见 §1.2 |
| **我确认未跳阶** | ☑ ① 绿 · ② 序 2 FundStack 已播 · **未**宣称 ③ GO · **未**改主网/Anvil 活跃块 |

**签字：** _________________________

---

## 7 · 一句话结论

**序 2 FundStack 已于 Sepolia broadcast 完成（Safe 双阶段）· env/registry 已回填 · 链上 binding 16/16 PASS。下一序：`DeployRegionStewardStakePool`（序 3）。③ 主网仍 Owner-only · R-01 审计 OPEN。**

**诚实边界：** ② Sepolia 测试 ETH 已播 **≠** ② staging 全矩阵 GO **≠** ③ Production GO。
