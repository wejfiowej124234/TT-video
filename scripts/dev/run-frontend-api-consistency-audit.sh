#!/usr/bin/env bash
# Enterprise Frontend–API Consistency Audit
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
ENV_LABEL="${ENV_LABEL:-auto}"
[[ "$ENV_LABEL" == "auto" ]] && { [[ "$API" == *staging* ]] && ENV_LABEL=staging || ENV_LABEL=local; }

fail() { echo "frontend-api-consistency-audit: FAIL [$ENV_LABEL] $*" >&2; exit 1; }
log() { echo "frontend-api-consistency-audit: [$ENV_LABEL] $*"; }

curl -sS -m 10 "$API/health" >/dev/null || fail "API not reachable $API"

UTC=$(date -u +%Y%m%dT%H%M%SZ)
EVID="${EVIDENCE_JSON:-$ROOT/evidence/GO_frontend_api_consistency_audit/${ENV_LABEL}_${UTC}/audit-report.json}"
mkdir -p "$(dirname "$EVID")"

env API="$API" ENV_LABEL="$ENV_LABEL" EVIDENCE_JSON="$EVID" \
  node "$ROOT/scripts/dev/frontend-api-consistency-audit.cjs"

log "report $EVID"
log "exit 0"
