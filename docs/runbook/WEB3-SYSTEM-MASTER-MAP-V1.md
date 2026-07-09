# TravelTrust Web3 System Master Map v1

**Version:** 1.0.0  
**Status:** **ACTIVE · ③ Production 运营 SSOT**  
**Effective:** 2026-07-08  
**Scope:** `PRODUCTION_SCOPE_SEPOLIA` · `CHAIN_ID=11155111`  
**Maintainer:** Engineering Owner (Sebastian Ward)

> **Purpose**  
> 将 TravelTrust Web3 从「工程实现」升级为「可运营协议」的**单页总图**。  
> 用于：上线决策 · 融资材料 · 招聘 onboarding · 外部审计 · 主网部署 Wave 规划。

**Machine SSOT（自动对拍）：** [registry/web3-system-master-map.v1.yaml](../../registry/web3-system-master-map.v1.yaml)  
**Parity probe：** `node scripts/dev/check-web3-system-master-map-parity.cjs`  
**Primary Market DEFER：** [WEB3-PRIMARY-MARKET-DEFER-V1.md](./WEB3-PRIMARY-MARKET-DEFER-V1.md)

**Companion SSOT（ deeper detail ）：**

| 主题 | 文档 |
|------|------|
| 合约/池子技术总览 | [99-链上合约与池子总览](../spec/99-链上合约与池子总览.md) |
| 地址机读登记 | [protocol-convergence-deployments.v1.yaml](../../registry/protocol-convergence-deployments.v1.yaml) |
| 四类资金分轨 | [fund-flow-ssot.v1.md](../spec/governance-token/fund-flow-ssot.v1.md) |
| GovFreeze V2 基线 | [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md) |
| G24 可升级 posture | [g24-p-upgrade-01-contract-posture.v1.yaml](../../registry/g24-p-upgrade-01-contract-posture.v1.yaml) |
| ③ Runtime 接线 | [WEB3-SYSTEM-PRODUCTION-RUNTIME-WIRING.md](./WEB3-SYSTEM-PRODUCTION-RUNTIME-WIRING.md) |
| TTG Cert 12 步 | [ttg-governance-cert-gates.v1.yaml](../../registry/ttg-governance-cert-gates.v1.yaml) |
| Web3 系统闸 | [web3-system-production-gate.v1.yaml](../../registry/web3-system-production-gate.v1.yaml) |
| **Protocol-Grade 15 维审计** | [WEB3-PROTOCOL-GRADE-AUDIT-FRAMEWORK-V1.md](./WEB3-PROTOCOL-GRADE-AUDIT-FRAMEWORK-V1.md) · `node scripts/dev/run-web3-protocol-grade-audit.cjs` |

**维护纪律：** 动 `contracts/src`、部署序、prod `/meta` 键、Cert signoff 或 Wave 划分 → **同批** 更新本文 **§4 Master Table** + **§7 Wave Matrix** + 上游 registry/99。

---

## §1 30 秒结论

| 维度 | 判断 |
|------|------|
| **核心设计** | ✅ 完整 — Token · Governance · Treasury · Escrow · 三类 Staking · Settlement · G24 Proxy |
| **最成熟链路** | ✅ Traveler → USDC → Escrow → Release → FeeRouter（G3-02 PASS） |
| **最大运营误解点** | ⚠️ **两套 45%**（平台费 vs 净利润）— 见 §3 |
| **最大业务闭环缺口** | 🟡 CountryPool **Snapshot → Calculation → Claim → Payout** 未全 Production 化 |
| **最大安全剩余项** | 🔴 RBAC D3（registry ↔ 权限 ↔ 证据） |
| **治理生命周期** | 🟡 TTG Cert **7/12** · #8 Queued 等 Timelock · #9–12 未开始 |
| **Production GO** | ❌ `TT_PRODUCTION_GO: NO_GO` · `WEB3_SYSTEM_CLOSURE: BLOCKED` |

**ACTIVE 链上基线：** `gov_freeze_v2_clean_baseline`（2026-06-16）— **禁止** 回滚 Legacy V1 spine。

---

## §2 端到端系统流（四正交轨）

### 2.1 TTG 治理轨

```text
GovernanceVotesToken (TTG)
        │
        ├── TtgPrimaryMarketV1 ──► Holder 认购
        │
        └── Delegate ──► Vote ──► TravelTrustGovernor
                                    │
                                    queue ──► GovernanceTimelock (48h)
                                    │
                                    execute ──► Treasury / FeeRouter / Reserve / RegionVault / Proxy.upgradeTo
```

### 2.2 身份 · 质押轨（三类池 · 正交）

```text
Guide          Provider/Merchant       Region Steward
   │                  │                        │
Identity           Identity              Application (链下+Admin)
   │                  │                        │
USDC Stake         USDC Stake              TTG Stake
(GuidePool)        (ProviderPool)          (RegionStewardStakePool)
   │                  │                        │
接单 Escrow        Marketplace              SeatRegistry
                                              │
                                         Governance Vote
                                              │
                                         区域收益观察 (Target: 全辖区分配)
```

### 2.3 旅行 · 支付轨（核心 · 最成熟）

```text
Traveler ──► Wallet Connect ──► Approve USDC
        │
        └──► EscrowFactory.create ──► Escrow Instance (每单)
                    │
              Guide 完成服务
                    │
              release ──► platformFee ──► FeeRouter.distribute
                    │
              旅行者本金退回 / 向导收款
```

### 2.4 收益分配轨（两套 45% · 必须隔离）

见 §3。

---

## §3 两套 45% — 运营必读（防混账）

| 维度 | **D-4555-A · 平台费分配** | **D-4555-B · 国家净利润分配** |
|------|---------------------------|-------------------------------|
| **性质** | **业务收入**（订单手续费） | **利润分配**（国家池可分配净利润） |
| **来源** | Escrow `release` → `platformFee` | `CountryPoolNetProfitLedger` 记账 |
| **入口合约** | `FeeRouter` | `CountryPoolNetProfitLedger` |
| **典型去向** | `RegionVault` countryBucket **45%** + Global 三腿 | **45% StewardPath** · **55% globalTreasury** |
| **与 Escrow 关系** | 直接挂钩 | **正交** — 不参与 Escrow 状态机 |
| **当前状态** | ✅ G3-02 · prod corridor PASS | 🟡 DE pilot ledger 已部署 · **全链路 Claim/Payout 未 Production 化** |
| **SSOT** | [91](../spec/91-协议金库与资金池-技术索引.md) · [fund-flow R4](../spec/governance-token/fund-flow-ssot.v1.md) | [83/84](../spec/83-区域治理与收益分配-协议白皮书.md) · Four-Ledger evidence |

**审计/财务/产品三端统一话术：**

> 「平台费 45% 进国家桶」≠「国家净利润 45% 给主理人」。前者是 **FeeRouter 分账**；后者是 **CountryPool 利润分配**。

---

## §4 Master Table — 角色 × 功能 × 合约 × 池子 × 权限 × 阶段 × Evidence × 状态

**状态枚举：** `PASS` · `IN_PROGRESS` · `TARGET` · `DEFER` · `BLOCKED`

**部署阶段：** `① Local` · `② Sepolia` · `③ Prod Runtime` · `③ Mainnet`（future）

### 4.1 用户与商业角色

| 角色 | 功能 | 智能合约 | 资金池 / 资产 | 权限 / 控制面 | 部署阶段 | Evidence | 状态 |
|------|------|----------|---------------|---------------|----------|----------|------|
| **Traveler** | 钱包连接 · 链切换 | — (wallet) | — | 用户 EOA | ③ | G3-02 · Cert #2 | **PASS** |
| **Traveler** | USDC approve · 支付订金 | `Escrow` · `EscrowFactory` | Escrow 实例 · USDC | Escrow 状态机 · **无 admin** | ②③ | G3-02 PAY-W01..W16 | **PASS** |
| **Traveler** | 订单 release / refund | `Escrow` | USDC 本金 | traveler/guide 规则触发 | ②③ | G3-02 · HAT-R1 | **PASS** |
| **Guide** | 身份 USDC 质押 | `GuideIdentityStakingPool` | Guide 身份池 · USDC | `slasher`=Timelock | ②③ | Cert #2 · FundStack | **PASS** |
| **Guide** | 接单 · 完成服务 | `Escrow` · `Registry` | Escrow | Registry `authority` | ②③ | Cert #2 · G3-02 | **PASS** |
| **Provider / Merchant** | 身份 USDC 质押 | `ProviderIdentityStakingPool` | Provider 池 · USDC | `slasher`=Timelock | ②③ | Cert #2 | **PASS** |
| **Provider** | 橱窗 / onboarding | `Registry` (链下门闸为主) | — | Admin RBAC API | ①③ | Cert #3 · PD-009 | **PASS** (链下) |
| **Region Steward** | 辖区申请 | API + Admin | — | RBAC · ADM-U01 | ③ | Cert #3 | **PASS** |
| **Region Steward** | TTG 质押 · Seat | `RegionStewardStakePool` · `TtgSeatConcentrationRegistry` | TTG 质押池 | `owner`=Timelock · G24 Proxy | ②③ | stake-quote 200 · Cert #2 | **IN_PROGRESS** |
| **Region Steward** | 治理投票 | `GovernanceVotesToken` · `TravelTrustGovernor` | — | TTG votes | ②③ | Cert #7 Execute ✅ | **PASS** |
| **Region Steward** | Unstake / release | `RegionStewardStakePool` | TTG | release delay 状态机 | ② | Cert #9 | **IN_PROGRESS** |
| **Region Steward** | 区域净利润分配 | `CountryPoolNetProfitLedger` · `StewardPathVault` | DE pilot · Target 全辖区 | Timelock · immutable ledger | ② | Four-Ledger · HAT | **TARGET** |
| **TTG Holder** | Delegate · Vote | `GovernanceVotesToken` · `TravelTrustGovernor` | — | 持票者 | ②③ | Cert #7 | **PASS** |
| **TTG Holder** | 一级市场认购 | `TtgPrimaryMarketV1` | TTG · USDC | Timelock Proxy | ② | 合约 deployed | **DEFER** (无 UI) |
| **Moderator** | 社区 moderation | — (链下 RBAC) | — | RBAC D3 | ③ | Cert #3 | **BLOCKED** (D3) |
| **Admin** | 审核 · 门闸 · 只读治理 | API RBAC · `/admin/governance` | — | 禁 prod mock-pay | ③ | Cert #3 · RBAC D3 | **IN_PROGRESS** |
| **Timelock Executor** | Queue → 48h → Execute | `GovernanceTimelock` · `TravelTrustGovernor` | — | Safe admin · Governor | ②③ | Cert #7 ✅ · #8 Queue | **IN_PROGRESS** |
| **Finance / Ops** | Treasury spend | `GovernanceTreasuryP4Cap` | Treasury | `spender`=Timelock | ②③ | Cert #8 · #5 Finance | **IN_PROGRESS** |

### 4.2 协议基础设施（无单一「用户角色」）

| 功能 | 智能合约 | 资金池 | 权限 | 阶段 | Evidence | 状态 |
|------|----------|--------|------|------|----------|------|
| 平台费四腿分账 | `FeeRouter` | 暂存 → RV / Guide / Reserve / Treasury | `owner`=Timelock | ②③ | G3-02 · B-116 | **PASS** |
| 国家桶 forward | `RegionVault` | countryBucket USDC | `owner`=Timelock | ②③ | indexer · vault-forwards API | **PARTIAL** |
| 罚没准备金 | `ReserveVault` | globalReserve | `timelock` withdraw | ② | FundStack | **PASS** |
| 治理金库 | `GovernanceTreasuryP4Cap` | TTG + ERC20 | `spender`=Timelock | ②③ | Cert #8 · B-090 | **IN_PROGRESS** |
| 结算代币 (②) | `MockERC20` / USDC path | `FUND_STACK_TOKEN` | — | ② | G3-02 | **PASS** (② pilot) |
| Indexer 投影 | — | — | internal API | ③ | G3-02 W05/W06 · tick | **PARTIAL** (RPC) |
| Slash 路由 | `SlashRouter` | → ReserveVault | immutable BPS | — | GAP-99-02 | **TARGET** |
| 国家赎回窗 CN | `CountryPoolRedemptionEpochV0` | redemption asset | `owner`=Timelock | ② | redemption-quote | **PASS** (pilot) |
| 国家试点账本 | `CountryPoolLedgerV0` | pilot USDC | `owner`=Timelock | ② | country-ledger API | **PASS** (pilot) |
| 分红 Claim (Target) | `RegionDistributionClaim` | ClaimVault | Timelock owner | — | GAP-99-03 | **TARGET** |

---

## §5 池子清单（What is What）

| 池子 / 金库 | 合约 | 持有什么 | 入金来源 | 出金规则 | 状态 |
|-------------|------|----------|----------|----------|------|
| **Treasury** | `GovernanceTreasuryP4Cap` | TTG · ERC20 | globalOps 腿 · 治理 mint/transfer · 55% 净利润轨 | Timelock `spend` | ✅ Runtime |
| **ReserveVault** | `ReserveVault` | USDC | FeeRouter globalReserve · Slash | Timelock withdraw | ✅ |
| **RegionVault** | `RegionVault` | USDC | FeeRouter countryBucket **45%** | Timelock `forward` | ✅ MVP · Snapshot/Claim Target |
| **FeeRouter 暂存** | `FeeRouter` | USDC 待分配 | Escrow platformFee | `distribute` onlyOwner | ✅ |
| **Guide 身份池** | `GuideIdentityStakingPool` | USDC 质押 | 用户 stake | withdraw / slash | ✅ |
| **Provider 身份池** | `ProviderIdentityStakingPool` | USDC 质押 | 用户 stake | withdraw / slash | ✅ |
| **Steward TTG 池** | `RegionStewardStakePool` | TTG 按辖区 | Steward stake | release / slash Target | 🟡 Cert #9 |
| **Escrow 实例** | `Escrow` × N | 旅行者 USDC 本金 | traveler deposit | release/refund 状态机 | ✅ |
| **DE NetProfit Ledger** | `CountryPoolNetProfitLedger` | 记账 · 45/55 split | 链下/运营 credit | StewardPath + Treasury | 🟡 pilot |
| **StewardPathVault** | `StewardPathVault` | USDC | Ledger 45% 轨 | Claim Target | **TARGET** |
| **UnallocatedStewardPathVault** | `UnallocatedStewardPathVault` | USDC | 未分配 steward 路径 | 治理处置 Target | **TARGET** |
| **Redemption CN** | `CountryPoolRedemptionEpochV0` | 赎回资产 | 用户认购轨 | epoch claim | ✅ pilot |

---

## §6 ACTIVE Sepolia 地址速查（GovFreeze V2 + FundStack）

> **机读 SSOT：** `registry/protocol-convergence-deployments.v1.yaml` → `gov_freeze_v2_clean_baseline` + FundStack env（序 2 未 overlay 替换的合约保持 spine 地址）。

| 模块 | 合约 | 地址 (Sepolia) | env 键 |
|------|------|----------------|--------|
| TTG | `GovernanceVotesToken` | `0x2837ea0c50e27d59b88af617abbb231a040062c5` | `GOVERNANCE_TOKEN_ADDRESS` |
| Timelock | `GovernanceTimelock` | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` | `TIMELOCK_ADDRESS` |
| Governor | `TravelTrustGovernor` (proxy) | `0x847b00ddb6ffed71812abc358a407dad4b099fcb` | `GOVERNOR_ADDRESS` |
| Treasury (P4Cap · ACTIVE) | `GovernanceTreasuryP4Cap` (proxy) | `0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2` | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` |
| Treasury (legacy FeeRouter leg) | `GovernanceTreasury` | `0x6a8323fb2394A1e9655F7132F4E4B8222d2898be` | `LEGACY_TREASURY_ADDRESS` |
| Primary Market | `TtgPrimaryMarketV1` (proxy) | `0x7af15f98622b9282298ca3070a698ca4a96a4016` | — |
| Seat Registry | `TtgSeatConcentrationRegistry` (proxy) | `0xc99776e980d33f1857d5bb9a57b35ab7669aad1f` | — |
| Steward Pool | `RegionStewardStakePool` (proxy) | `0x3a89378bfad12d1028707dd37055294854c8784e` | `REGION_STEWARD_STAKE_POOL_ADDRESS` |
| Escrow Factory | `EscrowFactory` | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` | `ESCROW_FACTORY_ADDRESS` |
| Fee Router | `FeeRouter` | `0x81A8009210c5215100564c6E4123F672c4459306` | `FEE_ROUTER_ADDRESS` |
| Region Vault | `RegionVault` | `0x2Ea061d50393c09af2f607Ee9f89679642A3a65B` | `REGION_VAULT_ADDRESS` |
| Reserve Vault | `ReserveVault` | `0xbC541FAf26e139eF1f0AC22b52c4b4F85FFF7855` | `RESERVE_VAULT_ADDRESS` |
| Guide Pool | `GuideIdentityStakingPool` | `0x5bdACF35292bDd681103BBb50865d8D2Fd49653f` | `GUIDE_STAKING_ADDRESS` |
| Provider Pool | `ProviderIdentityStakingPool` | `0xa90cA23767C1DdcA1Eb8AB292185e9af1106b075` | `STAKING_PROVIDER_ADDRESS` |
| Registry | `Registry` | `0xc50913e154f850583D0afbE9158a75E0e2167AAb` | `REGISTRY_ADDRESS` |
| Settlement (②) | MockERC20 | `0x241948bE49a778490c8A4Ae8D98b7537fE001f63` | `FUND_STACK_TOKEN_ADDRESS` |
| DE NetProfit Ledger | `CountryPoolNetProfitLedger` | `0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa` | — |
| CN Redemption | `CountryPoolRedemptionEpochV0` | `0x712050e4b1517C3f3ab39B32Cabb70CC0E1C0829` | `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` |
| Pilot Ledger | `CountryPoolLedgerV0` | `0x63bd7d5ee5c5dde707e5e65303f3876267c78e97` | `COUNTRY_POOL_LEDGER_PILOT_ADDRESS` |

**Prod `/meta`：** 10/10 contract keys non-null · 对拍 gov_freeze_v2 — `WEB3_SYSTEM_META_CONTRACTS_CLOSURE_PASS`（2026-07-08）。

---

## §7 Production Deployment Wave Matrix（③ 运营分批）

> **说明：** ② Sepolia **合约已 broadcast**（GovFreeze V2 overlay 完成）。本 Matrix 描述 **③ Production 运营上线顺序**（Runtime · Evidence · 产品 · 主网），**不是**重新部署全套合约。

### Wave 1 — 必须（核心业务 · 当前 mostly PASS）

| 组件 | 类型 | 内容 | 依赖 | 状态 |
|------|------|------|------|------|
| Escrow + Factory | 合约 + FE | 旅行订金 · release | USDC/Mock settlement | ✅ |
| Settlement Token | 配置 | `NEXT_PUBLIC_SETTLEMENT_TOKEN_*` | FundStack | ✅ |
| FeeRouter | 合约 + Indexer | 平台费四腿 | Escrow recipient | ✅ |
| RegionVault | 合约 | countryBucket 承接 | FeeRouter | ✅ |
| Governor + Timelock | 合约 + `/meta` | 治理执行链 | Safe admin | ✅ wired |
| Treasury P4Cap | 合约 + `/meta` | 金库 spend | Timelock | 🟡 Cert #8 |
| Guide + Provider Pools | 合约 + `/meta` | 身份质押 | FundStack | ✅ |
| API `/meta` 10 keys | Runtime | Fly secrets | registry SSOT | ✅ |
| Indexer (Escrow + Fee) | Ops | tick · reconcile | RPC (推荐付费 archive) | 🟡 |
| G3-02 Payment Gate | Evidence | PAY-W01..W16 | Wave 1 全部 | ✅ |

**Wave 1 出口标准：** `TT_WEB3_PAYMENT_PRODUCTION_READY` = PASS（已达成）。

### Wave 2 — 治理扩展 + 区域闭环

| 组件 | 类型 | 内容 | 依赖 | 状态 |
|------|------|------|------|------|
| TTG Cert #7–12 | Evidence | Execute · Treasury · Unstake · DR · GORP | Timelock 48h | 🟡 7/12 |
| RegionStewardStakePool | 合约 + API | TTG stake · stake-quote | GovFreeze V2 | ✅ contract · 🟡 Cert #9 |
| Seat Registry | 合约 | 集中度 / Seat | GovFreeze V2 | ✅ deployed |
| Primary Market | 合约 + **UI** | TTG 认购 | Treasury · PM proxy | **DEFER** UI |
| CountryPool NetProfit | 合约 + Ops | DE pilot → 全辖区 | Four-Ledger | 🟡 |
| Snapshot / Claim / Payout | 合约 + FE + Finance | RegionDistributionClaim 叙事 | GAP-99-03 | **TARGET** |
| RBAC D3 closure | Security | registry ↔ permission ↔ evidence | Admin API | 🔴 |
| ABI Export (3 shells) | Engineering | GovFreeze proxy ABIs | FE/SDK | 🔴 |

**Wave 2 出口标准：** `TT_WEB3_SYSTEM_PRODUCTION_READY` = PASS · TTG Cert 12/12 · RBAC D3 CLOSED。

### Wave 3 — 高级能力 + 主网

| 组件 | 类型 | 内容 | 依赖 | 状态 |
|------|------|------|------|------|
| SlashRouter 接入 | 合约 | 双 Identity 池 slash → Reserve | GAP-99-02 | TARGET |
| DR / Incident | Evidence + Runbook | Cert #10–11 tabletop | Wave 2 | 未开始 |
| Advanced Governance | 产品 | 新 payload · 参数修订 | GOV-02 提案 | 冻结窗外 |
| External Audit R-01 | Compliance | 第三方审计 | GAP-99-01 | **OPEN** |
| Mainnet broadcast | 新 registry 槽 | chainId ≠ 11155111 | R-01 关闭 · Wave 2 PASS | TARGET |
| CountryPoolSubVaultsV0 | 合约 | 子 vault 登记 | P2 扩展 | TARGET |
| Reputation (optional) | 合约 | GAP-99-05 | — | 未实现 |

**Wave 3 出口标准：** `TT_PRODUCTION_GO` = GO · R-01 CLOSED · mainnet registry populated。

### ② 合约 Deploy Order（历史 · 已完成）

| Batch | 脚本 | 状态 |
|-------|------|------|
| 0 | Safe → Timelock admin | ✅ |
| 1 | `DeployGovernanceStack` | ✅ (overlay V2) |
| 2 | `DeployFundStackUnderTimelock` | ✅ |
| 3 | `DeployRegionStewardStakePool` | ✅ (V2 proxy) |
| 4 | `DeployCountryPoolRedemptionEpochV0` | ✅ CN pilot |
| 5 | `DeployP51CountryLedger` | ✅ optional pilot |
| Overlay | `DeployGovFreezeV2CleanBaseline` | ✅ ACTIVE |

---

## §8 可升级架构（G24 · 当前符合设计）

| Posture | 合约 | 升级路径 |
|---------|------|----------|
| **PROXY_REQUIRED** | Governor · TreasuryP4Cap · PrimaryMarket · SeatRegistry · RegionStewardStakePool | Timelock → `upgradeTo` |
| **CONTROLLER** | GovernanceTimelock | delay **immutable** · 仅 fresh deploy |
| **IMMUTABLE** | Escrow 实例 · CountryPoolNetProfitLedger · Settlement Vaults | 新部署 + 迁移 |
| **参数/角色 (A/B)** | FeeRouter · RegionVault · Identity Pools | Governor 提案或 Timelock schedule |

Gate: `bash scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh` → **PASS**

---

## §9 TTG Governance Cert 进度（12 步）

| # | 名称 | Signoff | 状态 | Evidence 路径 |
|---|------|---------|------|---------------|
| 1 | Human UAT | HUMAN-SCREEN-ACCEPTANCE | ✅ | `evidence/GO_ttg_cert/*/human-uat/` |
| 2 | Multi-Identity Walkthrough | MULTI-IDENTITY-WALKTHROUGH | ✅ | `walkthrough/multi-identity/` |
| 3 | Admin Walkthrough | ADMIN-WALKTHROUGH | ✅ | `walkthrough/admin/` |
| 4 | Safe Walkthrough | SAFE-WALKTHROUGH | ✅ | `walkthrough/safe/` |
| 5 | Finance Walkthrough | FINANCE-WALKTHROUGH | ✅ | `walkthrough/finance/` |
| 6 | Phase B Unpause | PHASE-B-UNPAUSE | ✅ | `phase-b/unpause/` |
| 7 | Execute | PHASE-B-EXECUTE | ✅ | `phase-b/execute/` · tx `0x5ebb…` |
| 8 | Treasury Spend | PHASE-B-TREASURY-SPEND | 🟡 **Queued** · TL#2 ~2026-07-10 09:20 UTC | `phase-b/treasury-spend/` · HAT step-09 |
| 9 | Unstake | PHASE-B-UNSTAKE | ☐ | `phase-b/unstake/` |
| 10 | Incident Tabletop | INCIDENT-TABLETOP | ☐ | `incidents/tabletop/` |
| 11 | DR Drill | DR-DRILL | ☐ | `drills/` |
| 12 | GORP Signoff | GORP-SIGNOFF | ☐ | `gorp-signoff/` |

**汇总：** **7/12 complete** · #8 awaiting Timelock execute · **WEB3-SYS-P1-002** open until 12/12。

---

## §10 未完成清单（按优先级）

### P0 — 0 ✅

### P1 — 发布前必须

| ID | 项 | 说明 | Owner 动作 |
|----|-----|------|------------|
| P1-002 | TTG Cert #8–12 | 治理生命周期证据 | #8 execute after TL · #9–12 sequential |
| P1-003 | RBAC D3 | D3-F01 registry drift · D3-F04 ADM-U01 | registry sync + staging matrix |
| P1-004 | ABI Export | 3 GovFreeze shell ABIs missing | export to `contracts/abi/` |
| P1-005 | Primary Market UI | 合约 ✅ · `/primary-market` 无 | **产品决策：** ship vs defer MVP |

### Target — 非阻塞 · 第三阶段业务闭环

| GAP | 项 | 阶段 |
|-----|-----|------|
| GAP-99-01 | 外部审计 R-01 | ③ mainnet 前 |
| GAP-99-02 | SlashRouter ≠ 0 | Wave 3 |
| GAP-99-03 | RegionVault Snapshot/Claim | Wave 2–3 |
| GAP-99-04 | CountryPoolSubVaultsV0 | P2 扩展 |
| — | CountryPool 全辖区 Distribution Production 化 | Wave 2 |
| GAP-99-06 | `/meta` pause 链上自动对拍 | Ops |
| GAP-99-07 | 多链 registry | Mainnet |

---

## §11 身份 Web3 流程清单（Quick Reference）

### Traveler
1. `/me/settings` → Connect Wallet · Switch Sepolia  
2. `/market` → 选服务 → 创建订单  
3. Approve USDC → Escrow deposit  
4. 服务完成 → release（或 dispute/refund 路径）  
5. 平台费自动 → FeeRouter（用户无感）

### Guide
1. Admin/Registry 批准 Guide 身份  
2. USDC Identity Stake（`GuideIdentityStakingPool`）  
3. `/guide` 接单 → Escrow 状态推进  
4. 服务完成 → 触发 release → 收款

### Provider / Merchant
1. `/provider/register` onboarding  
2. USDC Identity Stake（`ProviderIdentityStakingPool`）  
3. 发布橱窗 · `/market/acquisition`（链下门闸为主）

### Region Steward
1. 辖区申请（API + Admin）  
2. `/governance` → TTG approve → `RegionStewardStakePool.stake`  
3. Seat 登记 · 治理参与（delegate/vote）  
4. **Target：** 区域净利润 Claim 路径（DE pilot → 全辖区）  
5. **Cert #9：** `requestRelease` / unstake 证据

### TTG Holder
1. 持有 TTG · Delegate  
2. `/governance/proposals` → Vote  
3. 成功提案 → Queue → 48h → Execute  
4. **Optional：** Primary Market 认购（UI deferred）

### Admin / Ops
1. RBAC 门闸 — **禁止** prod mock-pay  
2. `/admin/governance` 只读链上状态  
3. Safe + Timelock 执行路径（Cert #4/#7/#8）  
4. Indexer health · `/meta` parity 监控

---

## §12 Evidence 索引（审计入口）

| 域 | 路径 |
|----|------|
| Web3 System Audit | `evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-DEEP-AUDIT-LATEST.json` |
| Blockers | `evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-BLOCKERS-LATEST.md` |
| G3-02 Payment | `evidence/GO_production_readiness/G3-02/G3-02-EXECUTION-LATEST.json` |
| TTG Cert session | `evidence/GO_ttg_cert/20260616T100918Z/` |
| HAT-R1 Sepolia | `evidence/GO_hat_r1_sepolia/20260616T063612Z/` |
| GovFreeze V2 baseline | `evidence/GO_phase2_gov_freeze_v2_clean_baseline/latest/` |
| Four-Ledger / DE cutover | `evidence/GO_tt_country_pool_revenue_enterprise_hat/` |
| Meta 10/10 closure | `evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-META-CONTRACTS-CLOSURE-LATEST.json` |

**Probe commands:**

```bash
node scripts/dev/run-web3-system-deep-audit.cjs
node scripts/dev/run-web3-system-closure.cjs
node scripts/dev/check-web3-system-production-meta-contracts.cjs
```

---

## §13 变更日志

| Date | Version | Change |
|------|---------|--------|
| 2026-07-08 | 1.0.1 | 新增机读 registry + parity probe · 接入 closure / deep audit |
| 2026-07-08 | 1.0.0 | 初版 — Master Table · Wave Matrix · 双 45% 运营说明 · Cert 7/12 快照 |

---

*本文是 ③ 阶段运营 SSOT。技术细节变更请先更新 [99](../spec/99-链上合约与池子总览.md) 与 registry，再回写本文 §4/§6/§7。*
