# TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION


> **STATUS (V9 Documentation Truth Convergence · phase-2):** **SUPERSEDED as Official ACTIVE V9 path** · **DO_NOT_USE_AS_ACTIVE_TRUTH** · **HISTORICAL**.  
> Sole living upstream: [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Public-sale USDC→P4Cap · globalStakers 35.75% · R2_FINAL/Remint · Safe/old Timelock as V9 Official admin = **LEGACY / SUPERSEDED**. Evidence retained.

> **SUPERSEDED · READ-ONLY · LEGACY** — Pre–GovFreeze-V2 spine attestation；`TIMELOCK_ADDRESS` 等为 **LEGACY**。**ACTIVE 读口：** [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 主网**

**文档类型：** Phase ② · 序 1～4 **主脊总验收 attestation**（cast · env/registry · API SSOT · quote parity）

**机读入口：** `bash scripts/dev/phase2-sepolia-spine-final-attestation.sh` → `TT_PHASE2_SEPOLIA_SPINE_FINAL_ATTESTATION: PASS`

**最后更新：** 2026-06-05T09:54Z · **签发态：PASS**（序 5 `DeployP51CountryLedger` 前置闸已清 · **≠ ③ GO**）

**互指：** [TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY](./TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md) · 各序 broadcast checklist · [protocol-convergence-deployments.v1.yaml](../../registry/protocol-convergence-deployments.v1.yaml)

---

## 0 · 硬纪律

| 项 | 结论 |
|----|------|
| **阶段** | 本 attestation 仅 **② Sepolia（chain_id 11155111）** |
| **R-02** | deployer EOA **≠** 任合约 owner / Timelock.admin |
| **控制面** | Timelock.owner 角色由 Safe 经 `admin()` 持有；序 2～4 合约 owner/guardian/slasher → Timelock |
| **序 5 闸** | **PASS 后**方可启动 `DeployP51CountryLedger` dry-run / broadcast |
| **禁止** | 用本单冒充 **③ 主网 GO** · staging 全矩阵 GO · R-01 audit 仍 OPEN |

---

## 1 · 总表

| 项 | 结论 |
|----|------|
| **主脊总验收** | **PASS**（2026-06-05T09:54Z） |
| **序 1 治理** | PASS |
| **序 2 FundStack + FeeRouter 四腿** | PASS |
| **序 3 主理人质押池** | PASS |
| **序 4 CN 赎回窗** | PASS |
| **env ↔ registry** | 7 对 PASS |
| **quote parity（cast + SSOT）** | PASS |
| **Governor/Token Timelock allowlist** | PASS |
| **HTTP 实时 quote** | WARN（本地 API 版本漂移 · 静态 route/registry 对拍 PASS） |

**机读证据：** `evidence/GO_phase2_chain_sepolia/spine-final-attestation/latest/final-attestation-20260605T095323Z.json`

---

## 2 · 控制面（cast 终验）

| 检查项 | 期望 | 结果 |
|--------|------|------|
| `Timelock.admin()` | Safe `0x7c018293396325077bb4D039930dcEe11B7Fb1Cf` | PASS |
| `Timelock.governor()` | Governor `0xa79c8df5C225825f6d04a497043dB0F1995B55ae` | PASS |
| `Timelock.admin` ≠ deployer | deployer `0x104FCb93…D212` | PASS |
| `Governor.timelock()` | Timelock `0x0359d4fB…Ee8f` | PASS |
| `allowedExecutionTarget(Governor)` | true | PASS |
| `allowedExecutionTarget(GovernanceToken)` | true | PASS |

**RPC：** `https://ethereum-sepolia-rpc.publicnode.com`

---

## 3 · env ↔ registry 对拍（7 对）

| env 键 | registry 键 | 地址 |
|--------|-------------|------|
| `GOVERNANCE_TOKEN_ADDRESS` | `governance_token_address` | `0xaC2E29AC7089e4863C21dAF232cF8bbb025d91ca` |
| `GOVERNOR_ADDRESS` | `governor_address` | `0xa79c8df5C225825f6d04a497043dB0F1995B55ae` |
| `TIMELOCK_ADDRESS` | `timelock_address` | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` |
| `ESCROW_FACTORY_ADDRESS` | `escrow_factory_address` | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` |
| `FEE_ROUTER_ADDRESS` | `fee_router_address` | `0x81A8009210c5215100564c6E4123F672c4459306` |
| `REGION_STEWARD_STAKE_POOL_ADDRESS` | `region_steward_stake_pool_address` | `0x16F914f3D50f7Aa02665589e715F94CA3b7Ab47c` |
| `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` | `country_pool_redemption_epoch_cn_address` | `0x712050e4b1517C3f3ab39B32Cabb70CC0E1C0829` |

**env-only（② pilot）：** `REDEMPTION_ASSET_ADDRESS` = `0x4825693A7B333B8b2b73ad5632C60A9b7cAa51F9`（MockERC20 · **≠** ③ USDC）

---

## 4 · 序 2 · FundStack + FeeRouter 四腿

| 检查 | 结果 |
|------|------|
| FeeRouter / RegionVault / Treasury owner → Timelock | PASS |
| Treasury.spender → Timelock | PASS |
| ReserveVault.timelock → Timelock | PASS |
| EscrowFactory.guardian → Timelock | PASS |
| GuidePool / ProviderPool slasher → Timelock | PASS |
| **FeeRouter.countryBucket** → RegionVault | PASS |
| **FeeRouter.globalStakers** → GuidePool | PASS |
| **FeeRouter.globalReserve** → ReserveVault | PASS |
| **FeeRouter.globalOps** → Treasury | PASS |
| Timelock allowlist ×4（FR · Treasury · Reserve · RegionVault） | PASS |

**脚本：** `phase2-sepolia-fundstack-verify-bindings.sh` · **16/16 PASS**

---

## 5 · 序 3 · RegionStewardStakePool

| 检查 | 结果 |
|------|------|
| `pool.owner()` → Timelock · ≠ deployer | PASS |
| `pool.ttg()` → GovernanceToken | PASS |
| `stewardStakeBps(CN)` = 400 | PASS |
| `minStakeAmount(CN)` = 400000000000000000000000 | PASS |
| registry ↔ env ↔ API route 声明 | PASS |

**API（静态 SSOT）：** `GET /api/v1/steward/stake-quote` · `stake-status`

**脚本：** `phase2-sepolia-steward-pool-verify-bindings.sh` · **10/10 PASS**

---

## 6 · 序 4 · CountryPoolRedemptionEpochV0（CN）

| 检查 | 结果 |
|------|------|
| `epoch.owner()` → Timelock · ≠ deployer | PASS |
| `maxNavPctBps()` = 1000 | PASS |
| `windowSeconds()` = 1296000 | PASS |
| `jurisdiction()` = CN (0x434e) | PASS |
| `version()` = `country_pool_redemption_epoch_v0` | PASS |
| `asset()` → REDEMPTION_ASSET env | PASS |
| registry ↔ env ↔ API redemption/quote | PASS |

**API（静态 SSOT）：** `GET /api/v1/redemption/quote?jurisdiction=CN`

**脚本：** `phase2-sepolia-redemption-epoch-verify-bindings.sh` · **10/10 PASS**

---

## 7 · quote parity（P3 · SSOT = 链 = API 镜像）

| 检查 | 结果 |
|------|------|
| protocol-ssot yaml sha256 ↔ registry | PASS |
| yaml ↔ Rust `protocol_ssot_json` jurisdictions | PASS |
| yaml ↔ frontend `protocolSsot.v1.ts` | PASS |
| stake-quote math CN+FR = 850 bps / 850000 units | PASS |
| on-chain `minStakeAmount(CN)` ↔ SSOT | PASS |
| on-chain epoch immutables ↔ lock_tiers | PASS |
| ABI RegionStewardStakePool · CountryPoolRedemptionEpochV0 | PASS |

**脚本：** `bash scripts/gates/check-protocol-quote-parity.sh` · exit **0**

### 7.1 HTTP 实时 API（可选）

| 检查 | 结果 |
|------|------|
| `GET /api/v1/governance/protocol-reference` 版本 | **WARN** — 本地运行中 API 与 registry SSOT 版本不一致 |
| stake-quote / redemption HTTP | 未验（因 protocol-reference 前置失败） |

**说明：** 链上 cast + 源码 route/registry 对拍已全部 PASS；HTTP WARN 不影响序 5 闸。重启 API 并 bump 运行镜像后可重跑 `PROTOCOL_QUOTE_HTTP=1 API_BASE=… check-protocol-quote-parity.sh --http`。

---

## 8 · 机读复验命令

```bash
export PHASE2_VERIFY_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
bash scripts/dev/phase2-sepolia-spine-final-attestation.sh
# → TT_PHASE2_SEPOLIA_SPINE_FINAL_ATTESTATION: PASS
```

**子闸（可单独跑）：**

```bash
bash scripts/dev/phase2-sepolia-spine-audit.sh          # seq 1–4 env/registry/cast
bash scripts/gates/check-protocol-quote-parity.sh       # SSOT + on-chain immutables
```

---

## 9 · 序 5 前置闸（DeployP51CountryLedger）

| # | 条件 | 状态 |
|---|------|------|
| S5-00 | 序 1～4 主脊总验收 **PASS** | **✅** |
| S5-01 | `TIMELOCK_ADDRESS` · FundStack · Steward · Redemption env 已填 | **✅** |
| S5-02 | R-02 owner 链上 = Timelock | **✅** |
| S5-03 | 序 5 dry-run + checklist **ISSUED** | **✅**（2026-06-05 · [TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST](./TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST.md)） |
| S5-04 | Owner `TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1` | **待 Owner 授权** |

**下一动作：** 编写/签发 `TT-PHASE2-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST.md` → `DeployP51CountryLedger` dry-run → Owner 授权 broadcast。

---

## 10 · 一句话结论

**Phase ② Sepolia 序 1～4 主脊总验收 PASS** — 治理 · FundStack 四腿 · 主理人质押 · CN 赎回窗 · env/registry/API SSOT · quote parity 均已 cast 对拍。**可进入序 5 `DeployP51CountryLedger` 预部署审查。**

**诚实边界：** ② Sepolia 测试 ETH + MockERC20 **≠** ③ 主网 Production GO · HTTP 实时 API 有版本 WARN · R-01 全站 audit **OPEN**。
