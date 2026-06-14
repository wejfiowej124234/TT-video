# Governance Proposals L5 Closure (Phase ① · ACTIVE 100 · Industry Wallet L5)

**Date:** 2026-06-13  
**Scope:** `/governance/proposals` · `/new` · `/[id]` · 主理人发议题走廊 · **钱包全链路**

## 阶段口径

**① 本地 → ② 测试网 → ③ 公网/生产**

| 项 | 结论 |
|----|------|
| **有没有收口** | **是（① · 行业钱包 L5 100）** |
| **有没有 UI 冻结** | **是（① · 2026-06-13）** — [`GOVERNANCE-PROPOSALS-L5-FREEZE.md`](./GOVERNANCE-PROPOSALS-L5-FREEZE.md) · `governance-proposals-l5-20260613` |

**诚实边界：** ① Anvil/meta 钱包写链绿 **≠** ② Sepolia 窄切片 GO **≠** ③ Production + 法务

---

## ① 行业钱包 L5 清单（100）

| # | 清单项 | 状态 | 未完成应在哪阶 |
|---|--------|------|----------------|
| 1 | L5 壳 + 5 步向导 + 风险标签 | ✅ 完成 | — |
| 2 | 页内 **Connect CTA**（`GovernanceWalletConnectPanel`） | ✅ 完成 | — |
| 3 | **chainId 硬闸**（写 propose/vote/queue/execute 前） | ✅ 完成 | — |
| 4 | **getPastVotes** 门槛对拍（非 MVP `total_weight_units`） | ✅ 完成 | — |
| 5 | **simulateContract** gas 预检（submit 步） | ✅ 完成 | — |
| 6 | **steward Seat 钱包 mismatch** 提示 | ✅ 完成 | — |
| 7 | **多 action propose**（Governor 数组 · ≤8） | ✅ 完成 | — |
| 8 | **Timelock queue/execute** 钱包写（`useGovernanceTimelockActions`） | ✅ 完成 | — |
| 9 | castVote + 错误映射 + 禁链下假票 | ✅ 完成 | — |
| 10 | 主理人工作台 CTA + 回程链 + 烟测/contract | ✅ 完成 | — |
| 11 | 模板 auto-calldata + switchChain + simulate 降级 | ✅ 完成 | — |
| 12 | 浏览器链接 · operationId · cancel · 链上票权 copy | ✅ 完成 | — |
| 14 | UI 冻结 + FREEZE + AGENTS + Playwright full | ✅ 完成 · 已冻结 | — |

**企业级审计（①）：** **100/100** · 十维 **10/10** · [`GOVERNANCE-PROPOSALS-L5-ENTERPRISE-AUDIT.md`](./GOVERNANCE-PROPOSALS-L5-ENTERPRISE-AUDIT.md)

**Findings SSOT：** `governanceProposalsL5ClosureSprintModel.ts` · P0/P1 **open = 0**

---

## ② / ③

| # | 清单项 | 状态 | 未完成应在哪阶 |
|---|--------|------|----------------|
| 1 | Sepolia propose/vote/Timelock **全链验收** | ❌ 未完成 | **②** |
| 2 | Production Governor + 法务签字 | ❌ 未完成 | **③** |

---

## 机读验收（①）

```bash
bash scripts/dev/smoke-governance-proposals-l5-local.sh
```

末行：`TT_GOVERNANCE_PROPOSALS_L5_SMOKE: OK`

**一句话结论：** ① 治理议题 **行业钱包 L5 + 企业审计可闭项 = 100**（模板 calldata · 切链 · simulate 降级 · explorer · cancel · 单 action 守卫）；**Sepolia 证据** 留 **②**，**生产法务** 留 **③**。
