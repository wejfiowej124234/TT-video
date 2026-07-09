# PI3 · Production Infrastructure Prep Runbook

**生效：** 2026-07-02  
**SSOT Registry：** `registry/phase3-production-infrastructure.v1.yaml`  
**前置：** RC CLOSED · `TT_PRODUCT_CAPABILITY: ENTERPRISE_COMPLETE`  
**不含：** PI3-005（Mainnet scope）· PI3-006（Go-Live cutover）— Owner 闭合 002–004 **live** 后再进入

---

## 0 · 机读键

```text
TT_PI3_PRODUCTION_INFRA_PREP: ACTIVE
TT_PRODUCTION_CAPABILITY: IN_PROGRESS
TT_RELEASE_DECISION: NO_GO
TT_PRODUCT_DEVELOPMENT_FREEZE: ENFORCED
```

---

## 1 · 依赖顺序（强制）

```text
PI3-002  Domain / TLS / CDN / CORS / Fly prod apps
    ↓
PI3-001  Production PostgreSQL backup (B-475)
    ↓
PI3-003  Stripe Live (depends prod API domain)
    ↓
PI3-004  Production validation (R-003 + six-domain UAT)
    ↓
[defer] PI3-005 Mainnet scope decision
    ↓
[defer] PI3-006 Go-Live checklist + cutover
```

---

## 2 · 一键编排（Execution prep）

```bash
bash scripts/dev/run-pi3-production-infra-prep.sh
```

产出：`evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-infra-prep-<UTC>/`

| 步骤 | Gate | 预期（无 Owner 域名时） |
|------|------|-------------------------|
| PI3-002 | `check-pi3-002-production-domain-tls-cdn-cors-execution.sh` | **PI3-002_HOLD** |
| PI3-001 | `check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh` | **PI3-001_HOLD** |
| PI3-003 | `check-pi3-003-stripe-live-production-webhook-execution.sh` | **PI3-003_HOLD** |
| PI3-004 | `check-pi3-004-production-readiness-verification-execution.sh` | **PI3-004_HOLD** |

**HOLD ≠ 失败：** 表示执行程序与静态 SSOT 已就绪，等待 Owner 填实生产资源。

---

## 3 · Owner live 闭合后复跑

填实 `PROD_WEB_BASE` / `PROD_API_BASE` 与各 `.env.production.local` 后：

```bash
export PROD_WEB_BASE=https://app.<brand-domain>
export PROD_API_BASE=https://api.<brand-domain>

bash scripts/check-pi3-002-production-domain-tls-cdn-cors-execution.sh
bash scripts/dev/enable-fly-pg-backup.sh tt-traveltrust-prod
bash scripts/dev/run-phase3-db-restore-drill-prod.sh
bash scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh
bash scripts/dev/register-stripe-live-webhook-prod.sh
bash scripts/dev/smoke-stripe-live-webhook-prod.sh
bash scripts/check-pi3-003-stripe-live-production-webhook-execution.sh
bash scripts/dev/run-r003-production-regression.sh
bash scripts/dev/run-production-uat-six-domains.sh
bash scripts/check-pi3-004-production-readiness-verification-execution.sh
```

---

## 4 · SSOT gate

```bash
bash scripts/gates/check-phase3-production-infrastructure-ssot.sh
```

---

## 5 · 与 Production GO 关系

| 审计 | 用途 |
|------|------|
| `run-phase3-production-go-audit.sh` | 跟踪 PI3 代理项 · **仍为 NO_GO** 直至 live 闭合 |
| `check-go-no-go.sh` | CI/发布 hint · **非** Production GO 替身 |

**Production GO 条件：** 002–004 全 **GO** → 再 PI3-005 scope → PI3-006 → 复审计 **BLOCKER=0** → `TT_RELEASE_DECISION: GO`

---

## 6 · 参考

- Owner 最小配置：`docs/runbook/PI3-OWNER-MINIMAL-CONFIG-CHECKLIST.md`
- Phase3 总轨：`docs/runbook/PHASE3-PRODUCTION-PREPARATION.md`
- 148 scope（默认 Sepolia）：`docs/handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md`
