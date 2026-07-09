# 169 · Sprint 168-B Business Expansion Implementation Report

> **Sprint**：168-B · **BE-FRD-01** + **BE-GCM-01 实施**  
> **基线**：[168-A 蓝图](./168-Business-Expansion-Sprint168-BE-FRD01-BE-GCM01-Blueprint.md) · [167 企业差距审计](./167-Business-Expansion-Enterprise-Gap-Audit-Report.md)  
> **纪律**：133 Growth Freeze · 120 Catalog Freeze · **不碰** 链上 GOV · Growth 积分公式 · Catalog 默认切流 · PI3 Production  
> **阶段**：**① 本地**  
> **日期**：2026-06-08  
> **Combined gate**：`bash scripts/dev/run-sprint168-be-frd01-gcm01-implementation-gate.sh`

---

## 1. Executive Verdict

| 轨道 | P0 ID | 裁定 | 企业级（168 目标） |
|------|-------|------|-------------------|
| **Fraud Engine v1** | BE-FRD-01 | **BE_FRD_01_GO** | Auto **72%** · Ops **MEDIUM** · audit **闭环** |
| **Country Market Playbook v1** | BE-GCM-01 | **BE_GCM_01_GO** | 七阶段 SSOT · publish gate · Admin data-only |

**Combined**：`TT_SPRINT168_BE_FRD01_GCM01: IMPLEMENTATION_GO`

---

## 2. BE-FRD-01 交付

| 类别 | 路径 |
|------|------|
| Migration | `crates/api/migrations/20260608120000_sprint168_business_expansion.sql` |
| Engine | `crates/api/src/db/growth_fraud_scan.rs` |
| Internal API | `POST /api/v1/internal/growth/fraud-scan` |
| Register hook | `chain_off/auth.rs` · best-effort |
| Admin API | `GET …/anti-fraud/scan-runs` · `POST …/scan-runs/trigger` |
| Admin UI | `/admin/growth/anti-fraud` · scan-runs section |
| Gate | `scripts/dev/run-sprint168-be-frd01-implementation-gate.sh` |
| Smoke | `scripts/dev/smoke-growth-fraud-scan-p0-local.sh` |

### 2.1 v1 规则（6）

| rule_id | level | action |
|---------|-------|--------|
| register_email_disposable_domain | MEDIUM | signal |
| register_email_alias_burst | MEDIUM | signal |
| register_ip_velocity | HIGH | auto airdrop_ineligible |
| register_wallet_collision | HIGH | auto points_frozen |
| referral_hourly_rate_limit | HIGH | signal（G-S1 同源） |
| referral_self_forbidden | — | bind-time（G-S1） |

### 2.2 验收矩阵

| ID | 结果 |
|----|------|
| FRD-A01 fraud-scan POST + 幂等 | **PASS** |
| FRD-A02 register hook | **PASS** |
| FRD-A03 ≥4 规则 | **PASS** |
| FRD-A04 scan_runs 审计 | **PASS** |
| FRD-A05 Admin scan-runs | **PASS** |

---

## 3. BE-GCM-01 交付

| 类别 | 路径 |
|------|------|
| Migration | `country_market_launches`（同上 migration） |
| DB ops | `crates/api/src/db/country_market_launch_ops.rs` |
| Admin API | `/api/v1/admin/country-market/launches/*` |
| Publish gate | `admin_content_http.rs` · `country_market_gate_blocked` |
| Playbook | `docs/runbook/COUNTRY-MARKET-GO-LIVE-PLAYBOOK.v1.md` |
| Admin UI | `/admin/content/country-market` |
| CN pilot | `evidence/country_market/CN/walkthrough.json` |
| Gate | `scripts/dev/run-sprint168-be-gcm01-implementation-gate.sh` |
| Launch probe | `scripts/dev/run-country-market-launch-gate.sh --iso=CN` |

### 3.1 七阶段

INTAKE → LEGAL → CATALOG → GEO → STEWARD → PUBLISH → LIVE（见 playbook）

### 3.2 验收矩阵

| ID | 结果 |
|----|------|
| GCM-A01 playbook | **PASS** |
| GCM-A02 launches CRUD | **PASS** |
| GCM-A03 checklist + audit | **PASS** |
| GCM-A04 publish gate | **PASS** |
| GCM-A05 Admin UI | **PASS** |
| GCM-A08 CN walkthrough | **PASS**（steward **P1 待补**） |

---

## 4. 167 P0 更新

| ID | 167 前 | 168-B 后 |
|----|--------|----------|
| BE-FRD-01 | NOT_MET | **MET** |
| BE-GCM-01 | NOT_MET | **MET** |

---

## 5. 边界声明

| 未做（刻意） | 原因 |
|--------------|------|
| 链上 GOV 空投 | 133 HOLD |
| Growth 积分公式变更 | G-S8 冻结 |
| `CATALOG_SERVER_GEO_VALIDATION` 默认切换 | 120 冻结 |
| PI3 Production GO | ① 本地实施 |
| BE-GCM-02 steward 全自动 workflow | P1 |

---

## 6. 验证命令

```bash
bash scripts/dev/run-sprint168-be-frd01-gcm01-implementation-gate.sh
bash scripts/dev/run-country-market-launch-gate.sh CN
cargo test -p traveltrust-api growth_fraud_scan country_market_launch_ops
```

---

*169 · Sprint 168-B · Business Expansion Implementation · 2026-06-08*
