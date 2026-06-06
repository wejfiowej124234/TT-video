#!/usr/bin/env bash
# Phase 2.5 · Coverage Hardening — run all five high-risk write-path staging smokes
#
#   bash scripts/dev/run-phase25-coverage-hardening-staging.sh
#
# Env:
#   STAGING_API_BASE (default https://tt-api-staging.fly.dev)
#   PHASE25_OUT (evidence dir; default evidence/.../phase25-coverage-hardening/<stamp>)
#   PHASE25_SKIP_H3=1  — skip Stripe (no whsec locally)
#   PHASE25_SKIP_H4_DB=1 — skip ADM-U02 even if DATABASE_URL set
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE25_OUT:-$ROOT/evidence/GO_phase2_testnet_20260526/phase25-coverage-hardening/${STAMP}}"
mkdir -p "$OUT"

export STAGING_API_BASE="$API"
export PHASE25_OUT="$OUT"

echo "run-phase25-coverage-hardening: API=${API} OUT=${OUT}"

run_slice() {
  local id="$1" script="$2"
  local log="$OUT/${id}-run.log"
  echo "--- ${id} ---" | tee -a "$OUT/run.log"
    if bash "$ROOT/scripts/dev/${script}" 2>&1 | tee "$log"; then
    echo "${id}:PASS" >> "$OUT/slices.txt"
    return 0
  else
    echo "${id}:FAIL" >> "$OUT/slices.txt"
    return 1
  fi
}

FAIL=0
H1=0 H2=0 H3=0 H4=0 H5=0
run_slice CH-H01 smoke-phase25-h1-escrow-intent-dispute-staging.sh && H1=1 || FAIL=$((FAIL + 1))
run_slice CH-H02 smoke-phase25-h2-acquisition-fulfillment-staging.sh && H2=1 || FAIL=$((FAIL + 1))

if [[ "${PHASE25_SKIP_H3:-0}" != "1" ]]; then
  run_slice CH-H03 smoke-phase25-h3-stripe-webhook-exceptions-staging.sh && H3=1 || FAIL=$((FAIL + 1))
else
  echo "CH-H03:SKIP" >> "$OUT/slices.txt"
fi

if [[ "${PHASE25_SKIP_H4_DB:-0}" == "1" ]]; then
  unset STAGING_DATABASE_URL || true
fi
run_slice CH-H04 smoke-phase25-h4-session-wallet-2fa-staging.sh && H4=1 || FAIL=$((FAIL + 1))

run_slice CH-H05 smoke-phase25-h5-chain-write-staging.sh && H5=1 || FAIL=$((FAIL + 1))

python "$ROOT/scripts/dev/record-phase25-coverage-hardening-report.py" \
  --out "$OUT" --api-base "$API" --fail-count "$FAIL" || true

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/GO_phase2_testnet_20260526/phase25-coverage-hardening/latest" 2>/dev/null || true

# Hardening bundle: allow PARTIAL when only optional slices fail (H5 RPC warn handled inside script)
if [[ "$FAIL" -gt 0 ]]; then
  echo "run-phase25-coverage-hardening: FAIL slices=${FAIL} (see ${OUT})" >&2
  exit 1
fi
echo "run-phase25-coverage-hardening: OK · ${OUT} · ≠ Production GO · TT_PHASE2_GO_VERDICT unchanged"
exit 0
