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
────────────────────────────────────
🟡 Phase ③ Production Infrastructure（PI3）← 当前主线
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

### 3.3 Production Infrastructure（PI3）

Runbook：[`PHASE3-PRODUCTION-PREPARATION.md`](PHASE3-PRODUCTION-PREPARATION.md)

---

## 4 · 产品 vs 生产（裁定）

| 维度 | 状态 | 说明 |
|------|------|------|
| **Product Capability** | **Enterprise Complete** | 前端 · 后端 · DB · Admin · Official Ops · Content · 业务流 · 运营场景 · 测试网对齐 · DDG · Business UAT |
| **Production Capability** | **In Progress** | **唯一剩余：Production Engineering（PI3）** |
| **Release Decision** | **NO-GO** | 直至 PI3 全闭 + Go-Live Checklist |

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
