# TT-PHASE2-SEPOLIA-SYSTEM-ACCEPTANCE-REPORT

> **SUPERSEDED · READ-ONLY · LEGACY** — Pre–GovFreeze-V2 全系统验收旁证；链上地址表为 **LEGACY** spine。**ACTIVE 读口：** [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · 序 1～5 **全系统验收报告**（治理链 · 四腿资金 · Escrow 结构 · 质押/赎回/账本 · registry→API→Admin 读面）

**机读入口：** `bash scripts/dev/phase2-sepolia-system-acceptance.sh` → `TT_PHASE2_SEPOLIA_SYSTEM_ACCEPTANCE: PASS`

**验收执行时间（UTC）：** 2026-06-05T10:33:41Z

**链部署政策：** **暂停新增链上 broadcast**（本报告仅 cast + registry + API 静态/可选 HTTP · **无新合约部署**）

**互指：** [TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY](./TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md) · [TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION](./TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION.md) · [TT-PHASE2-STAGING-READINESS-REPORT](./TT-PHASE2-STAGING-READINESS-REPORT.md) · [protocol-convergence-deployments.v1.yaml](../../registry/protocol-convergence-deployments.v1.yaml)

---

## 0 · 诚实边界（必读）

| 本报告 **PASS** | **不等于** |
|-----------------|------------|
| ② Sepolia 序 1～5 链上绑定 + registry/env/API 静态对拍 | **Staging 全矩阵 GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** 仍成立 |
| cast 结构闸 + quote parity | **Sepolia Escrow 实例 E2E**（Created→Funded→Completed） |
| 本地 `:8080` HTTP 可选探针 | **持久 Fly Staging** API/FE · Admin Phase ② GO |
| ② MockERC20 pilot 资产 | **③ 主网真 USDC / Production PSP** |
| ISS-007 窄切片或社区 C1～C12 | **96-20 全路由矩阵** · R-002 `--require-go` 全站 GO |

**R-01 外部审计：** 仍 **OPEN** — 本验收 **不** 关闭 R-01。

---

## 1 · 总表

| 项 | 结论 |
|----|------|
| **有没有收口（② 链上序 1～5）** | **是（② Sepolia）** — 机读 `TT_PHASE2_SEPOLIA_SYSTEM_ACCEPTANCE: PASS` |
| **有没有 UI 冻结** | **不适用** — 本域为链上 + API 读面；五主 UI 冻结见 FIVE-MAIN |
| **新增链上部署** | **暂停** — `new_deployments: PAUSED_BY_POLICY` |
| **治理链 TTG→Governor→Timelock** | **PASS** |
| **FeeRouter 四腿 + FundStack owner** | **PASS**（16/16 verify） |
| **EscrowFactory→Escrow 生命周期** | **结构 PASS** · 实例 E2E **未强制**（P1） |
| **RegionStewardStakePool** | **PASS** |
| **CountryPoolRedemptionEpoch CN** | **PASS** |
| **CountryPoolLedger DE pilot** | **PASS** |
| **registry ↔ env（8 对 + ledger alias）** | **PASS** |
| **quote parity（SSOT + immutables）** | **PASS** |
| **API 静态读面** | **PASS** |
| **HTTP 实时读面** | **WARN** — protocol-reference 版本漂移 · country-ledger/DE 需 runtime env |

**一句话结论：** **② Sepolia 序 1～5 链上主脊 + 读面对拍已闭**；进入 **Staging 全矩阵** 前须先清零 **§6 P0**（持久 Staging · Stripe · API 注入 Sepolia env · Escrow E2E · 禁止用本 PASS 冒充全站 GO）。

---

## 2 · 验收清单（机读域 A～J）

| # | 域 | 脚本 / 检查 | 状态 | 未完成应在哪阶 |
|---|-----|-------------|------|----------------|
| A | registry ↔ env 序 1～5 | 8 对地址 + `COUNTRY_POOL_LEDGER_PILOT` = `COUNTRY_POOL_LEDGER` | ✅ 完成 | — |
| B | TTG→Governor→Timelock | Timelock.admin→Safe · governor→Governor · allowlist ×2 · admin≠deployer | ✅ 完成 | — |
| C | FundStack + FeeRouter 四腿 | `phase2-sepolia-fundstack-verify-bindings.sh` 16/16 | ✅ 完成 | — |
| D | EscrowFactory 结构 | guardian→Timelock · factoryPaused=false · ChainConfig fee_router SSOT | ✅ 完成 | Escrow 实例 E2E → **②** |
| E | RegionStewardStakePool | owner→Timelock · ttg · CN bps/minStake · registry/API | ✅ 完成 | staging 真 stake tx → **②** |
| F | CountryPoolRedemptionEpoch CN | immutables · asset→MockERC20 · registry/API | ✅ 完成 | 开窗/赎回 tx → **②** |
| G | CountryPoolLedger DE | pilot=DE · owner→Timelock · API alias | ✅ 完成 | staging runtime 读链 → **②** |
| H | quote parity | `check-protocol-quote-parity.sh` | ✅ 完成 | — |
| I | API 静态路由 | steward · redemption · country-ledger · protocol-reference | ✅ 完成 | — |
| J | HTTP 可选 | `:8080` health 可达时探针 | ⚠️ WARN | staging 注入 env → **②** |

---

## 3 · 控制面与治理链（序 1）

| 检查项 | 期望 | 结果 |
|--------|------|------|
| `Timelock.admin()` | Safe `0x7c018293396325077bb4D039930dcEe11B7Fb1Cf` | PASS |
| `Timelock.governor()` | Governor `0xa79c8df5C225825f6d04a497043dB0F1995B55ae` | PASS |
| `Timelock.admin` ≠ deployer | deployer `0x104FCb93…D212` | PASS |
| `Governor.timelock()` | Timelock `0x0359d4fB…Ee8f` | PASS |
| `allowedExecutionTarget(Governor)` | true | PASS |
| `allowedExecutionTarget(GovernanceToken)` | true | PASS |
| `GovernanceVotesToken.name()` | TravelTrust Governance | PASS |

---

## 4 · FundStack + FeeRouter 四腿（序 2）

| 检查 | 结果 |
|------|------|
| FeeRouter / RegionVault / Treasury owner → Timelock | PASS |
| Treasury.spender → Timelock | PASS |
| ReserveVault.timelock → Timelock | PASS |
| EscrowFactory.guardian → Timelock | PASS |
| GuidePool / ProviderPool slasher → Timelock | PASS |
| **FeeRouter.countryBucket** → RegionVault `0x2Ea061…a65B` | PASS |
| **FeeRouter.globalStakers** → GuidePool | PASS |
| **FeeRouter.globalReserve** → ReserveVault | PASS |
| **FeeRouter.globalOps** → Treasury | PASS |
| Timelock allowlist ×4（FR · Treasury · Reserve · RegionVault） | PASS |

**Escrow 生命周期（结构闸 · 序 2 延伸）：**

| 检查 | 结果 |
|------|------|
| `EscrowFactory.guardian()` → Timelock | PASS |
| `EscrowFactory.factoryPaused()` = false | PASS |
| API `ChainConfig` · `escrow_platform_fee_recipient` → FeeRouter SSOT | PASS |
| `EscrowCreated` 事件 / `createEscrow` 声明 | PASS |
| **Sepolia 生产 Escrow 实例** Created→Funded→Completed | **未验** — 见 §6 P1-CHAIN-02 |

---

## 5 · RegionStewardStakePool（序 3）

| 检查 | 结果 |
|------|------|
| `pool.owner()` → Timelock · ≠ deployer | PASS |
| `pool.ttg()` → GovernanceToken | PASS |
| `stewardStakeBps(CN)` = 400 | PASS |
| `minStakeAmount(CN)` = 400000000000000000000000 | PASS |
| `version()` = region_steward_stake_pool_v1 | PASS |
| env ↔ registry ↔ `GET /api/v1/steward/stake-quote` | PASS |

---

## 6 · CountryPoolRedemptionEpoch CN（序 4）

| 检查 | 结果 |
|------|------|
| `epoch.owner()` → Timelock · ≠ deployer | PASS |
| `maxNavPctBps()` = 1000 · `windowSeconds()` = 1296000 | PASS |
| `jurisdiction()` = CN (0x434e) | PASS |
| `version()` = country_pool_redemption_epoch_v0 | PASS |
| `asset()` → `REDEMPTION_ASSET_ADDRESS` MockERC20 | PASS |
| env ↔ registry ↔ `GET /api/v1/redemption/quote` | PASS |

---

## 7 · CountryPoolLedger DE pilot（序 5）

| 检查 | 结果 |
|------|------|
| `ledger.owner()` → Timelock · ≠ deployer | PASS |
| `pilotJurisdiction()` = DE (0x4445) | PASS |
| `version()` = country_ledger_ssot_v0 | PASS |
| env `COUNTRY_POOL_LEDGER_PILOT_ADDRESS` ↔ registry | PASS |
| API alias `COUNTRY_POOL_LEDGER_ADDRESS` = pilot | PASS |
| `GET /api/v1/governance/country-ledger/:jurisdiction` 静态声明 | PASS |

**broadcast：** 见 [TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST](./TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST.md) · **BROADCAST COMPLETE**

---

## 8 · registry → API → Admin 读面一致性

### 8.1 registry ↔ env（登记 8 对）

| env 键 | registry 键 | Sepolia 地址 |
|--------|-------------|--------------|
| `GOVERNANCE_TOKEN_ADDRESS` | `governance_token_address` | `0xaC2E29AC7089e4863C21dAF232cF8bbb025d91ca` |
| `GOVERNOR_ADDRESS` | `governor_address` | `0xa79c8df5C225825f6d04a497043dB0F1995B55ae` |
| `TIMELOCK_ADDRESS` | `timelock_address` | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` |
| `ESCROW_FACTORY_ADDRESS` | `escrow_factory_address` | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` |
| `FEE_ROUTER_ADDRESS` | `fee_router_address` | `0x81A8009210c5215100564c6E4123F672c4459306` |
| `REGION_STEWARD_STAKE_POOL_ADDRESS` | `region_steward_stake_pool_address` | `0x16F914f3D50f7Aa02665589e715F94CA3b7Ab47c` |
| `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` | `country_pool_redemption_epoch_cn_address` | `0x712050e4b1517C3f3ab39B32Cabb70CC0E1C0829` |
| `COUNTRY_POOL_LEDGER_PILOT_ADDRESS` | `country_pool_ledger_pilot_address` | `0x63bd7d5ee5c5dde707e5e65303f3876267c78e97` |

**env-only（② pilot · 未全量入 registry addresses 块）：** FundStack 子合约（RegionVault · Treasury · Reserve · Guide/Provider pools · Registry · MockERC20）、`REDEMPTION_ASSET_ADDRESS` — 见 `scripts/dev/.env.phase2-chain-deploy.local` · **P1-REG-01**

### 8.2 API 路由 ↔ ChainConfig

| HTTP 路由 | 源码 | 链上 env 消费 | 静态 |
|-----------|------|---------------|------|
| `GET /api/v1/steward/stake-quote` | `routes/steward.rs` | `REGION_STEWARD_STAKE_POOL_ADDRESS` | PASS |
| `GET /api/v1/redemption/quote` | `routes/redemption.rs` | `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` | PASS |
| `GET /api/v1/governance/country-ledger/:jurisdiction` | `routes/governance_country_ledger.rs` | `COUNTRY_POOL_LEDGER_ADDRESS` | PASS |
| `GET /api/v1/governance/protocol-reference` | `routes/governance_doc_reference.rs` | registry `protocol_ssot` | PASS（静态） |

### 8.3 HTTP 实时探针（optional · 本地 `:8080`）

| 探针 | 结果 | 说明 |
|------|------|------|
| `GET /api/v1/steward/stake-quote?jurisdictions=CN` | PASS | 200 |
| `GET /api/v1/redemption/quote?jurisdiction=CN` | PASS | 200 |
| `GET /api/v1/governance/protocol-reference` | **WARN** | 响应 `protocol_ssot_version` ≠ registry **1.0.1** — **P1-API-01** |
| `GET /api/v1/governance/country-ledger/DE` | **WARN** | 需 API runtime `CHAIN_RPC_URL` + ledger env — **P0-STG-03** |

**Admin 读面：** Admin Phase ① 已冻结；链上地址经 registry/env 对拍后可被 Admin 配置/合规读面消费 — **Admin Phase ②**（六角色矩阵 · ADM-U01/U02）仍 **NOT STARTED**，见 [TT-PHASE2-STAGING-READINESS-REPORT §4](./TT-PHASE2-STAGING-READINESS-REPORT.md#4--admin-phase-②--六角色矩阵缺口)。

---

## 9 · 机读证据

|  artifact | 路径 |
|-----------|------|
| JSON 摘要 | `evidence/GO_phase2_chain_sepolia/system-acceptance/latest/system-acceptance-20260605T103341Z.json` |
| 完整 log | `evidence/GO_phase2_chain_sepolia/system-acceptance/latest/system-acceptance-20260605T103341Z.log` |
| 控制台 | `evidence/GO_phase2_chain_sepolia/system-acceptance/latest/run-console.log` |

**复跑：**

```bash
export PHASE2_VERIFY_RPC_URL=https://sepolia.drpc.org
bash scripts/dev/phase2-sepolia-system-acceptance.sh
# 期望末行：TT_PHASE2_SEPOLIA_SYSTEM_ACCEPTANCE: PASS (seq 1–5 · no new deploy)
```

**RPC：** `https://sepolia.drpc.org`（验收时稳定；publicnode/1rpc 可能 TLS/限流 — 脚本含 RPC 轮换与 cast 重试）

---

## 10 · 进入 Staging 全矩阵前 · 剩余 P0 / P1 缺口

**口径：** 下列为 **Staging 全矩阵 / `TT_PHASE2_GO_VERDICT`** 前置项；**不** 否定本报告 **② Sepolia 链验收 PASS**。

### 10.1 P0（阻塞 Staging 全矩阵开工或链读面真绿）

| ID | 缺口 | 清零动作 | 阶段 |
|----|------|----------|------|
| **P0-STG-01** | **G-1 机读未绿** — Stripe `sk_test_*` / `whsec_*` 仍为占位 | 填 `.env.staging-secrets.local` → `bootstrap-phase2-g1-g2.sh` exit 0 | ② |
| **P0-STG-02** | **G-2 机读未绿** — 无持久 Fly HTTPS · `/health` 非 200 · 隧道 URL 漂移 | 部署 `STAGING_API_BASE` / `STAGING_FE_BASE` · migrate 远端 PG | ② |
| **P0-STG-03** | **Staging API 未注入 Sepolia 全量 env** — `CHAIN_RPC_URL` + 序 1～5 地址 + ledger alias | Fly secrets / staging `.env` 同步 `protocol-convergence-deployments` + `.env.phase2-chain-deploy.local` | ② |
| **P0-STG-04** | **G-4 非零 amount 未验** — ONB-P2-004/005 未在 staging 跑 | staging 关 `LOCAL_DEV` · 真 Stripe test 四方对拍 | ② |
| **P0-STG-05** | **Transition Audit T9 FAIL** — `TT_PHASE2_READY_VERDICT: NOT_READY` | G-1/G-2 绿后 `run-phase1-to-phase2-transition-audit.sh` exit 0 | ② |
| **P0-STG-06** | **Admin Phase ② 未启动** — 六角色 RBAC · ADM-U01/U02 · 禁止 `loca.lt` | `TT_PHASE2_ADMIN_STAGING: PASS` 证据链 | ② |
| **P0-STG-07** | **Stripe 真 webhook 闭环** — ONB-P2-003 | Dashboard 公网端点 + staging `whsec` | ② |
| **P0-AUDIT-01** | **R-01 外部审计 OPEN** | Owner 排期 · **不** 用本 PASS 替代 | ②→③ |

### 10.2 P1（不阻塞 Sepolia 链验收 · 阻塞「宽轨 / 全矩阵 GO」宣称）

| ID | 缺口 | 说明 | 阶段 |
|----|------|------|------|
| **P1-CHAIN-01** | **registry addresses 块未登记全 FundStack** | RegionVault · Treasury · Reserve · pools 仅 env · 见 §8.1 | ② |
| **P1-CHAIN-02** | **Sepolia Escrow 实例 E2E** | Created→Funded→Completed 未 broadcast/验收 | ② |
| **P1-CHAIN-03** | **Sepolia 真 stake / 赎回 / ledger 写路径 tx** | 本闸仅 owner/immutable/quote 读 | ② |
| **P1-API-01** | **HTTP protocol-reference 版本漂移** | 本地 API ≠ registry `1.0.1` · 静态 route PASS | ② |
| **P1-API-02** | **Indexer 与 staging 长驻读链** | country-ledger/DE 等需 runtime RPC + 地址 | ② |
| **P1-ONB-01** | **ONB-P2-001～006 全绿** | B 轨 staging smoke · 见 STAGING-READINESS §3.4 | ② |
| **P1-COMM-01** | **对象存储 / 邮件 staging 槽** | S3 · Resend · 非 log 冒充 ② | ② |
| **P1-MATRIX-01** | **ISS-007 / R-002 覆盖边界** | 43 锚 PARTIAL_GO **≠** staging 全矩阵 GO · [TT-9628](../runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary) | ② |
| **P1-GO-01** | **`TT_PHASE2_GO_VERDICT: NOT_MET`** | [PHASE2-CLOSING-GAP](./PHASE2-CLOSING-GAP.md) · 社区 C1～C12 **不** 替代 G 闸 | ② |

### 10.3 建议顺序（Staging 全矩阵前）

1. 清零 **P0-STG-01 / 02**（Stripe + 持久 Fly + bootstrap exit 0）
2. 注入 **P0-STG-03**（Sepolia env 全量）→ 复跑 HTTP **country-ledger/DE** · steward/redemption 对链
3. **P0-STG-04 / 07**（B 轨真支付 + webhook）
4. **P0-STG-06**（Admin ADM-U01→U02）
5. 并行 **P1-CHAIN-02/03**（Escrow E2E · 可选链上 tx 证据）
6. **Transition audit + G-4** → 再评估宽轨 matrix / ISS-007（**仍 ≠ ③ Production GO**）

---

## 11 · 机读摘要

```text
TT_PHASE2_SEPOLIA_SYSTEM_ACCEPTANCE: PASS (2026-06-05T103341Z)
chain_id: 11155111
sequences: 1,2,3,4,5
new_deployments: PAUSED_BY_POLICY
governance_chain: PASS
fee_router_four_legs: PASS
escrow_factory_structure: PASS (instance E2E not required)
steward_stake_pool: PASS
redemption_epoch_cn: PASS
country_ledger_de: PASS
registry_env_parity: PASS (8 pairs + ledger alias)
quote_parity: PASS
api_static_routes: PASS
http_live: warn_version_drift (protocol-reference · country-ledger/DE)
rpc: https://sepolia.drpc.org
ssot: docs/runbook/TT-PHASE2-SEPOLIA-SYSTEM-ACCEPTANCE-REPORT.md
staging_full_matrix: NOT_READY — see §10 P0/P1
```

---

## 12 · 变更记录

| Date | Note |
|------|------|
| 2026-06-05 | 初版：序 1～5 全系统验收 PASS · 暂停新 deploy · P0/P1 staging 缺口表 |
| 2026-06-05 | 机读脚本 `phase2-sepolia-system-acceptance.sh` · RPC 重试 · registry grep 窗口修正 |

---

**End of TT-PHASE2-SEPOLIA-SYSTEM-ACCEPTANCE-REPORT · ② Sepolia 序 1～5 PASS · Staging 全矩阵闸未开 · 禁止跳阶至 ③**
