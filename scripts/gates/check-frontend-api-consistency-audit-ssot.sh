#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
fail() { echo "FAIL: $*" >&2; exit 1; }
REG="registry/frontend-api-consistency-audit.v1.yaml"
RB="docs/runbook/TT-FRONTEND-API-CONSISTENCY-AUDIT.md"
SCRIPT="scripts/dev/run-frontend-api-consistency-audit.sh"
[[ -f "$REG" ]] || fail "missing $REG"
[[ -f "$RB" ]] || fail "missing $RB"
[[ -f "$SCRIPT" ]] || fail "missing $SCRIPT"
grep -q 'TT_FRONTEND_API_CONSISTENCY_AUDIT: ENFORCED' "$REG" || fail "machine key"
grep -q 'S01_MARKET_GUIDES' "$REG" || fail "S01 surface"
grep -q 'S03_COMMUNITY_FEED' "$REG" || fail "S03 surface"
grep -q 'Frontend ↔ API Consistency Audit' "$RB" || fail "runbook pipeline section"
grep -q 'frontend-api-consistency-audit' "$SCRIPT" || fail "script reference"
echo "PASS: frontend-api-consistency-audit SSOT"
