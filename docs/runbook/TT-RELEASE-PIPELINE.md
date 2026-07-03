# TT-RELEASE-PIPELINE · 发布流程（每次 Production 发布强制）

**Version:** 1.0.0 · **生效：** 2026-07-02  
**机读：** [`registry/release-pipeline.v1.yaml`](../../registry/release-pipeline.v1.yaml)  
**优先级：** 与 [`TT-PROGRAM-MAINLINE-DISCIPLINE.md`](TT-PROGRAM-MAINLINE-DISCIPLINE.md) 同级 · **每次上线必遵**

```text
TT_RELEASE_PIPELINE: ENFORCED
```

---

## 0 · 适用版本

**v1.0 · v1.1 · 及未来所有 Production 发布** — 同一套流程，不得省略门禁。

**一眼总览：** [`TT-TRAVELTRUST-EXECUTIVE-DASHBOARD.md`](TT-TRAVELTRUST-EXECUTIVE-DASHBOARD.md) · **Phase2 = CLOSED**（≠ 整个项目完成）· **主线 = PI3** · **Release Readiness 见 Dashboard**

---

## 1.1 · 毕业门禁治理层级（2026-07-03）

产品侧毕业门禁已全部 **CLOSED**；**NO_GO 不是因为产品/运营/治理**，而是 **Production Engineering + Owner Live Resources** 未齐。

```text
Release Candidate (RC)              CLOSED · CLOSED_UNLESS_TOUCHED
        │
        ▼
Display Governance (DDG)            CLOSED · CLOSED_UNLESS_TOUCHED
        │
        ▼
Official Cold Start Dataset (OCS) CLOSED · CLOSED_UNLESS_TOUCHED
        │
        ▼
Production Infrastructure (PI3)     IN_PROGRESS · Owner Live 待齐
        │  P0: Domain/TLS · Stripe Live · Prod UAT final
        │  P1: Security · Observability · Perf · Go-Live
        │  P2: Mainnet（可选 · 不挡 Sepolia GO）
        ▼
Production GO                       NO_GO
```

**Release Rollup（三态）：** Closed **1** · Interim **2** · Open **2** — [`TT-EXECUTIVE-DASHBOARD-GATE-SEMANTICS.md`](TT-EXECUTIVE-DASHBOARD-GATE-SEMANTICS.md)

| 层级 | 机读键 | 策略 | 状态 | 含义 |
|------|--------|------|------|------|
| RC | `RELEASE_CANDIDATE` | `CLOSED_UNLESS_TOUCHED` | **CLOSED (Evidence Reused)** | 产品候选发布审查 |
| DDG | `STAGING_FULL_SITE_DDG` | `CLOSED_UNLESS_TOUCHED` | **CLOSED (Evidence Reused)** | 展示数据治理 |
| **OCS** | `TT_OFFICIAL_COLD_START_DATASET` | **`CLOSED_UNLESS_TOUCHED`** | **CLOSED (Evidence Reused)** | **官方运营冷启动基线** |
| PI3 | `PRODUCTION_INFRASTRUCTURE` | 每次发布必闭 | IN_PROGRESS | 品牌域名 · Stripe Live · Mainnet |
| GO | `PRODUCTION_GO` | 每次发布必闭 | PENDING (NO_GO) | Release Decision |

**OCS 重跑触发（仅当路径变更或 Rule 3）：** manifest · Campaign 结构 · Official Account 模型 · Public Surface · `data_origin` · Official Ops API。详见 `registry/evidence-reuse-policy.v1.yaml#gates/OFFICIAL_COLD_START_DATASET`。

---

## 1 · 生命周期总览（v1.0 首次交付）

```text
✅ Phase ① Local Development               CLOSED
        │
✅ Phase ② Testnet / Staging              CLOSED
        │
✅ Admin Platform Enterprise Complete     CLOSED
        │
✅ Display Data Governance                PASS
        │
✅ Business Manual UAT                    PASS
        │
✅ Phase①/② Final Convergence            CLOSED (20260702T023014Z)
        │
✅ Production Release Review              CLOSED (20260702T084419Z)
        │
✅ Enterprise Final Acceptance            CLOSED (20260702T090502Z)
        │
✅ Full Test Account E2E                  CLOSED (20260702T100329Z)
        │
✅ Official Cold Start Dataset (OCS)      CLOSED (20260703T044855Z)
        │
────────────────────────────────────
🟡 Phase ③ Production Infrastructure（PI3）← 当前主线 · 永久切换
        │
        ├── PI3-001 Production Database / Backup
        ├── PI3-002 Domain / TLS / CDN
        ├── PI3-003 Stripe Live
        ├── PI3-004 Production Validation
        ├── PI3-005 Mainnet
        └── PI3-006 Go-Live Checklist
        │
        ▼
Production GO
```

---

## 2 · 每次发布固定流程（写死 · 不可跳过）

```text
Product Capability Complete
        │
        ▼
Frontend ↔ API Consistency Audit    ← 每次必跑
        │
        ▼
Display Data Governance          ← 每次必跑
        │
        ▼
Official Cold Start (OCS)        ← CLOSED · 仅触发时重跑 apply
        │
        ▼
Business Manual UAT              ← 每次必跑
        │
        ▼
Production Infrastructure（PI3）
        │
        ▼
Production GO
```

| 门禁 | 首次 v1.0 | v1.1+ / 后续版本 |
|------|-----------|------------------|
| Product Capability Complete | ✅ CLOSED | 确认无回归 |
| **Frontend–API Consistency Audit** | 🟡 API 层已建 | **必跑** · API + Browser |
| Display Data Governance | ✅ PASS | **必跑** |
| Business Manual UAT | ✅ PASS | **必跑** · sign-off 更新 |
| PI3-001～006 | 🟡 IN_PROGRESS | **必闭** · 生产证据更新 |
| Production GO | ⏳ NO-GO | Release Decision |

---

## 2.1 · Evidence Reuse Policy（CLOSED 门禁 · 2026-07-03）

**机读：** [`registry/evidence-reuse-policy.v1.yaml`](../../registry/evidence-reuse-policy.v1.yaml) · `TT_EVIDENCE_REUSE_POLICY: ENFORCED`

### 三层规则（优先级：Rule 3 > Rule 1 触发 > Rule 2 默认）

| Rule | ID | 含义 |
|------|-----|------|
| **Rule 1** | `CLOSED_UNLESS_TOUCHED` | CLOSED Gate 默认不因例行发布而重跑 |
| **Rule 2** | `REUSE_EXISTING_EVIDENCE` | 无触发条件 → 复用最新 evidence，不得 Re-execute |
| **Rule 3** | `INCIDENT_OVERRIDE` | 生产事故 / 安全事件 / 严重回归 / 数据损坏 → **强制**重跑（即使零代码 diff） |

**Rule 3 例外（写死）：**

> A CLOSED gate must be re-executed if a production incident, security event, critical regression, or data integrity issue invalidates the previous evidence, regardless of whether the configured trigger paths changed.

重跑须附 `*-INCIDENT-OVERRIDE-<UTC>.md` sign-off，并链接 incident / postmortem。

### 重跑触发条件（四类 · 避免 “runtime config” 歧义）

| # | 类别 | 检测方式 |
|---|------|----------|
| **1** | **代码路径** (`rerun_when_paths_change`) | 自 latest evidence stamp 起，gate 路径清单 git diff |
| **2** | **部署变更** | staging/prod `api_deploy_id` / `web_deploy_id` 与 evidence 记录不一致 |
| **3** | **运行时配置** | Secrets · 环境变量 · Feature Flag（如 `TRAVELTRUST_SEED_*`、`TRAVELTRUST_SHOW_TEST_DATA`） |
| **4** | **数据模型 / 契约** | migrations · `data_origin` · `public_catalog_only` · API schema / contract 变更 |

### AI / 执行者决策流

```text
Rule 3 — Incident Override?
        │ YES → Re-execute + incident sign-off
        ▼ NO
Gate == CLOSED ?
        │ YES
        ▼
Any trigger category 1–4 since latest evidence?
        │
   ┌────┴────┐
   NO        YES
   │          │
   ▼          ▼
Rule 2     Re-execute
Reuse      + new evidence
Evidence
```

| Gate | 策略 | 状态 | 最新证据（当前） |
|------|------|------|------------------|
| **RC**（PRR / FTAE / EFA） | `CLOSED_UNLESS_TOUCHED` | **CLOSED (Evidence Reused)** | `RELEASE-CANDIDATE-SIGNOFF-20260702T144513Z.md` |
| **Phase12 Final Convergence** | `CLOSED_UNLESS_TOUCHED` | **CLOSED (Evidence Reused)** | `20260702T023014Z` |
| **Market Listings Display Governance** | `CLOSED_UNLESS_TOUCHED` | **CLOSED (Evidence Reused)** | `20260703T013023Z` |
| **Staging Full-Site DDG** | `CLOSED_UNLESS_TOUCHED` | **CLOSED (Evidence Reused)** | `20260703T033727Z` |
| **Official Cold Start Dataset (OCS)** | `CLOSED_UNLESS_TOUCHED` | **CLOSED (Evidence Reused)** | `20260703T044855Z` |
| **Admin 40/40** | `CLOSED_UNLESS_TOUCHED` | **CLOSED (Evidence Reused)** | `20260701T180425Z` |

**仍每次 Production 发布必跑（非 CLOSED_UNLESS_TOUCHED）：** Frontend–API Consistency · Display Data Governance（脚本层）· Business Manual UAT · PI3 · Production GO。

完整路径 / env / deploy 清单见 `registry/evidence-reuse-policy.v1.yaml`。

---

## 3 · 执行入口

### 3.1 Display Data Governance

```bash
bash scripts/dev/run-display-data-governance.sh
API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash scripts/dev/run-display-data-governance.sh
```

Runbook：[`TT-DISPLAY-DATA-GOVERNANCE.md`](TT-DISPLAY-DATA-GOVERNANCE.md)

### 3.2 Business Manual UAT

Runbook：[`TT-BUSINESS-MANUAL-UAT.md`](TT-BUSINESS-MANUAL-UAT.md)

```bash
bash scripts/dev/run-business-manual-uat-probes.sh
API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash scripts/dev/run-business-manual-uat-probes.sh
```

Sign-off：`evidence/manual-uat/signoff/BUSINESS-MANUAL-UAT-SIGNOFF-<UTC>.md`

### 3.3 Full Test Account E2E（一次性封顶 · 20260702T100329Z CLOSED）

Runbook：[`TT-FULL-TEST-ACCOUNT-E2E.md`](TT-FULL-TEST-ACCOUNT-E2E.md)

```bash
bash scripts/dev/run-full-test-account-e2e-validation.sh
```

Sign-off：`evidence/manual-uat/signoff/FTAE-SIGNOFF-20260702T100329Z.md`

### 3.4 Production Infrastructure（PI3）

Runbook：[`PHASE3-PRODUCTION-PREPARATION.md`](PHASE3-PRODUCTION-PREPARATION.md)

---

## 4 · 产品 vs 生产（裁定）

| 维度 | 状态 | 说明 |
|------|------|------|
| **Product Capability** | **Enterprise Complete** | 前端 · 后端 · DB · Admin · Official Ops · Content · 业务流 · 运营场景 · 测试网对齐 · DDG · Business UAT · **Full Test Account E2E** |
| **Production Capability** | **In Progress** | **唯一剩余：Production Engineering（PI3）** |
| **Release Decision** | **NO-GO** | 直至 PI3 全闭 + Go-Live Checklist |
| **Product Defects Open** | **0** | — |
| **Test Automation Issues Open** | **0** | — |
| **Current Mainline** | **PI3 → Production GO** | 不变 |

**纪律：** 不再补页面 · 不再补后台 · 不再补运营功能 — **除非**构成 Production Blocker 或 Security 例外。

---

## 5 · Gate

```bash
bash scripts/gates/check-release-pipeline-ssot.sh
bash scripts/gates/check-release-pipeline-ssot.sh
bash scripts/gates/check-frontend-api-consistency-audit-ssot.sh
bash scripts/gates/check-display-data-governance-ssot.sh
```

---

**TT_RELEASE_PIPELINE: ENFORCED**
