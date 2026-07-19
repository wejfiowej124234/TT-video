#!/usr/bin/env bash
# V3.1.1 Clean Sepolia · cutover ACTIVE baseline → v311_sepolia_clean_baseline
# Does NOT close T-04/T-05/DEP-01/R-01 (needs Full Alignment PASS).
# Does NOT delete gov_freeze_v2 evidence; marks pending SUPERSEDED only after Owner confirm.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID_ROOT="$ROOT/evidence/GO_phase2_v311_sepolia_clean_baseline"
REGISTRY="$ROOT/registry/protocol-convergence-deployments.v1.yaml"
MATRIX="$ROOT/registry/web3-active-execution-matrix.v1.yaml"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$EVID_ROOT/cutover/${STAMP}"

fail() { echo "apply-v311-sepolia-clean-cutover: FAIL $*" >&2; exit 2; }
ok() { echo "apply-v311-sepolia-clean-cutover: OK $*"; }

EVID_APPEND=""
if [[ -f "$EVID_ROOT/latest-stamp.txt" ]]; then
  LSTAMP="$(tr -d '\r\n' < "$EVID_ROOT/latest-stamp.txt")"
  EVID_APPEND="$EVID_ROOT/${LSTAMP}/phase2-env-append-${LSTAMP}.env"
fi
if [[ -z "$EVID_APPEND" || ! -f "$EVID_APPEND" ]]; then
  EVID_APPEND="$(ls -t "$EVID_ROOT"/*/phase2-env-append-*.env 2>/dev/null | head -1 || true)"
fi
[[ -f "$EVID_APPEND" ]] || fail "missing phase2-env-append (run phase2-sepolia-broadcast-v311-clean-baseline.sh first)"
[[ -f "$REGISTRY" ]] || fail "missing $REGISTRY"

mkdir -p "$EVID"
cp "$EVID_APPEND" "$EVID/"

# shellcheck disable=SC1090
set -a
# load append
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "$line"
done < "$EVID_APPEND"
set +a

[[ -n "${V311_TIMELOCK_ADDRESS:-}" ]] || fail "V311_TIMELOCK_ADDRESS"
[[ -n "${V311_TREASURY_P4_CAP_ADDRESS:-}" ]] || fail "V311_TREASURY_P4_CAP_ADDRESS"
[[ -n "${V311_PRIMARY_MARKET_ADDRESS:-}" ]] || fail "V311_PRIMARY_MARKET_ADDRESS"
[[ "${TREASURY_USDC_SINK_ADDRESS:-}" == "${V311_TREASURY_P4_CAP_ADDRESS}" ]] \
  || fail "cutover sink must equal P4Cap"

PY="python"
if ! command -v python >/dev/null 2>&1; then
  if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
    PY="python3"
  else
    fail "python required"
  fi
fi
# Prefer real CPython over WindowsApps python3 stub (exit 49)
if command -v python >/dev/null 2>&1; then
  PY="python"
fi

export ROOT REGISTRY MATRIX EVID STAMP
export V311_TIMELOCK_ADDRESS V311_GOVERNOR_ADDRESS V311_TREASURY_P4_CAP_ADDRESS
export V311_PRIMARY_MARKET_ADDRESS V311_SEAT_REGISTRY_ADDRESS V311_STAKE_POOL_PROXY_ADDRESS
export GOVERNANCE_TOKEN_ADDRESS LEGACY_GOVERNANCE_TOKEN_ADDRESS V311_SEPOLIA_CLEAN_BASELINE_STAMP
export EVID_APPEND
export TREASURY_USDC_SINK_ADDRESS

"$PY" "$ROOT/scripts/dev/apply-v311-sepolia-clean-cutover.py"

ok "cutover wrote ACTIVE=v311_sepolia_clean_baseline"
echo "NEXT: Full Constitution Re-Alignment · then close gaps · refresh PSG/Git baseline"
echo "FORBIDDEN: delete historical Evidence under GO_phase2_gov_freeze_v2_* or PHASE-B-*"
