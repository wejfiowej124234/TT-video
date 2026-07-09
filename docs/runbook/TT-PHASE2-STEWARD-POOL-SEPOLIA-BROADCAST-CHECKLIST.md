# TT-PHASE2-STEWARD-POOL-SEPOLIA-BROADCAST-CHECKLIST

> **SUPERSEDED · READ-ONLY · LEGACY** — Pre–GovFreeze-V2 steward pool broadcast 旁证；`TIMELOCK_ADDRESS` 为 **LEGACY** cutover 锚。**ACTIVE 读口：** [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 主网**

**文档类型：** Phase ② · `DeployRegionStewardStakePool` **Sepolia broadcast 人工确认单**（**非**自动广播 · **非** ③ GO）

**互指：** [TT-PHASE2-CHAIN-DEPLOYMENT-GATE](./TT-PHASE2-CHAIN-DEPLOYMENT-GATE.md) · [TT-PHASE2-FUND-STACK-SEPOLIA-BROADCAST-CHECKLIST](./TT-PHASE2-FUND-STACK-SEPOLIA-BROADCAST-CHECKLIST.md) · [protocol-ssot.v1.yaml](../spec/governance-token/protocol-ssot.v1.yaml) · [99-链上合约与池子总览](../spec/99-链上合约与池子总览.md)

**最后更新：** 2026-06-05T09:15Z · **签发态：BROADCAST COMPLETE**（序 3 Sepolia 已播 · env/registry 已回填 · 链上终验 PASS · **≠ ③ GO**）

---

## 0 · 硬纪律

| 项 | 要求 |
|----|------|
| **前置序 1–2** | 治理栈 + FundStack 已播 · `TIMELOCK_ADDRESS` · `GOVERNANCE_TOKEN_ADDRESS` 已填 |
| **R-02 · owner** | **`pool.owner` = `TIMELOCK_ADDRESS`（Timelock 控制面）· 不得 = deployer EOA** |
| **TTG** | Sepolia **须** `STEWARD_TTG_ADDRESS` = `GOVERNANCE_TOKEN_ADDRESS`（**禁止** MockERC20） |
| **② Agent 代跑** | Owner 授权 + **`TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1`** → **`phase2-sepolia-broadcast-steward-pool.sh`** |
| **禁止** | 裸 `forge script … --broadcast` · CI 默认 · **③ 主网** / 非 **11155111** |
| **阶段** | 本单仅 **② Sepolia 测试 ETH** · **≠ ③** Production GO |

---

## 1 · 前置闸（须机读 exit 0）

| # | 检查项 | 命令 | Owner ☑ | exit |
|---|--------|------|:-------:|------|
| P-01 | 链部署闸 | `bash scripts/gates/check-phase2-chain-deployment-gate.sh` | ☐ | |
| P-02 | protocol pregate | `bash scripts/gates/check-protocol-convergence-pregate.sh` | ☐ | |
| P-03 | **§4 并集闸** | `bash scripts/gates/check-phase2-chain-broadcast-pregate.sh` | ☑ | **0** |
| P-04 | 序 1–2 已播 | `TIMELOCK_ADDRESS` · FundStack 地址 env/registry 已填 | ☑ | **0** |
| P-05 | **Steward dry-run** | `bash scripts/dev/phase2-sepolia-steward-pool-dry-run.sh` | ☑ | **0** |
| P-06 | binding + 对拍 | 内嵌 P-05 · `phase2-sepolia-steward-pool-verify-bindings.sh --from-log` | ☑ | **0** |
| P-07 | quote parity | 内嵌 P-05 · `check-protocol-quote-parity.sh` | ☑ | **0** |

**机读摘要行：**

- `TT_CHECK_PHASE2_CHAIN_BROADCAST_PREGATE: OK`
- `TT_PHASE2_SEPOLIA_STEWARD_POOL_DRY_RUN: OK (no broadcast)`
- `STEWARD_BINDING_CHECK: OK`
- `pool_owner_is_timelock true` · `pool_owner_not_deployer true`

### 1.1 机读记录（2026-06-05T09:07Z · ISSUED）

| # | 命令 | exit | 证据 |
|---|------|------|------|
| P-03 pregate | `check-phase2-chain-broadcast-pregate.sh` | **0** | `TT_CHECK_PHASE2_CHAIN_BROADCAST_PREGATE: OK` |
| P-05 dry-run | `phase2-sepolia-steward-pool-dry-run.sh` | **0** | `evidence/GO_phase2_chain_sepolia/steward-pool-dry-run/latest/precheck.json` |
| P-06 bindings | verify `--from-log` | **0** | owner/Timelock/TTG/CN bps/minStake + registry↔API |
| P-07 quote | `check-protocol-quote-parity.sh` | **0** | SSOT yaml ↔ Rust ↔ TS |

**dry-run 模拟（勿提前写入 env）：**

| 项 | 值 |
|----|-----|
| `REGION_STEWARD_STAKE_POOL`（模拟） | 见 precheck `simulated_addresses` |
| `pool.owner` | `TIMELOCK_ADDRESS` `0x0359d4fB…Ee8f` |
| `STEWARD_TTG` | `GOVERNANCE_TOKEN_ADDRESS` `0xaC2E29A…91ca` |
| `min_stake_CN` | `400000000000000000000000`（400k TTG · 400 bps） |
| gas 估算 | ~**0.124 ETH** · deployer ≥ **0.15 ETH** buffer |

**代码修复（序 3 审查）：** 辖区 bps 改由 **`RegionStewardStakePool` constructor 内 `_bootstrapProtocolSsotJurisdictions()`** 写入（deployer 无法在 `owner=Timelock` 时 `configureJurisdiction`）。

### 1.2 广播记录（2026-06-05T09:09–09:11Z · BROADCAST COMPLETE）

| 项 | 值 |
|----|-----|
| forge 结论 | `ONCHAIN EXECUTION COMPLETE & SUCCESSFUL` |
| `STEWARD_BINDING_CHECK` | **OK** |
| `REGION_STEWARD_STAKE_POOL` | `0x16F914f3D50f7Aa02665589e715F94CA3b7Ab47c` |
| broadcast tx | `DeployRegionStewardStakePool` CREATE（见 `run-latest.json`） |
| 链上终验 | `phase2-sepolia-steward-pool-verify-bindings.sh` · **9/9 PASS** · RPC `https://1rpc.io/sepolia` |
| 证据 | `evidence/GO_phase2_chain_sepolia/steward-pool-broadcast/latest/broadcast-20260605T090955Z.json` |

---

## 2 · 控制面 / 对拍（公开 · 无密钥）

| 项 | 值 / 规则 | ☑ |
|----|-----------|:-:|
| `chain_id` | **11155111** | ☐ |
| deployer EOA | `0x104FCb93B5e097F92c93Ee4621C487C6C953D212` | ☐ |
| deployer 余额 | ≥ **0.15 ETH** | ☐ |
| `TIMELOCK_ADDRESS` | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` | ☐ |
| `pool.owner` **≠** deployer | **必须** | ☐ |
| `pool.owner` **=** Timelock | **必须** | ☐ |
| registry `env_to_registry` | `REGION_STEWARD_STAKE_POOL_ADDRESS` → `region_steward_stake_pool_address` | ☐ |
| API 消费 | `crates/api/src/chain/steward_stake_pool.rs` · `/api/v1/steward/stake-quote` | ☐ |

---

## 3 · 部署内容（序 3 · 单合约 · 无 Safe Phase B）

| 合约 | 控制面 |
|------|--------|
| `RegionStewardStakePool` | `owner = resolveChainOwner(deployer)` → **`TIMELOCK_ADDRESS`** |
| TTG | `GOVERNANCE_TOKEN_ADDRESS`（`STEWARD_TTG_ADDRESS`） |
| 辖区 bps | constructor 内 10 国 · 与 **protocol-ssot.v1.yaml** 一致 |
| 释放参数 | 90d delay · 365d vest（默认 env） |

**无 Timelock allowlist 步骤**（与 FundStack 序 2 不同）。

---

## 4 · broadcast 命令（Owner / Agent · ② only）

```bash
export CHAIN_RPC_URL=https://sepolia.drpc.org
export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1

bash scripts/dev/phase2-sepolia-broadcast-steward-pool.sh
# → TT_PHASE2_SEPOLIA_STEWARD_POOL_BROADCAST: OK
```

脚本内硬闸：pregate · dry-run · `chain_id=11155111` · `TIMELOCK ≠ deployer` · TTG = governance token · 播后 cast 终验（默认 verify RPC `https://1rpc.io/sepolia`）。

---

## 5 · 广播后 15 分钟内

| # | 动作 | ☑ |
|---|------|:-:|
| B-01 | 记录 pool 地址 · `run-latest.json` | ☑ |
| B-02 | `.env.phase2-chain-deploy.local` + 根 `.env` Sepolia 段（**未改** TT ANVIL · **未触** ③） | ☑ |
| B-03 | `registry` · `region_steward_stake_pool_address` | ☑ |
| B-04 | `phase2-sepolia-steward-pool-verify-bindings.sh` · 9/9 PASS | ☑ |
| B-05 | owner → Timelock · TTG → governance token · CN bps 400 | ☑ |
| B-06 | API smoke（可选） | ☐ |

---

## 6 · Owner 签字

| 字段 | 填写 |
|------|------|
| **日期 (UTC)** | |
| **Owner** | Sebastian Ward（塞巴斯蒂安·沃德） |
| **dry-run 证据** | `evidence/GO_phase2_chain_sepolia/steward-pool-dry-run/latest/precheck.json` |
| **我确认未跳阶** | ☐ ② pregate+dry-run 绿 · **未**宣称 ③ GO |

**签字：** _________________________

---

## 7 · 一句话结论

**序 3 RegionStewardStakePool 已于 Sepolia broadcast 完成 · owner=Timelock · env/registry 已回填 · 链上终验 PASS。下一序：`DeployCountryPoolRedemptionEpochV0`（序 4）。③ 主网仍 Owner-only。**

**诚实边界：** ② Sepolia 测试 ETH 已播 **≠** staging 全矩阵 GO **≠** ③ Production GO。
