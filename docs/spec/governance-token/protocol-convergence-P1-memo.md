# Protocol Convergence · P1 收敛纪要

**Date:** 2026-05-27  
**Status:** **LOCKED（工程默认 · 法务待签）**  
**SSOT 真源：** [protocol-ssot.v1.md](protocol-ssot.v1.md) **v1.0.1** · [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml)

**阶段：** **① 文档定稿** — **不** 宣称 **②③** 链上/生产已验收。

---

## 1. 已决议（P1 · 写入 SSOT）

| # | 议题 | 决议 | SSOT 键 |
|---|------|------|---------|
| R1 | Phase 1 `steward_stake_bps` 与 `fee_route_bps` | **数值相等**（映射决策）；**语义分轨**（费用 vs TTG 质押） | §4 表 · yaml `jurisdictions[]` |
| R2 | 主理人最短任期 | **24 个月** 方可主动辞任；**180 天** 预告 | `lock_tiers.steward_seat_min_tenure_months` |
| R3 | 稳定币认购封闭期 | **24 个月**（与 Seat 任期同量级，**不同轨**） | `country_pool_subscription_lock_months` |
| R4 | NAV 赎回 | **非本金保证**；季度 **15 天** 窗口；单窗 **≤10% NAV** | fund-flow-ssot §4 · `redemption_*` |
| R5 | 运营费与赎回 | **OperationsVault** 已花费 **不可** 退给退出者；赎回仅 **NAV 比例** | fund-flow-ssot §2 |
| R6 | TTG 质押退出 | **非退款**；驳回/辞任后 **90 天延迟 + 最长 365 天线性释** | `steward_stake_release_*` |
| R7 | 多国 Seat | `steward_stake_bps` **累加**（例 CN+FR=850 bps） | §4 多国示例 |
| R8 | 状态枚举 | 仅 [state-machine.v1.md](state-machine.v1.md) **`snake_case`** | §0 machine_code 表 |

---

## 2. 待法务 / 产品书面（不阻塞 ① SSOT · 阻塞对外印刷）

- [x] **08-4** 增补「NAV 窗口赎回、非保本」对外句式（**工程草案 · 2026-05-27** · **[08-4 §2](08-4-对外口径包.md)** R4/R5 段 · **法务签字前不得印刷**）  
- [x] **84 §四** 法币募资列 = **[country-pool-fundraise-governance-v1](country-pool-fundraise-governance-v1.md)** 镜像（**2026-06-15 · 5.35 亿 · 无硬顶**）· **[84-valuation-anchor-P1-memo](84-valuation-anchor-P1-memo.md)** 三轨独立纪要  
- [ ] **LEGAL-SIGNOFF** 对 R4/R5 及 **84 定稿** 签字（清单 **[R4/R5 行](LEGAL-SIGNOFF-CHECKLIST.md)** · 仍 ☐）  

`protocol-ssot.v1.yaml` **`legal_signoff_pending: true`** 直至 **LEGAL-SIGNOFF** 勾选完成（08-4 工程草案与 84 纪要不等于签字）。

---

## 3. P2 实现入口（SSOT 定稿后 · ① 本地已闭 2026-05-27）

| 顺序 | 交付物 | 状态 |
|------|--------|------|
| 1 | `check-protocol-ssot-convergence.sh` + API `protocol_ssot` 块 | **done** |
| 2 | `RegionStewardStakePool` + `CountryPoolSubVaultsV0` + `CountryPoolRedemptionEpochV0` | **done（forge test）** |
| 3 | API `/steward/*` `/redemption/*` + `GET /governance/state-machines` | **done（chain_off ①）** |
| 4 | `frontend/lib/governance/protocolSsot.v1.ts` | **done** |
| 5 | `/steward/register` + onboarding `?role=region_steward` | **done** |
| 6 | `bash scripts/dev/smoke-steward-onboarding-local.sh` | **done（① 全链含 Admin）** |
| 7 | Admin **`/admin/steward-applications`** + review API/UI | **done（①）** |
| 8 | **84 §3.6** 纪要 + **`GO_local_steward_protocol_convergence`** | **done（① · 三轨独立 · 2026-06-15）** |
| 9 | `DeployRegionStewardStakePool` + **`smoke-steward-stake-anvil.sh`** | **done（② Anvil 链上 stake）** |
| 10 | **`GET /steward/stake-status`** + `steward_stake_pool` eth_call | **done（② Anvil eth_call + ephemeral API HTTP）** |
| 11 | 测试网部署/只读烟测脚本 | **done（工程闸 · 须有余额 PRIVATE_KEY 方可 broadcast）** |
| 12 | **Sepolia fork** 部署烟测 + 前端 `stake-status` 数据链 | **done（② fork 切片 · 非 broadcast）** |

---

## 4. 仍属 backlog（勿跳阶）

| 项 | 阶段 | 状态 |
|----|------|------|
| LEGAL-SIGNOFF（R4/R5 + 84 定稿） | 法务 · 阻塞对外印刷 | 清单已就绪 · **待签字** |
| Sepolia **mainnet broadcast** + Explorer | **② 测试网** | fork 已验 · **`deploy-steward-stake-pool-testnet.sh` + funded `PRIVATE_KEY`** |
| Staging `report.json` **GO** | **②** | PHASE2 轨 1 · 未闭 |
| 生产 GO | **③** | 未开始 |

**① 本地工程（P0 SSOT + P2 §3 行 1–8）**：**100 分已闭**

**② Anvil + fork + API HTTP（行 9–12）**：**100 分已闭** — Anvil smoke · Sepolia fork smoke · ephemeral API HTTP

**② Sepolia broadcast**：**待运维凭据** — [GO_phase2_steward_stake_sepolia](../../../evidence/GO_phase2_steward_stake_sepolia/README.md)

---

## 5. 变更记录

| Date | Note |
|------|------|
| 2026-05-27 | P3.2：测试网 deploy/readonly smoke；Anvil 默认 ephemeral API HTTP 对拍 |
| 2026-05-27 | P3.1：`GET /steward/stake-status` + `steward_stake_pool` eth_call；Anvil smoke 含 `steward_stake_pool_anvil_live` |
| 2026-05-27 | P3.0：DeployRegionStewardStakePool + Anvil 链上 stake 烟测（② 切片） |
| 2026-05-27 | P2.3：84 §3.6 Option C 工程纪要；GO_local 证据包 |
| 2026-05-27 | P2.2：烟测扩 redemption/me-steward-application；Admin 用户详情链 steward 队列；steward_register i18n；08-4 R4/R5 工程草案 |
| 2026-05-27 | P2.1b：迁移版本去重 `20260527120500`；SSOT 只读路由公开（state-machines / stake-quote / redemption quote）；全链烟测 live exit 0 |
| 2026-05-27 | P2.1：Admin steward 审核 API/UI + 全链烟测 |
| 2026-05-27 | P1 纪要初版；SSOT bump 1.0.1 |
