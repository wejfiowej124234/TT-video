#!/usr/bin/env bash
# Phase ② Open 项收口扫描（② · 不触链 · 不冒充 GO）
#
#   bash scripts/dev/run-phase2-open-items-closure-scan.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_open_burn_down/${STAMP}"
mkdir -p "$EVID"

{
  echo "TT_PHASE2_OPEN_BURN_DOWN_SCAN: stamp=${STAMP} phase=②"
  echo "== probe =="
  bash "$ROOT/scripts/dev/probe-phase-b-timelock-countdown.sh" || true
  echo "== post-change (paths) =="
  bash "$ROOT/scripts/dev/run-ttg-governance-cert-post-change-gate.sh" --check-paths-only || true
  echo "== registry =="
  python "$ROOT/scripts/dev/validate-ttg-governance-cert-gates-registry.py" || true
  python "$ROOT/scripts/dev/assert-ttg-stats-triple-sync.py" || true
  echo "== closing gap status =="
  if [[ -f "$ROOT/evidence/GO_phase2_testnet_20260526/closing-gap/STATUS.txt" ]]; then
    tail -3 "$ROOT/evidence/GO_phase2_testnet_20260526/closing-gap/STATUS.txt"
  fi
  echo "TT_PHASE2_OPEN_BURN_DOWN: REMAINING=TIME+HUMAN+SOAK+WALLET"
  echo "  ssot=docs/runbook/PHASE2-OPEN-ITEMS-BURN-DOWN.md"
} | tee "$EVID/scan.log"

ln -sfn "$EVID" "$ROOT/evidence/GO_phase2_open_burn_down/latest" 2>/dev/null || \
  echo "$STAMP" >"$ROOT/evidence/GO_phase2_open_burn_down/latest-stamp.txt"

echo "TT_PHASE2_OPEN_BURN_DOWN_SCAN: OK log=$EVID/scan.log"
