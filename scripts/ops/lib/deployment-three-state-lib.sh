#!/usr/bin/env bash
# Deployment 三态治理 · 共享硬闸（SSOT: docs/runbook/TT-DEPLOYMENT-THREE-STATE-GOVERNANCE.md）
#
#   source scripts/ops/lib/deployment-three-state-lib.sh
#   deployment_three_state_assert_fly_allowed
#
# 仅 assert-only 自检：
#   DEPLOYMENT_STATE=sync bash scripts/ops/lib/deployment-three-state-lib.sh assert-only
set -euo pipefail

_DEPLOYMENT_THREE_STATE_SSOT="docs/runbook/TT-DEPLOYMENT-THREE-STATE-GOVERNANCE.md"

deployment_three_state_fail() {
  echo "TT_DEPLOYMENT_THREE_STATE: FAIL $*" >&2
  exit 2
}

deployment_three_state_blocked() {
  echo "TT_DEPLOYMENT_THREE_STATE: BLOCKED $*" >&2
  echo "  SSOT: $_DEPLOYMENT_THREE_STATE_SSOT" >&2
  echo "  entry: bash scripts/ops/run-deployment-three-state.sh <sync|fix|freeze> --help" >&2
  exit 3
}

deployment_three_state_is_valid() {
  case "${DEPLOYMENT_STATE:-}" in
    sync|fix|freeze) return 0 ;;
    *) return 1 ;;
  esac
}

deployment_three_state_assert_declared() {
  deployment_three_state_is_valid \
    || deployment_three_state_blocked "declare DEPLOYMENT_STATE=sync|fix|freeze before deploy (forbidden stateless deploy)"
}

deployment_three_state_assert_no_mixed() {
  deployment_three_state_assert_declared
  local s="${DEPLOYMENT_STATE}"

  if [[ "$s" == "sync" && -n "${FIX_DEPLOY_LEDGER_ID:-}" ]]; then
    deployment_three_state_blocked "mixed mode: sync + FIX_DEPLOY_LEDGER_ID"
  fi
  if [[ "$s" == "fix" && "${DEPLOYMENT_SYNC_ONLY:-}" == "1" ]]; then
    deployment_three_state_blocked "mixed mode: fix + DEPLOYMENT_SYNC_ONLY=1"
  fi
  if [[ "$s" == "freeze" && "${DEPLOYMENT_ALLOW_FLY_DEPLOY:-}" == "1" ]]; then
    deployment_three_state_blocked "mixed mode: freeze + DEPLOYMENT_ALLOW_FLY_DEPLOY"
  fi
  if [[ "$s" == "freeze" && ( "${DO_DEPLOY:-0}" == "1" || "${THROUGH_PARITY_WITH_DEPLOY:-0}" == "1" ) ]]; then
    deployment_three_state_blocked "mixed mode: freeze forbids fly --deploy"
  fi
  if [[ "$s" != "freeze" && "${DO_FREEZE_SOAK:-0}" == "1" ]]; then
    deployment_three_state_blocked "mixed mode: --freeze-soak requires DEPLOYMENT_STATE=freeze"
  fi
  if [[ "$s" == "sync" && "${DO_FREEZE_SOAK:-0}" == "1" ]]; then
    deployment_three_state_blocked "mixed mode: sync + --freeze-soak — run freeze as separate round"
  fi
  if [[ "$s" == "fix" && "${DO_FREEZE_SOAK:-0}" == "1" ]]; then
    deployment_three_state_blocked "mixed mode: fix + --freeze-soak — converge locally then sync/freeze separately"
  fi
}

deployment_three_state_assert_fly_allowed() {
  deployment_three_state_assert_no_mixed
  [[ "${DEPLOYMENT_STATE}" != "freeze" ]] \
    || deployment_three_state_blocked "Freeze Deploy forbids fly redeploy — use run-deployment-three-state.sh freeze --freeze-soak"
}

deployment_three_state_assert_fix_preconditions() {
  deployment_three_state_assert_declared
  [[ "${DEPLOYMENT_STATE}" == "fix" ]] \
    || deployment_three_state_blocked "fix preconditions require DEPLOYMENT_STATE=fix"
  [[ -n "${FIX_DEPLOY_LEDGER_ID:-}" ]] \
    || deployment_three_state_blocked "Fix Deploy requires FIX_DEPLOY_LEDGER_ID=<ledger-id>"

  local root="${DEPLOYMENT_THREE_STATE_ROOT:-}"
  [[ -n "$root" ]] || deployment_three_state_fail "DEPLOYMENT_THREE_STATE_ROOT unset in fix preflight"

  local ledger="$root/registry/complexity-convergence-fix-ledger.v1.yaml"
  [[ -f "$ledger" ]] || deployment_three_state_fail "missing $ledger"

  if [[ "${FIX_DEPLOY_LOCAL_GATE_PASS:-}" == "1" ]]; then
    [[ -n "${FIX_DEPLOY_EVIDENCE_PATH:-}" ]] \
      || deployment_three_state_blocked "FIX_DEPLOY_LOCAL_GATE_PASS=1 requires FIX_DEPLOY_EVIDENCE_PATH"
    return 0
  fi

  python - "$ledger" "${FIX_DEPLOY_LEDGER_ID}" <<'PY' || deployment_three_state_blocked "Fix Deploy ledger item / phase1 gate check failed"
import sys, subprocess, yaml
from pathlib import Path

ledger_path, item_id = sys.argv[1], sys.argv[2]
data = yaml.safe_load(Path(ledger_path).read_text(encoding="utf-8"))
items = {i["id"]: i for i in data.get("items", [])}
item = items.get(item_id)
if not item:
    raise SystemExit(f"unknown FIX_DEPLOY_LEDGER_ID={item_id}")

status = item.get("status", "open")
allowed = {"phase1_closed", "closed", "in_progress"}
if status not in allowed:
    raise SystemExit(f"item {item_id} status={status} — converge locally (phase1_closed) before Fix Deploy")

gate = (item.get("phase1") or {}).get("gate")
if not gate:
    raise SystemExit(f"item {item_id} missing phase1.gate")

print(f"fix-deploy: running phase1 gate for {item_id}: {gate}")
r = subprocess.run(gate, shell=True)
if r.returncode != 0:
    raise SystemExit(f"phase1 gate exit {r.returncode}")
print(f"fix-deploy: phase1 gate PASS for {item_id}")
PY
}

deployment_three_state_write_classification() {
  local root="$1" stamp="$2" evid="$3"
  mkdir -p "$evid"
  node - "$evid/classification.json" "$stamp" "${DEPLOYMENT_STATE}" "${FIX_DEPLOY_LEDGER_ID:-}" "$(git -C "$root" rev-parse HEAD 2>/dev/null || echo unknown)" <<'NODE'
const fs = require('fs');
const [out, stamp, state, ledgerId, sha] = process.argv.slice(2);
const payload = {
  schema: 'traveltrust.deployment_three_state_classification.v1',
  classified_at_utc: new Date().toISOString(),
  stamp,
  deployment_state: state,
  git_sha: sha,
  fix_deploy_ledger_id: ledgerId || null,
  policy: 'single_state_no_mixed_mode',
  ssot: 'docs/runbook/TT-DEPLOYMENT-THREE-STATE-GOVERNANCE.md',
  forbidden: ['stateless_deploy', 'mixed_sync_fix_freeze', 'freeze_fly_redeploy'],
};
fs.writeFileSync(out, JSON.stringify(payload, null, 2) + '\n');
NODE
}

if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]]; then
  export DEPLOYMENT_THREE_STATE_ROOT="${DEPLOYMENT_THREE_STATE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
  case "${1:-assert-only}" in
    assert-only)
      deployment_three_state_assert_declared
      deployment_three_state_assert_no_mixed
      if [[ "${DEPLOYMENT_STATE}" == "fix" ]]; then
        deployment_three_state_assert_fix_preconditions
      fi
      echo "TT_DEPLOYMENT_THREE_STATE: PASS state=${DEPLOYMENT_STATE}"
      ;;
    *)
      deployment_three_state_fail "usage: DEPLOYMENT_STATE=sync|fix|freeze $0 assert-only"
      ;;
  esac
fi
