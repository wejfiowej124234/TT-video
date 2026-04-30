# 96-08 Indexer / Reconciliation / Finance

- run_id: `GO_20260425`
- booklet: `96-08`
- updated_at_utc: `2026-04-25T10:01:39Z`
- status: `PARTIAL_BLOCKED_ENV`

## Executed Runtime Checks
- `bash scripts/check-data-reconcile-projection-gov-gate.sh` (with tokens/secrets):
  - `indexer-reconcile-probe.sh: ok (projection_reconcile_clean)`
  - `b402-min-revenue-e2e-reconcile-smoke.sh: indexer-reconcile HTTP 408`
- `bash scripts/governance-governor-proposal-count-ssot-ops-check.sh` → `HTTP 408`

## Conclusion
- Reconcile probe shows clean projection at internal path, but follow-up admin/governance checks are blocked by 408 timeouts.
- Remaining action: complete same checks in target runtime where admin/overview and dependent reconcile calls return 200.

## Single-Operator Disclosure
This release is signed off by a single operator acting in multiple roles. No independent second-party review was performed.
