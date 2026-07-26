# PCR-20260726-BATCH13-FP-A-D-STAGING-DEPLOY

**Stamp:** `20260726T083000Z`  
**Class:** non_financial_ui_staging_patch · **Patch:** `PATCH-STG-017`  
**Tip:** `ea71c577…` **cite-only / immobile**  
**Pin:** `PSG-REL-20260720-WEB3-CAND-V2`

## Owner command

Deploy Batch-13 **FP-A～D** to Staging → confirm FP markers **8/8** → restore SuperAdmin probe → re-run B13-06′～14′.

## LOCK (unchanged)

| Item | Status |
|------|--------|
| tip | immobile |
| Hard Gate | LOCKED |
| Cutover | LOCKED |
| `TT_PRODUCTION_GO` | NO_GO |
| `FINANCE_WRITE` | FORBIDDEN |
| HU-495 / 487 / 490 | **remain OPEN** (no early close) |

## Deploy

- Target: `DEPLOY_TARGET=STAGING_PATCH`
- Apps: `tt-web-staging` (+ `tt-api-staging` if capability fields required)
- Probe: `node scripts/dev/probe-batch13-fp-e-staging.cjs`
- SuperAdmin: `bash scripts/dev/bootstrap-staging-super-admin.sh <email>` or seed promote

## JSON

[`PCR-20260726-BATCH13-FP-A-D-STAGING-DEPLOY.json`](./PCR-20260726-BATCH13-FP-A-D-STAGING-DEPLOY.json)
