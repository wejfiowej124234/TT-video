# Mainnet Deployment Package — PREP

**Verdict:** `MAINNET_DEPLOYMENT_PACKAGE_PREP_COMPLETE`  
**Status:** `PREP_NOT_GENERATED` — **does not change any Gate**  
**Stamp:** 2026-07-08T14-11-55

Timelock wait window prep. Final SSOT after `WEB3_FREEZE_PASS`: `generate-mainnet-deployment-package.cjs`.

## Components (8)

| # | Package | Path |
|---|---------|------|
| 1 | Escrow Factory Wave-1 (V2 · V1 FORBIDDEN) | `wave-1-escrow-factory/` |
| 2 | Mainnet Deployment Runbook | `runbook/MAINNET-DEPLOYMENT-EXECUTION-V1.md` |
| 3 | Owner Sign-off Package | `owner-signoff/` |
| 4 | Deployment Manifest (template) | `MANIFEST/manifest.template.json` |
| 5 | Contract Verify Package | `verify/CONTRACT-VERIFY-PACKAGE.md` |
| 6 | Explorer Verify Package | `verify/EXPLORER-VERIFY-PACKAGE.md` |
| 7 | Rollback Package | `rollback/` |
| 8 | Emergency Recovery Package | `emergency-recovery/` |

## After Freeze

```bash
node scripts/dev/generate-mainnet-deployment-package.cjs
```
