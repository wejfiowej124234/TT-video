# Production Regression Matrix · Sepolia Scope（148 · R-002 / R-003 / 93）

**Recorded:** 20260608  
**Scope SSOT:** [148-PI3-005-Production-Scope-Decision-Report.md](../handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md)  
**Execution SSOT:** [154-PI3-004-Production-Readiness-Verification-Report.md](../handbook/engineering/154-PI3-004-Production-Readiness-Verification-Report.md)  
**R-002 / R-003:** [R-002](../spec/R-002-回归执行闭环与发布准入.md) · [R-003](../spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md) · [93](../spec/93-全站功能验证矩阵-域别回归清单.md)

> **≠ Production GO** — C7 / ISS-007 窄切片 **≠** 全站 prod GO（147 §6.4 · PI3-004）。

---

## 1 · Scope lock

| Key | Value |
|-----|-------|
| `PRODUCTION_SCOPE` | **SEPOLIA** |
| `environment.name` | **`production`** |
| `environment.chain_mode` | **`testnet`** (Sepolia 11155111) |
| `release_gate` GO | **93 §7.1** + `validate-regression-report.py --fail-on-no-go --require-go` |

---

## 2 · Verification matrix

| Plane | Staging baseline | Production target | Gate |
|-------|------------------|-------------------|------|
| **Six domains D1–D6** | `run-staging-uat-six-domains.sh` | `run-production-uat-six-domains.sh` | `verify-pi3-004-six-domain-matrix.sh` |
| **R-003 A+B** | `r003_staging_full_regression.py` | `run-r003-production-regression.sh` | `report.json` GO |
| **CMS / Official (145)** | Ops platform freeze | prod re-run freeze gates | `verify-pi3-004-ops-planes-freeze-matrix.sh` |
| **Growth (133)** | G-S8 freeze | prod flags unchanged | same |
| **Catalog (120/146)** | S5 freeze · staging C-S6 opt-in | prod **`ENABLED=0`** | same |
| **Cold Start (150)** | E2E-A-01 consumer GO | prod public RO API | same |

---

## 3 · report.json 路径

| Stage | Path |
|-------|------|
| **Skeleton（154 交付）** | `evidence/pi3_004_production_readiness_verification/r003-prod-skeleton/report.json` |
| **Owner R-003 prod run** | `evidence/pi3_004_production_readiness_verification/r003-production-<UTC>/report.json` |
| **PI3-004 baseline** | `evidence/pi3_004_production_readiness_verification/baseline_record.v1.json` |

---

## 4 · Owner execution checklist

| Step | Action | Command |
|------|--------|---------|
| 1 | **151** prod 域 + API 可达 | `check-production-web-alignment.sh` |
| 2 | Generate / refresh skeleton | `generate-pi3-004-production-report-skeleton.py` |
| 3 | R-003 production A+B | `run-r003-production-regression.sh` |
| 4 | Six-domain UAT on prod | `run-production-uat-six-domains.sh` |
| 5 | Ops planes matrix | `verify-pi3-004-ops-planes-freeze-matrix.sh` |
| 6 | Validate GO | `validate-regression-report.py … --fail-on-no-go --require-go` |
| 7 | Execution gate → GO | `check-pi3-004-production-readiness-verification-execution.sh` |

**go-live §0.3 四样齐：** report 路径 · sha256 · release_gate + reason · Release Owner 双签

---

## 5 · Gate commands

```bash
bash scripts/check-pi3-004-production-readiness-verification-execution.sh
bash scripts/dev/verify-pi3-004-six-domain-matrix.sh
bash scripts/dev/verify-pi3-004-ops-planes-freeze-matrix.sh
bash scripts/dev/verify-pi3-004-production-report-evidence.sh
python scripts/validate-regression-report.py evidence/pi3_004_production_readiness_verification/r003-prod-skeleton/report.json
```

---

*Maintained by PI3-004 Execution Sprint · 154 · 2026-06-08*
