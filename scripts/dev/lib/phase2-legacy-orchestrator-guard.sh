#!/usr/bin/env bash
# Phase ② · block superseded orchestrators during TESTNET_STAGING_FREEZE (no redeploy)
#
#   source scripts/dev/lib/phase2-legacy-orchestrator-guard.sh
#   phase2_legacy_orchestrator_guard "$ROOT" "$(basename "$0")" || exit $?
#
# Owner override (non-graduation forensics only): LEGACY_ORCHESTRATOR_OK=1
phase2_legacy_orchestrator_guard() {
  local root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
  local script_name="${2:-legacy-orchestrator}"
  local active="$root/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"

  echo "TT_PHASE2_LEGACY_ORCHESTRATOR: SUPERSEDED script=${script_name}" >&2
  echo "  SSOT: bash scripts/dev/run-phase2-graduation-closure-program.sh --status" >&2
  echo "  TL#1前: run-phase-b-daily-maintenance.sh only" >&2
  echo "  freeze: TESTNET_STAGING_FREEZE ACTIVE @ 8dcd304a — no redeploy" >&2
  echo "  override (Owner forensics only): LEGACY_ORCHESTRATOR_OK=1" >&2

  if [[ -f "$active" && "${LEGACY_ORCHESTRATOR_OK:-}" != "1" ]]; then
    echo "BLOCKED: TESTNET_STAGING_FREEZE ACTIVE — legacy orchestrator disabled (exit 2)" >&2
    return 2
  fi
  if [[ "${LEGACY_ORCHESTRATOR_OK:-}" != "1" ]]; then
    echo "BLOCKED: superseded orchestrator — set LEGACY_ORCHESTRATOR_OK=1 to run (not graduation path)" >&2
    return 2
  fi
  echo "WARN: LEGACY_ORCHESTRATOR_OK=1 — proceeding outside graduation SSOT" >&2
  return 0
}
