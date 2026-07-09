# TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY

> **SUPERSEDED · READ-ONLY · LEGACY** — Pre–GovFreeze-V2 Sepolia spine 汇总；表中 Timelock/TTG 等为 **LEGACY** 部署锚。**ACTIVE 读口：** [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 主网**

**文档类型：** Phase ② · 序 1～4 **已部署链上主脊汇总表**（env · registry · 链上 owner 对拍）

**机读闸：** `bash scripts/dev/phase2-sepolia-spine-audit.sh` → `TT_PHASE2_SEPOLIA_SPINE_AUDIT: OK` · **总验收：** [TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION](./TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION.md) → `TT_PHASE2_SEPOLIA_SPINE_FINAL_ATTESTATION: PASS`

**最后更新：** 2026-06-05 · 序 1～4 broadcast 完成后对拍

---

## 0 · 控制面（全序共用）

| 项 | 地址 / 规则 | env | registry | 链上 |
|----|-------------|-----|----------|------|
| **Timelock** | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` | `TIMELOCK_ADDRESS` | `timelock_address` | `admin()` → Safe |
| **Safe (Timelock.admin)** | `0x7c018293396325077bb4D039930dcEe11B7Fb1Cf` | `TIMELOCK_ADMIN_ADDRESS` | — | ≠ deployer |
| **Deployer (gas only)** | `0x104FCb93B5e097F92c93Ee4621C487C6C953D212` | `PRIVATE_KEY` | — | **不得**任合约 owner |
| **Governance Token (TTG)** | `0xaC2E29AC7089e4863C21dAF232cF8bbb025d91ca` | `GOVERNANCE_TOKEN_ADDRESS` | `governance_token_address` | — |

**R-02 纪律：** 序 2～4 可升级合约 **owner / guardian / slasher → Timelock**；**禁止 deployer EOA 残留 owner**。

---

## 1 · 序 1 — 治理栈

| 合约 | 地址 | 控制面 | env | registry |
|------|------|--------|-----|----------|
| GovernanceVotesToken | `0xaC2E29AC7089e4863C21dAF232cF8bbb025d91ca` | — | `GOVERNANCE_TOKEN_ADDRESS` | `governance_token_address` |
| GovernanceTimelock | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` | `admin=Safe` · `governor` 已设 | `TIMELOCK_ADDRESS` | `timelock_address` |
| TravelTrustGovernor | `0xa79c8df5C225825f6d04a497043dB0F1995B55ae` | Timelock 治理 | `GOVERNOR_ADDRESS` | `governor_address` |

**链上验收：** `cast call $TIMELOCK "admin()(address)"` → Safe · `governor()` → Governor · allowlist Governor/Token → `true`

---

## 2 · 序 2 — FundStack

| 合约 | 地址 | owner / 控制面 | env |
|------|------|----------------|-----|
| FeeRouter | `0x81A8009210c5215100564c6E4123F672c4459306` | owner = Timelock | `FEE_ROUTER_ADDRESS` |
| RegionVault | `0x2Ea061d50393c09af2f607Ee9f89679642A3a65B` | owner = Timelock | `REGION_VAULT_ADDRESS` |
| GovernanceTreasury | `0x6a8323fb2394A1e9655F7132F4E4B8222d2898be` | owner = spender = Timelock | `LEGACY_TREASURY_ADDRESS` *(was `TREASURY_ADDRESS` · see [WEB3-TREASURY-ENV-KEYS-OPERATOR-GUIDE](./WEB3-TREASURY-ENV-KEYS-OPERATOR-GUIDE.md))* |
| ReserveVault | `0xbC541FAf26e139eF1f0AC22b52c4b4F85FFF7855` | timelock = Timelock | `RESERVE_VAULT_ADDRESS` |
| EscrowFactory | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` | guardian = Timelock | `ESCROW_FACTORY_ADDRESS` |
| GuideIdentityStakingPool | `0x5bdACF35292bDd681103BBb50865d8D2Fd49653f` | slasher = Timelock | `GUIDE_STAKING_POOL_ADDRESS` |
| ProviderIdentityStakingPool | `0xa90cA23767C1DdcA1Eb8AB292185e9af1106b075` | slasher = Timelock | `PROVIDER_STAKING_POOL_ADDRESS` |
| Registry | `0xc50913e154f850583D0afbE9158a75E0e2167AAb` | — | `REGISTRY_ADDRESS` |
| MockERC20 (fund track) | `0x241948bE49a778490c8A4Ae8D98b7537fE001f63` | — | `FUND_STACK_TOKEN_ADDRESS` |

**registry（序 2 登记项）：** `escrow_factory_address` · `fee_router_address`（其余 FundStack 地址在 env · 终验见 `phase2-sepolia-fundstack-verify-bindings.sh`）

**FeeRouter 四腿：** countryBucket→RegionVault · globalStakers→GuidePool · globalReserve→ReserveVault · globalOps→Treasury

**Timelock allowlist ×4：** FeeRouter · Treasury · ReserveVault · RegionVault

---

## 3 · 序 3 — RegionStewardStakePool

| 合约 | 地址 | 控制面 | env | registry |
|------|------|--------|-----|----------|
| RegionStewardStakePool | `0x16F914f3D50f7Aa02665589e715F94CA3b7Ab47c` | **owner = Timelock** · ≠ deployer | `REGION_STEWARD_STAKE_POOL_ADDRESS` | `region_steward_stake_pool_address` |
| TTG (质押资产) | `0xaC2E29AC7089e4863C21dAF232cF8bbb025d91ca` | = governance token | `STEWARD_TTG_ADDRESS` | (= governance) |

**API：** `GET /api/v1/steward/stake-quote` · `stake-status` ← `REGION_STEWARD_STAKE_POOL_ADDRESS`

**SSOT：** CN steward_stake_bps=400 · minStake=400k TTG · 10 国 bps constructor bootstrap

---

## 4 · 序 4 — CountryPoolRedemptionEpochV0（CN 试点）

| 合约 | 地址 | 控制面 | env | registry |
|------|------|--------|-----|----------|
| CountryPoolRedemptionEpochV0 | `0x712050e4b1517C3f3ab39B32Cabb70CC0E1C0829` | **owner = Timelock** · ≠ deployer | `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` | `country_pool_redemption_epoch_cn_address` |
| MockERC20 (redemption asset) | `0x4825693A7B333B8b2b73ad5632C60A9b7cAa51F9` | ② pilot · **≠** ③ USDC | `REDEMPTION_ASSET_ADDRESS` | — |

**immutable：** jurisdiction=CN · maxNavPctBps=1000 · windowSeconds=1296000 · version=`country_pool_redemption_epoch_v0`

**API：** `GET /api/v1/redemption/quote?jurisdiction=CN` ← `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS`

**broadcast tx：** MockERC20 `0x858783a3…3ba5` · Epoch `0x88bfbd9b…a11e` · 见 [TT-PHASE2-REDEMPTION-EPOCH-SEPOLIA-BROADCAST-CHECKLIST](./TT-PHASE2-REDEMPTION-EPOCH-SEPOLIA-BROADCAST-CHECKLIST.md)

---

## 5 · env ↔ registry ↔ API 对拍矩阵（序 1～4）

| env 键 | registry 键 | API 消费 |
|--------|-------------|----------|
| `GOVERNANCE_TOKEN_ADDRESS` | `governance_token_address` | protocol-reference |
| `GOVERNOR_ADDRESS` | `governor_address` | governance |
| `TIMELOCK_ADDRESS` | `timelock_address` | 控制面 SSOT |
| `ESCROW_FACTORY_ADDRESS` | `escrow_factory_address` | escrow 链路 |
| `FEE_ROUTER_ADDRESS` | `fee_router_address` | fee 路由 |
| `REGION_STEWARD_STAKE_POOL_ADDRESS` | `region_steward_stake_pool_address` | steward stake-quote/status |
| `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` | `country_pool_redemption_epoch_cn_address` | redemption/quote + quote parity |
| `REDEMPTION_ASSET_ADDRESS` | — | epoch `asset()` · ② MockERC20 pilot |

---

## 6 · 机读验收

```bash
export PHASE2_VERIFY_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
bash scripts/dev/phase2-sepolia-spine-final-attestation.sh
# → TT_PHASE2_SEPOLIA_SPINE_FINAL_ATTESTATION: PASS (seq 1–4 · seq 5 gate)
```

**子闸：** `phase2-sepolia-spine-audit.sh` · `check-protocol-quote-parity.sh`

**诚实边界：** ② Sepolia 主脊一致 **≠** ③ Production GO **≠** staging 全矩阵 GO。
