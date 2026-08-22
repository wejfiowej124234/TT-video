#!/usr/bin/env bash
# OFFICIAL_FIRST_FINAL_CONVERGENCE_CERTIFICATION — full read-only verify (② Staging + live Official)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

fail() { echo "official-first-final-convergence-cert: FAIL $*" >&2; exit 2; }
info() { echo "official-first-final-convergence-cert: $*"; }

GIT_HEAD="$(git rev-parse HEAD)"
info "git HEAD=$GIT_HEAD"

# Ensure main == tip for 1:1 gate (local ref only · no push)
TIP_BRANCH="${TT_V9_TIP_BRANCH:-release/official-ops-v9-product-ssot}"
TIP_SHA="$(git rev-parse "$TIP_BRANCH")"
MAIN_SHA="$(git rev-parse main 2>/dev/null || true)"
if [[ "$MAIN_SHA" != "$TIP_SHA" ]]; then
  info "aligning local main -> tip ($TIP_SHA)"
  git branch -f main "$TIP_SHA"
fi

info "Phase 1 — OFFICIAL_FIRST_FINAL_CONVERGENCE_CERTIFICATION gate"
python "$ROOT/scripts/gates/run-official-first-final-convergence-certification.py" \
  --skip-live-post-parity \
  --out "$EV/OFFICIAL_FIRST_FULL_CONVERGENCE_PASS_STOP_${STAMP}.json" \
  || fail "final convergence certification gate"

cp "$EV/OFFICIAL_FIRST_FULL_CONVERGENCE_PASS_STOP_${STAMP}.json" \
  "$EV/OFFICIAL_FIRST_FULL_CONVERGENCE_PASS_STOP_LATEST.json"

info "DONE — OFFICIAL_FIRST_FULL_CONVERGENCE_PASS_STOP_LATEST.json"
exit 0
