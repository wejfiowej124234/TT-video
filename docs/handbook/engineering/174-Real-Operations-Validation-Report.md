# 174 · Real Operations Validation Report

**Version:** 0.3.0 · **最后更新：** 2026-06-08  
**受众**：工程 · 运营 · 融资 IR · Owner  
**状态**：**IN_PROGRESS · Wave 2（Week-2 收口）**  
**程序 SSOT**：[173 ROV-01 Blueprint](./173-ROV-01-Real-Operations-Validation-Program-Blueprint.md)  
**PRA 并行 SSOT**：[176 Production Readiness Audit Report](./176-Production-Readiness-Audit-Report.md)  
**阶段**：**② 测试网**（Wave-1/2 在 **local testnet spine** 执行；Fly staging Growth **404** — 见 §2.1）

> **SSOT（必读）**：本文为 **ROV-01** 唯一进度与度量报告。**Wave-1 证据包**：`evidence/ROV_01/wave1-20260608T045822Z/` · **Wave-2**：`evidence/ROV_01/wave2-20260608T053055Z/` · 嵌入统一包：`evidence/PRODUCTION_READINESS_AUDIT/unified-20260608T053139Z/rov/wave2/`

**Wave**：**2**（ROV-T4～T5 · Week-2）  
**证据根**：`evidence/ROV_01/`  
**基线闸**：`bash scripts/check-rov-01-baseline-freeze.sh`

---

## 1. Executive verdict

| 维度 | 判定 | 备注 |
|------|------|------|
| **ROV-01 程序** | **`ROV_01_IN_PROGRESS`** | Wave 1 **T1–T3 GO** · Wave 2 **T4–T5 GO** · T6–T7 未启动 |
| **冻结基线 12/12** | **GO** | 2026-06-08 baseline gate |
| **Wave-1 三轨** | **3/3 GO** | T1 招募 · T2 四角色链 · T3 Growth 漏斗 |
| **Wave-2 两轨** | **2/2 GO** | T4 Cold Start · T5 CN market **live** |
| **核心指标（cohort）** | **PARTIAL** | 注册/转化/激活 **有实数** · WAU/D7/成本/反馈 **Week-1 TBD** |
| **Production GO** | **NO** | 继承 147 · **Sepolia scope only** |

**Wave-1 gate 输出（权威）：**

```text
TT_ROV_WAVE1: PACK_OK dir=evidence/ROV_01/wave1-20260608T045822Z
TT_ROV_T1: GO registered=32 with_ref=15 referral=TT-69L96N
TT_ROV_T2: GO
TT_ROV_T3: GO referral=TT-69L96N
```

**Wave-2 gate 输出（权威）：**

```text
TT_ROV_T4: GO
TT_ROV_T5: GO iso=CN phase=live
TT_ROV_WAVE2: PACK_OK dir=evidence/ROV_01/wave2-20260608T053055Z
```

**程序总裁定（未退出 ROV-01）：**

```text
TT_ROV_01_VALIDATION: ROV_01_IN_PROGRESS tracks_GO=5/7 metrics_complete=false phase=② wave=2
```

---

## 2. 七轨验证进度

### 2.1 Wave-1 执行环境

| 项 | 值 |
|----|-----|
| **exec_env** | `local_testnet_spine` |
| **API** | `http://127.0.0.1:8080`（Growth/CMS Admin 全栈） |
| **Fly staging** | `https://tt-api-staging.fly.dev` · `/health=200` · **Growth 路由 HTTP 404** |
| **纪律** | **零业务功能代码** · 仅 `scripts/ops/rov-wave1-*` 运营 harness |

> **说明（禁止假完成）**：Wave-1 在 **local ②-prepared spine** 完成 T1–T3 闭环；**非** Fly staging 原生 Growth 已验。staging 部署 Growth 栈前，不得以 Wave-1 冒充「Fly 测试网 Growth 已运营验证」。

### 2.2 轨状态

| 轨 | 名称 | Wave-1 | 状态 | 证据 |
|----|------|--------|------|------|
| **ROV-T1** | 测试网真实用户招募 | **✓** | **GO** · **32** 非 SEED | `tracks/ROV-T1/` · `cohort_users.jsonl` |
| **ROV-T2** | 四角色完整业务链 | **✓** | **GO** | `tracks/ROV-T2/` · `artifacts.txt` |
| **ROV-T3** | Growth 转化漏斗 | **✓** | **GO** | `tracks/ROV-T3/` · `analytics_*.json` |
| **ROV-T4** | Cold Start 内容运营 | **✓** | **GO** | `wave2-…/tracks/ROV-T4/` · D3 smoke |
| **ROV-T5** | Country Market 试点 | **✓** | **GO** · CN **live** | `wave2-…/tracks/ROV-T5/` · `launch_final.json` |
| **ROV-T6** | RegionShare 模拟分润 | — | **NOT_STARTED** | Wave 3 |
| **ROV-T7** | 投资人 Demo & Data Room | — | **NOT_STARTED** | Wave 4 |

**T2 链路摘要（Wave-1）**

| 角色 | 执行 | 结果 |
|------|------|------|
| **旅行者** | cohort `rov-w1-1-*` · POST `/itineraries` | order `a5458398-…` |
| **向导** | `rov-w1-guide-*` · PATCH assignable guide | **guide_bind=OK** |
| **商家** | `rov-w1-2-*` · provider onboarding smoke | **merchant_onboarding=OK** |
| **运营** | Admin growth analytics / official accounts GET | analytics **200** |
| **管理员** | `tourist@test.com` super_admin + 2FA session | 审批链探针经 T2 smoke |

---

## 3. 核心指标

<a id="rov-174-metrics"></a>

**统计窗口（Wave-1 cohort）**：`2026-06-08T04:58:22Z` → `2026-06-08T04:59:39Z`  
**cohort 定义**：邮箱 `rov-w1-*@rov-cohort.invalid`（**非** `@traveltrust.test` / seed）

### 3.1 Week-1 汇总（按周 · Wave-1）

| 指标 | 定义 | 目标（②） | **Wave-1 当前** | 采集 |
|------|------|-----------|-----------------|------|
| **注册数（非 SEED）** | cohort 注册 | ≥ **30** | **32** ✓ | T1 jsonl |
| **Referral 绑定** | 带码注册且 `referral_bound` | — | **15 / 15**（100%） | T1 + T3 |
| **Early Bird 分配** | 注册响应 `early_bird` | — | **31 / 32** | T1 jsonl |
| **激活率** | referral 或 early_bird 命中 | ≥ **15%** | **46.9%**（15/32 referral 维度） | metrics v1 |
| **邀请→注册转化率** | 带码意图 → 成功注册 | ≥ **25%** | **100%**（15/15） | cohort stats |
| **WAU** | 7 日内活跃 | ≥ **15** | **TBD**（需 D+7） | — |
| **D7 留存率** | cohort D7 仍活跃 | ≥ **20%** | **TBD**（需 D+7） | — |
| **运营成本** | 测试网账单 + 人工 | 记录 | **TBD** | Owner 输入 |
| **用户反馈** | 访谈 / ticket | ≥ **1** | **0** | `feedback/` |

**机读 SSOT**：`evidence/ROV_01/wave1-20260608T045822Z/metrics/wave1_metrics.v1.json`

### 3.2 Growth Analytics（Admin · 窗口内全库 · 含历史注册）

| 指标 | 值 | 备注 |
|------|-----|------|
| `registrations_total` | 280 | PG 全库 · 非仅 cohort |
| `registrations_with_referral` | 90 | |
| `referral_events_total` | 90 | |
| `referral_code_conversion_uses` | 90 | |
| `users_with_points` | 5 | |
| `early_bird_stage=2` users | 280（窗口内新注册） | Admin overview |

**漏斗 steps（Admin API · 同窗口）**

| step | count | rate_from_start |
|------|-------|-----------------|
| registrations | 280 | 100% |
| with_referral | 90 | 32.1% |
| referral_events | 90 | 32.1% |
| with_points | 5 | 1.8% |

### 3.3 留存率（待 Week-2 填实）

| Cohort | D1 | D7 | D30 | Wave-1 |
|--------|----|----|-----|--------|
| **ROV-W1 `@rov-cohort.invalid`** | **TBD** | **TBD** | **TBD** | 2026-06-15 复跑 SQL |

### 3.4 运营成本（Week-1）

| 项 | 实际 | 备注 |
|----|------|------|
| Fly staging / PG | **TBD** | Owner 账单 |
| 本地 Docker / 算力 | **TBD** | 维护者工时 ~1.3h harness |
| 招募激励 | **0** | 无付费激励 |

### 3.5 市场反馈（Week-1）

| 来源 | 样本 | 摘要 | 情感 | 日期 |
|------|------|------|------|------|
| — | **0** | 待 Wave-2 用户 walkthrough | — | — |

模板：`evidence/ROV_01/feedback/FEEDBACK-TEMPLATE.md`

---

## 4. Wave 计划与进度

| Wave | 目标 | 轨 | 状态 |
|------|------|-----|------|
| **0** | 基线冻结 · 报告立项 | — | **DONE** |
| **1** | 招募 + 四角色链 + Growth 漏斗 | T1 · T2 · T3 | **DONE** · 证据 `wave1-20260608T045822Z` |
| **2** | Cold Start + Country Market | T4 · T5 | **DONE** · 证据 `wave2-20260608T053055Z` · 嵌入 PRA `unified-20260608T053139Z` |
| **3** | RegionShare job | T6 | 待启动 |
| **4** | 投资人 demo + 指标收口 | T7 · §3 填实 | 待启动 |

---

## 5. 复现（Wave-1 / Wave-2 Evidence Pack）

```bash
# 前置：local API :8080 healthy（须含 country-market 路由）· traveltrust-postgres · migrations applied
bash scripts/ops/rov-wave1-evidence-pack.sh
bash scripts/ops/rov-wave2-evidence-pack.sh
# 或嵌入 PRA 统一包：
bash scripts/ops/pra-unified-release-evidence-pack.sh
```

| 脚本 | 轨 |
|------|-----|
| `scripts/ops/rov-wave1-t1-recruit.sh` | T1 |
| `scripts/ops/rov-wave1-t2-business-chain.sh` | T2 |
| `scripts/ops/rov-wave1-t3-growth-funnel.sh` | T3 |
| `scripts/ops/rov-wave1-collect-metrics.sh` | 度量 |
| `scripts/ops/rov-wave1-evidence-pack.sh` | Wave-1 打包 |
| `scripts/ops/rov-wave2-t4-cold-start.sh` | T4 |
| `scripts/ops/rov-wave2-t5-country-market.sh` | T5 |
| `scripts/ops/rov-wave2-evidence-pack.sh` | Wave-2 打包 |

---

## 6. 风险与 HOLD

| ID | 风险 | Wave-1 状态 | 缓解 |
|----|------|-------------|------|
| R-01 | Fly staging **无 Growth API** | **CONFIRMED** 404 | Wave-1 用 local spine；staging  redeploy 后复跑 |
| R-02 | 147 **NO_GO** 外泄 | 174/173 页眉 **② only** | — |
| R-03 | WAU/D7 **未到期** | **OPEN** | 2026-06-15 Week-2 更新 §3.3 |
| R-04 | 用户反馈 **0 样本** | **OPEN** | Wave-2 walkthrough |

---

## 7. 证据索引

| 资产 | 路径 |
|------|------|
| **Wave-1 Evidence Pack** | `evidence/ROV_01/wave1-20260608T045822Z/` |
| **Wave-2 Evidence Pack** | `evidence/ROV_01/wave2-20260608T053055Z/` |
| **PRA 统一包（含 Wave-2）** | `evidence/PRODUCTION_READINESS_AUDIT/unified-20260608T053139Z/` |
| Manifest | `…/wave1_manifest.v1.json` |
| 汇总 | `…/WAVE1_EVIDENCE_PACK_SUMMARY.md` |
| 程序蓝图 | [173](./173-ROV-01-Real-Operations-Validation-Program-Blueprint.md) |

---

## 8. 变更 log

| 日期 | Wave | 变更 |
|------|------|------|
| 2026-06-08 | 0 | 立项 · 基线冻结 |
| 2026-06-08 | 1 | **T1–T3 GO** · 32 非 SEED 用户 · Growth 漏斗证据 · metrics v1 |
| 2026-06-08 | 2 | **T4–T5 GO** · Cold Start D3 · CN country market **live** · PRA 统一包 **GO** |
