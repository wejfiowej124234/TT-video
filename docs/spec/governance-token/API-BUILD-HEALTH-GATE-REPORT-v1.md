# API Build Health Gate Report v1

**Generated:** 2026-07-09T04:08:44Z
**Gate:** `bash scripts/gates/check-api-build-health-gate.sh`
**Result:** `API_BUILD_HEALTH: PASS`
**SSOT:** `registry/api-build-health.v1.yaml`

## Layer matrix

| Layer | Status | Command |
|-------|--------|---------|
| Vacancy indexer lib | **PASS** | `cargo test -p traveltrust-api --lib` |
| traveltrust-api binary | **KNOWN_DEBT** | `cargo check -p traveltrust-api --bin traveltrust-api` |

> **Honest boundary:** Vacancy Ledger gates (W3/W4) validate **lib + route logic + frontend**.
> Full API binary compile debt is **unrelated** and tracked here — do not conflate with `WEB3_VACANCY_INDEXER_RECONCILE`.

Binary errors (count): **46**

## Vacancy gates isolated

- `WEB3_VACANCY_INDEXER_RECONCILE`
- `VACANCY_DEPLOYMENT_READINESS`
- W4a Governance Transparency
- W4b Protocol Operations Console
