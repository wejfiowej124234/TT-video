# API Build Health Gate Report v1

**Generated:** 2026-07-10T06:05:04Z
**Gate:** `bash scripts/gates/check-api-build-health-gate.sh`
**Result:** `API_BUILD_HEALTH: PASS`
**SSOT:** `registry/api-build-health.v1.yaml`

## Layer matrix

| Layer | Status | Command |
|-------|--------|---------|
| Vacancy indexer lib | **PASS** | `cargo test -p traveltrust-api --lib` |
| traveltrust-api binary | **PASS** | `cargo check -p traveltrust-api --bin traveltrust-api` |

## Vacancy gates isolated

- `WEB3_VACANCY_INDEXER_RECONCILE`
- `VACANCY_DEPLOYMENT_READINESS`
- W4a Governance Transparency
- W4b Protocol Operations Console
