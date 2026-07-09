# Admin Platform 40/40 · Staging Deploy Alignment Checklist

**UTC:** 20260701T174218Z  
**Targets:** `tt-api-staging` · `tt-web-staging`

## Pre-flight

| # | Check |
|---|--------|
| P1 | `fly auth whoami` |
| P2 | `scripts/dev/.env.staging-secrets.local` + `.env.staging-onboarding.local` |
| P3 | `deploy/fly/tt-web-staging/build.env.local` |
| P4 | `export DEPLOYMENT_STATE=sync` |
| P5 | `export DEPLOY_GOVERNANCE_FORCE_RUNTIME=1` |
| P6 | `TESTNET_FREEZE_OVERRIDE=1`（若 staging freeze 激活） |

## Deploy waves

| Wave | Script |
|------|--------|
| W1 API | `bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh` |
| W2 Web | `FLY_WEB_NO_CACHE=1 bash scripts/dev/deploy-tt-web-staging.sh` |

## Post-deploy

| # | Script |
|---|--------|
| V1 | `bash scripts/dev/check-staging-web-alignment.sh` |
| V2 | `bash scripts/dev/smoke-staging-admin-public-operations.sh` |
| V3 | `bash scripts/gates/run-admin-platform-40-verification.sh` |
