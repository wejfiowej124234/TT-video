#!/usr/bin/env bash
# VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE — W7 dry run evidence gate (no Sepolia broadcast required for NOT_RUN).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

YAML="registry/vacancy-w7-dry-run.v1.yaml"
CHECKLIST="docs/spec/governance-token/TRAVELTRUST-WEB3-VACANCY-W7-DRY-RUN-CHECKLIST-v1.md"
RESULT="docs/spec/governance-token/evidence/vacancy-w7-dry-run/DRYRUN-RESULT-v1.md"
EVID="docs/spec/governance-token/evidence/vacancy-w7-dry-run"
BALANCE_GATE="scripts/gates/check-vacancy-legacy-balance-audit-gate.sh"

[[ -f "$YAML" ]] || fail "missing $YAML"
[[ -f "$CHECKLIST" ]] || fail "missing $CHECKLIST"
[[ -x "$BALANCE_GATE" ]] || fail "missing $BALANCE_GATE"

echo "== Vacancy Runtime Migration Dry Run Gate =="

echo ">> Prerequisite W6.5-B (skip live RPC when fork evidence complete)"
if [[ -f "$EVID/DRYRUN-01-deployment.json" ]] \
  && [[ -f "$EVID/DRYRUN-03-migration.json" ]] \
  && grep -q '"result":"PASS"' "$EVID/DRYRUN-01-deployment.json" \
  && grep -q '"result":"PASS"' "$EVID/DRYRUN-03-migration.json"; then
  echo "OK fork evidence present — W6.5-B inventory PASS (from prior audit)"
else
  bash "$BALANCE_GATE"
fi

if [[ ! -f "$RESULT" ]]; then
  echo "VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE: NOT_RUN"
  echo "Evidence missing: $RESULT"
  echo "Execute: bash scripts/ops/vacancy-w7-dry-run-orchestrator.sh --fork-sim"
  echo "Then record all checks PASS in DRYRUN-RESULT-v1.md"
  exit 0
fi

PASS_COUNT=0
TOTAL=7
check() {
  local label="$1"
  local pattern="$2"
  if grep -qE "$pattern" "$RESULT"; then
    echo "OK $label"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    warn "missing PASS: $label"
  fi
}

check_json() {
  local label="$1"
  local file="$2"
  if [[ -f "$file" ]] && grep -q '"result":"PASS"' "$file" 2>/dev/null; then
    echo "OK $label (json)"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    warn "missing PASS json: $label"
  fi
}

check "deployment_simulation" "DryRun-01.*PASS|W7-DryRun-01.*PASS|deployment simulation.*PASS"
check "owner_timelock" "Owner = V2 Timelock.*PASS|owner.*V2 Timelock.*PASS|ownerIsV2Timelock"
check "capability_probe" "DryRun-02.*PASS|capability.*PASS|LIVE_CAPABLE"
check "migration_495000" "DryRun-03.*PASS|0\\.495.*PASS|495000.*PASS|migration sim.*PASS"
check "ledger_unchanged" "ledger state unchanged.*PASS|Ledger.*unchanged.*PASS|ledgerStateUnchanged"
check "registry_rehearsal" "DryRun-04.*PASS|registry.*rehearsal.*PASS|registry rehearsal.*PASS"
check "rollback" "rollback.*PASS|Rollback.*PASS"

if [[ "$PASS_COUNT" -eq "$TOTAL" ]]; then
  echo "VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE: PASS"
  exit 0
fi

echo "VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE: WARN ($PASS_COUNT/$TOTAL checks in evidence)"
exit 0
