# Canonical Deploy Entry (ONLY)

**Rule:** Only wrappers under `scripts/deploy/*.sh` may deploy.

Bare `fly deploy` / `forge script … --broadcast` outside these wrappers =
**INVALID RELEASE ACTION**.

Each wrapper sets:

- `TT_CANONICAL_DEPLOY=1`
- `TT_ARTIFACT_SHA` (git HEAD)
- attestation env (`TRAVELTRUST_PSG_RELEASE_VERSION`, `TRAVELTRUST_GIT_SHA`, …)
- then runs Identity → PSG Version Gate **STRICT** → Freshness → underlying deploy script

## Commands

| Intent | Wrapper |
|--------|---------|
| Staging Web | `bash scripts/deploy/staging-web.sh` |
| Staging API | `bash scripts/deploy/staging-api.sh` |
| Staging both | `bash scripts/deploy/staging-all.sh` |
| Sepolia governance broadcast | `bash scripts/deploy/sepolia-governance-broadcast.sh` (still needs Owner OK env) |
| **Closure Prep (no deploy)** | `bash scripts/deploy/promotion-prep.sh` |
| Bare-deploy policy check | `python scripts/dev/run-psg-bare-deploy-ban.py` |

## FG-15

Do **not** run deploy wrappers until `FG15_ELAPSED=1` + Owner authorization.
Capability land only: gates, `/meta` identity, scanners, dry-run.

SSOT: `docs/runbook/TT-PSG-RUNTIME-ATTESTATION-LATEST.md`
