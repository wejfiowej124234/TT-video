#!/usr/bin/env bash
# SUPERSEDED · Reliability Closure Mode（② · 不扩维 · 仅证明长期可靠）
#
# **毕业序 SSOT：** `scripts/dev/run-phase2-graduation-closure-program.sh`
# 本脚本保留兼容；顺序已修正为 Soak → TN-P1-010（非 010 先于 soak）。
# TESTNET_STAGING_FREEZE ACTIVE 时默认 exit 2 · Owner 取证：`LEGACY_ORCHESTRATOR_OK=1`
#
#   bash scripts/dev/run-reliability-closure-mode.sh
#   bash scripts/dev/run-reliability-closure-mode.sh --audit-only
#
# 目标硬闸：reconcile_compound_pass=true · missing_projection=0 · P2FC COMPLETED
#           human_uat=PASS · exception_path_verified=PASS（52/52）
#           TT_TESTNET_GRADUATION:CLOSED · TT_PHASE2_L5_COMPOSITE_SCORE:10
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-legacy-orchestrator-guard.sh
source "$ROOT/scripts/dev/lib/phase2-legacy-orchestrator-guard.sh"
phase2_legacy_orchestrator_guard "$ROOT" "$(basename "$0")" || exit $?

AUDIT_ONLY=0
[[ "${1:-}" == "--audit-only" ]] && AUDIT_ONLY=1

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_DIR/COMPLETED.json"

echo "TT_RELIABILITY_CLOSURE_MODE: START $(date -u +%Y%m%dT%H%M%SZ)"
echo "WARN: prefer run-phase2-graduation-closure-program.sh for TL#1→Wave1→Soak→TN-P1-010→HAT-R1"

if [[ "$AUDIT_ONLY" == "0" ]]; then
  echo ""
  echo "== 1/3 TN-P1-009 P2FC 72h soak START (wall-clock) =="
  if [[ ! -f "$COMPLETED" ]]; then
    bash "$ROOT/scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh" || true
  else
    echo "P2FC already COMPLETED at $COMPLETED"
  fi

  echo ""
  echo "== 2/3 TN-P1-010 Indexer/Reconcile (post-soak @ freeze SHA only) =="
  if [[ -f "$COMPLETED" ]]; then
    bash "$ROOT/scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh" || {
      echo "WARN: TN-P1-010 not yet compound clean — continue D6"
    }
  else
    echo "SKIP: TN-P1-010 blocked until $COMPLETED exists"
  fi

  echo ""
  echo "== 3/3 D6 52-surface human + exception path =="
  bash "$ROOT/scripts/dev/record-tn-p1-d6-reliability-surface-staging-evidence.sh" || {
    echo "WARN: D6 reliability surface batch incomplete"
  }
fi

bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh"

echo ""
echo "TT_RELIABILITY_CLOSURE_MODE: DONE"
