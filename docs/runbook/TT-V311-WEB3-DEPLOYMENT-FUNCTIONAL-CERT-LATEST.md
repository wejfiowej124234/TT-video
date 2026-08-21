# TT · V311 Web3 Deployment & Functional Certification


> **STATUS (V9 Documentation Truth Convergence · phase-2):** **SUPERSEDED as Official ACTIVE V9 path** · **DO_NOT_USE_AS_ACTIVE_TRUTH** · **HISTORICAL**.  
> Sole living upstream: [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Public-sale USDC→P4Cap · globalStakers 35.75% · R2_FINAL/Remint · Safe/old Timelock as V9 Official admin = **LEGACY / SUPERSEDED**. Evidence retained.

**Machine:** `TT_V311_WEB3_FULL_FUNCTION_CERT`  
**Registry:** [`registry/psg-v311-web3-full-function-cert.v1.yaml`](../../registry/psg-v311-web3-full-function-cert.v1.yaml)  
**Inventory:** [`registry/v311-web3-deployment-inventory.v1.json`](../../registry/v311-web3-deployment-inventory.v1.json)  
**Sole baseline:** **V3.1.1 / `v311_sepolia_clean_baseline`**  
**Status:** 以 Registry 为准 · 当前 **FAIL**（Tier A 只读已绿 · Tier C / 活 Indexer 仍 **OWNER_REQUIRED**）  

**≠** `TT_PSG_SEPOLIA_FREEZE` · **≠** Production GO · **≠** Owner 密钥 / Safe 多签 / 最终 Sign-off（脚本不可替代）

---

## 0 · 已部署组件与地址清单（中文总表）

**机读真源：** [`registry/v311-web3-deployment-inventory.v1.json`](../../registry/v311-web3-deployment-inventory.v1.json)  
**ACTIVE 冻结矩阵：** [`registry/v311-sepolia-address-matrix-freeze.v1.json`](../../registry/v311-sepolia-address-matrix-freeze.v1.json)  
**链：** Sepolia `11155111` · **部署戳：** `20260718T092622Z`

### 0.1 · ACTIVE 治理栈（V3.1.1 Clean Baseline）

| ID | 合约名 | 升级模式 | Proxy / 地址 | Implementation | Admin / 升级权限 |
|----|--------|----------|--------------|----------------|------------------|
| TTG | GovernanceVotesToken | **IMMUTABLE** | `0x5D2eDABF062E1d8AccDA2bd35c0d9B26CFCd5Ec0` | 同左 | 无升级 |
| TIMELOCK | GovernanceTimelock | **IMMUTABLE** | `0x462402082B395F218FFB3634ec0611e39BdD504C` | 同左 | Admin = Safe |
| SAFE | Gnosis Safe | 外部多签 | `0x7c018293396325077bb4D039930dcEe11B7Fb1Cf` | — | 控制 Timelock admin |
| GOVERNOR | TravelTrustGovernor | **TimelockUpgradeableProxy**（非 UUPS） | Proxy `0x1ce4fbE80557bC2111A814f60A2334de41032116` | `0xa81c862757810324a03ba8e1c1d7c5e1e9e394cf` | **Safe→Timelock→upgradeTo** |
| P4CAP（=USDC sink） | GovernanceTreasuryP4Cap | 同上 | Proxy `0x6A10df057c637A295b48D91A8101d22542425905` | `0xbae315b52bade0a3042f010bd4715e36d01089db` | **Safe→Timelock→upgradeTo** |
| PRIMARY_MARKET | TtgPrimaryMarketV1 | 同上 | Proxy `0x98a9BCfe967BA27d5448A1569d1622A7938046c2` | `0xd9953adf8ee009919b596ffc1d081cdba47d0973` | **Safe→Timelock→upgradeTo** |
| SEAT | TtgSeatConcentrationRegistry | 同上 | Proxy `0x7574E868dA767690FD91b5F8940dA7ad3B1efa66` | `0x80ffcff9a560f5aeaf0bfa842826a88341007cbf` | **Safe→Timelock→upgradeTo** |
| STAKE | RegionStewardStakePool | 同上 | Proxy `0xc229D58987e0755467eB4EE53572F7139bAf7281` | `0xa45d3c1bf55d8c6da7f099a222615b2af4ce491b` | **Safe→Timelock→upgradeTo** |

**硬约束：** `usdc_sink` = P4Cap（上表同一地址）· **≠** Safe · caps `800k / 1.2M / 3M` TTG · Timelock delay `172800s`。

### 0.2 · COMPOSITE 支付 / Fund-stack（入清单 · 非 ACTIVE 治理权威）

| ID | 合约 | 地址 | 升级模式 |
|----|------|------|----------|
| ESCROW_FACTORY | EscrowFactory | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` | IMMUTABLE |
| ESCROW_INSTANCE | Escrow | 由 Factory 创建（每单实例） | per-instance |
| FEE_ROUTER | FeeRouter | `0x81A8009210c5215100564c6E4123F672c4459306` | IMMUTABLE |
| REGION_VAULT | RegionVault | `0x2Ea061d50393c09af2f607Ee9f89679642A3a65B` | IMMUTABLE |
| RESERVE_VAULT | ReserveVault | `0xbC541FAf26e139eF1f0AC22b52c4b4F85FFF7855` | IMMUTABLE |
| LEGACY_TREASURY | GovernanceTreasury | `0x6a8323fb2394A1e9655F7132F4E4B8222d2898be` | IMMUTABLE（FeeRouter 腿 · 非 PM sink） |
| REGISTRY_ONCHAIN | Registry | `0xc50913e154f850583D0afbE9158a75E0e2167AAb` | IMMUTABLE |
| GUIDE_STAKE | GuideIdentityStakingPool | `0x5bdACF35292bDd681103BBb50865d8D2Fd49653f` | IMMUTABLE |
| PROVIDER_STAKE | ProviderIdentityStakingPool | `0xa90cA23767C1DdcA1Eb8AB292185e9af1106b075` | IMMUTABLE |
| FUND_STACK_USDC | 结算 USDC | `0x241948bE49a778490c8A4Ae8D98b7537fE001f63` | 外部 ERC20 |

### 0.3 · Indexer / 前后端引用

| 项 | 说明 |
|----|------|
| Indexer | `crates/core/src/indexer_v311_projections.rs` · 对账探针见总控 I-01 |
| BE/FE/Runtime | first-wins 须等于上表 ACTIVE 地址（`.env` / `frontend/.env.local` / phase2 env） |
| Proxy 壳定义 | `contracts/src/upgrade/TimelockUpgradeableProxy.sol` · **非** UUPS / Beacon |

---

## 1 · 升级架构（写死）

| 模式 | 用于 |
|------|------|
| **TimelockUpgradeableProxy**（EIP-1967 · Transparent-style admin slot） | Governor · P4Cap · PrimaryMarket · Seat · Stake |
| **IMMUTABLE** | TTG · Timelock · EscrowFactory · FeeRouter · Vaults… |
| **UUPS** | **未采用**（`proxiableUUID` = N/A） |
| **Beacon / Clone** | 未用于 V311 ACTIVE 治理壳；Escrow 实例为 Factory 创建 |

**升级权限：** `Safe（admin of Timelock）→ Timelock.schedule/execute → proxy.upgradeTo`  
**禁止** EOA 直接 `upgradeTo`。

---

## 2 · PASS 条件（AND）

1. 清单覆盖率 **100%**（Inventory 全项有 Evidence）  
2. 功能测试 **100% PASS**（含 Tier C 真实交易回执）  
3. 升级架构与权限验证 **PASS**  
4. **无** V2 ACTIVE 引用  
5. 失败项 **0**  
6. 真实 Sepolia RPC · 逐项 Evidence  

否则保持 **`TT_V311_WEB3_FULL_FUNCTION_CERT: FAIL`** · 仅修失败项定向重跑。

---

## 3 · 总控

```bash
# 只读 + first-wins + 升级架构（无私钥也可跑；Tier C 会 OWNER_REQUIRED→整体 FAIL）
bash scripts/dev/run-v311-web3-full-function-cert.sh

# Owner 授权真实交易功能层（须自备密钥 · Safe 审批另轨）
# 须先：本地 API 可达（I-01）· PRIVATE_KEY · Sepolia ETH/USDC
# F-02：queue 后 Timelock delay=172800s，到期再同命令复跑以 execute；未 execute 前保持 OWNER_REQUIRED
TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 \
  TT_V311_INDEXER_LIVE_RECONCILE=1 \
  API_BASE_URL=http://127.0.0.1:8080 \
  bash scripts/dev/run-v311-web3-full-function-cert.sh

# Gate（读最新 Evidence verdict；仅当 PASS=54 / FAIL=0 / OWNER_REQUIRED=0）
bash scripts/gates/check-v311-web3-full-function-cert.sh
```

**诚实边界：** Tier A 全绿 **≠** `TT_V311_WEB3_FULL_FUNCTION_CERT: PASS`；PASS 后仍 **≠** `TT_PSG_SEPOLIA_FREEZE` · **≠** ③ Production GO。

---

## 4 · 测试族（总控逐项）

| ID | 族 | Tier |
|----|-----|------|
| D-01 | 部署完整性（code size / chain_id） | A |
| D-02 | Proxy→Implementation 映射 | A |
| D-03 | initializer / 防重复初始化探针 | A |
| D-04 | upgrade selector / 非 UUPS | A |
| D-05 | admin = Timelock · Safe→Timelock 路径 | A |
| D-06 | bytecode hash | A |
| D-07 | roles / allowlist | A |
| D-08 | caps · sink=P4Cap | A |
| D-09 | stake bootstrap | A |
| D-10 | BE/FE/Runtime first-wins | A |
| D-11 | 无 V2 ACTIVE | A |
| I-01 | Indexer reconcile 探针 | B |
| F-01 | Escrow create/pay/release/refund/dispute | C · Owner |
| F-02 | 治理 propose · Timelock schedule→execute | C · Owner |
| F-03 | Treasury 流向（真实 tx） | C · Owner |

---

## 5 · Evidence

`evidence/GO_phase2_v311_web3_full_function_cert/<stamp>/`  
每项：`items/<id>.json` · 汇总：`VERDICT.json` · `SUMMARY.md`
