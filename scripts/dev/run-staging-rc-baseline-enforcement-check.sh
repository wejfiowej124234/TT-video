#!/usr/bin/env bash
# Read-only · TT_STAGING_RC_BASELINE enforcement check (② Staging live).
#
#   bash scripts/dev/run-staging-rc-baseline-enforcement-check.sh
#   bash scripts/dev/run-staging-rc-baseline-enforcement-check.sh --pre-deploy
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${RC_BASELINE_ENFORCE_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="${RC_BASELINE_EVIDENCE_DIR:-$ROOT/evidence/GO_staging_rc_baseline/enforcement/$STAMP}"
API_BASE="${API_BASE:-${STAGING_API_BASE:-https://tt-api-staging.fly.dev}}"
WEB_BASE="${WEB_BASE:-${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}}"

mkdir -p "$EVID"

# shellcheck source=lib/staging-rc-baseline-gate.sh
source "$ROOT/scripts/dev/lib/staging-rc-baseline-gate.sh"
export STAGING_RC_BASELINE_ROOT="$ROOT"

if [[ "${1:-}" == "--pre-deploy" ]]; then
  staging_rc_baseline_gate_pre_deploy pre-deploy | tee "$EVID/gate.log"
  exit "${PIPESTATUS[0]}"
fi

RC_BASELINE_EVIDENCE_DIR="$EVID" API_BASE="$API_BASE" WEB_BASE="$WEB_BASE" OCS_STATE="${OCS_STATE:-}" \
  node "$ROOT/scripts/dev/validate-staging-rc-baseline-enforcement.cjs" "$EVID" | tee "$EVID/enforce.log"

exit "${PIPESTATUS[0]}"
