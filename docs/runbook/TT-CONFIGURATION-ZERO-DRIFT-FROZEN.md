# TT_CONFIGURATION_ZERO_DRIFT · FROZEN

| Field | Value |
|-------|-------|
| **TT_CONFIGURATION_ZERO_DRIFT** | |
| **STATUS** | **FROZEN** |
| **FROZEN_DATE** | **2026-06-30** |
| **Chapter** | Configuration Zero Drift — **graduated** |

## Machine lines

```
TT_CONFIGURATION_ZERO_DRIFT: FROZEN
TT_CONFIGURATION_ZERO_DRIFT_STATUS: FROZEN
TT_CONFIGURATION_ZERO_DRIFT_FROZEN_DATE: 2026-06-30
```

**No further work unless a new configuration surface is introduced.**

**Binding:** All maintainers and AI agents — **do not** reopen **Configuration Sprint** without unlock (below).

## What ended (do not resume)

```
Configuration → Governance → Convergence   ❌ closed as daily mainline
```

## What replaced it (ACTIVE mainline)

See **[TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md](TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md)** — **验产品**:

```
Manual UAT → Business Defect → Regression → Production Entry Review
    → Testnet Sign-off → Mainnet Preparation
```

## Rules while FROZEN

| Rule | Detail |
|------|--------|
| **CFG registry cap** | **CFG-001～CFG-028** only — **no CFG-029+** without unlock |
| **No Configuration Sprint** | **Permanently closed** unless **new configuration surface** |
| **Config issue after graduation** | **PER Regression** — `DEFECT-NNN` + `REG-NNN` · not CFG sprint |
| **Maintenance only** | `verify-cfg-drift-closure.sh` = regression guard after env/template edits |

## Unlock (new configuration surface only)

1. Document **what new configuration** was introduced and **why** (ADR or `evidence/manual-uat/signoff/`).
2. `TRAVELTRUST_CFG_REGISTRY_UNLOCK=1` for the single registry edit adding **CFG-029+**.
3. Close item · verify PASS · set `chapter_status` back to **FROZEN**.

## SSOT

| Artifact | Path |
|----------|------|
| **Product mainline** | [TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md](TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md) |
| **PER Regression** | [TT-PRODUCTION-ENTRY-REVIEW-REGRESSION.md](TT-PRODUCTION-ENTRY-REVIEW-REGRESSION.md) |
| CFG registry | `evidence/manual-uat/summary/config-drift-registry.json` |
| Freeze signoff | `evidence/manual-uat/signoff/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md` |
| Maintenance verify | `bash scripts/dev/verify-cfg-drift-closure.sh` |
| Dashboard | `evidence/manual-uat/dashboard/PHASE3-READINESS.md` |

## Honest boundary

① Configuration **FROZEN** **≠** ② Testnet Sign-off **≠** ③ Mainnet GO.
