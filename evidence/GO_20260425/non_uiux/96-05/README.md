# 96-05 SRE / Reliability

- run_id: `GO_20260425`
- booklet: `96-05`
- updated_at_utc: `2026-04-25T10:01:39Z`
- status: `PARTIAL_BLOCKED_ENV`

## Executed Runtime Checks
- `bash scripts/check-indexer-lag-locate-gate.sh` with ADMIN_BEARER_TOKEN + INTERNAL_API_SECRET → `HTTP meta=408 internal=200 admin_health=200`
- `bash scripts/governance-governor-proposal-count-ssot-ops-check.sh` with ADMIN_BEARER_TOKEN → `HTTP 408`

## Conclusion
- Internal probe path is reachable (`internal` 200), but admin/meta surfaces time out at current API runtime timeout (408).
- Remaining action: run with target-env runtime settings where `/meta` and `/api/v1/admin/observability/overview` return 200.

## Single-Operator Disclosure
This release is signed off by a single operator acting in multiple roles. No independent second-party review was performed.
