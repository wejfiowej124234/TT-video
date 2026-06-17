#!/usr/bin/env bash
# Cert #2 completed regression — signoff + vitest IA union (API optional)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || { echo "smoke-cert2-regression: FAIL no session" >&2; exit 1; }
MI="$ROOT/evidence/GO_ttg_cert/${STAMP}/walkthrough/multi-identity"
[[ -f "$MI/MULTI-IDENTITY-WALKTHROUGH-SIGNOFF.json" ]] || { echo "smoke-cert2-regression: FAIL missing signoff" >&2; exit 1; }
export CERT2_SKIP_API="${CERT2_SKIP_API:-1}"
bash "$ROOT/scripts/dev/smoke-cert2-multi-identity-machine-gates.sh"
echo "TT_CERT2_REGRESSION: OK"
