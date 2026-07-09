#!/usr/bin/env bash
# Phase③ deploy governance — block S5/S6 when diff since frozen runtime baseline
# is evidence/runbook/governance/local-dev only (Phase② CLOSED · no reopen).
#
# SSOT: evidence/GO_phase3_production_entry_review/DEPLOY-GOVERNANCE-RUNTIME-BASELINE.v1.json
#
#   deploy_governance_phase3_assert_s5_allowed [repo_root]
#   deploy_governance_phase3_assert_s6_allowed [repo_root] [expect_sha]
#
# Escape hatches (Owner-only · log reason):
#   DEPLOY_GOVERNANCE_FORCE_RUNTIME=1   — explicit runtime/config deploy intent
#   DEPLOY_GOVERNANCE_SKIP_GUARD=1      — break-glass (discouraged)
set -euo pipefail

deploy_governance_baseline_json() {
  local root="${1:?}"
  echo "$root/evidence/GO_phase3_production_entry_review/DEPLOY-GOVERNANCE-RUNTIME-BASELINE.v1.json"
}

deploy_governance_read_baseline_sha() {
  local root="$1"
  local j
  j="$(deploy_governance_baseline_json "$root")"
  [[ -f "$j" ]] || return 1
  python -c "import json,sys; print(json.load(open(sys.argv[1]))['runtime_baseline_sha'])" "$j"
}

deploy_governance_classify_scope() {
  local root="$1" baseline="$2" head="$3"
  PYTHONIOENCODING=utf-8 python "$root/scripts/dev/classify-deploy-change-scope.py" \
    --repo-root "$root" \
    --baseline-sha "$baseline" \
    --head-sha "$head"
}

deploy_governance_phase3_blocked() {
  echo "deploy-governance-phase3: BLOCKED $*" >&2
  echo "  Runtime Baseline = FROZEN ASSET (@ DEPLOY-GOVERNANCE-RUNTIME-BASELINE.v1.json)." >&2
  echo "  Baseline mutation only: runtime change → S5 → S6 PASS → baseline record update." >&2
  echo "  Never mutates: docs · evidence · runbook · hygiene · manual · mainnet prep." >&2
  echo "  To start chain: commit staging_runtime paths, then:" >&2
  echo "    export DEPLOY_GOVERNANCE_FORCE_RUNTIME=1 DEPLOYMENT_STATE=sync TESTNET_FREEZE_OVERRIDE=1" >&2
  echo "    bash scripts/ops/run-deployment-three-state.sh sync --through-parity" >&2
  exit 2
}

deploy_governance_phase3_assert_s5_allowed() {
  local root="${1:-${DEPLOYMENT_THREE_STATE_ROOT:-${ROOT:-}}}"
  [[ -n "$root" ]] || deploy_governance_phase3_blocked "missing repo root"

  if [[ "${DEPLOY_GOVERNANCE_SKIP_GUARD:-}" == "1" ]]; then
    echo "deploy-governance-phase3: WARN DEPLOY_GOVERNANCE_SKIP_GUARD=1" >&2
    return 0
  fi
  if [[ "${1:-}" == "--secrets-only" || "${DEPLOY_SECRETS_ONLY:-}" == "1" ]]; then
    echo "deploy-governance-phase3: OK secrets-only (no image redeploy gate)"
    return 0
  fi

  local baseline head scope_json scope s5_req
  baseline="$(deploy_governance_read_baseline_sha "$root" 2>/dev/null || true)"
  if [[ -z "$baseline" ]]; then
    echo "deploy-governance-phase3: WARN baseline JSON missing — guard skipped" >&2
    return 0
  fi

  head="$(git -C "$root" rev-parse HEAD)"
  if [[ "$head" == "$baseline" ]]; then
    echo "deploy-governance-phase3: OK head matches runtime baseline ${head:0:8}"
    return 0
  fi

  if [[ "${DEPLOY_GOVERNANCE_FORCE_RUNTIME:-}" == "1" ]]; then
    echo "deploy-governance-phase3: OK DEPLOY_GOVERNANCE_FORCE_RUNTIME=1 @ head ${head:0:8}" >&2
    return 0
  fi

  scope_json="$(deploy_governance_classify_scope "$root" "$baseline" "$head")"
  scope="$(echo "$scope_json" | python -c "import json,sys; print(json.load(sys.stdin)['scope'])")"
  s5_req="$(echo "$scope_json" | python -c "import json,sys; print('yes' if json.load(sys.stdin)['s5_required'] else 'no')")"

  echo "deploy-governance-phase3: baseline=${baseline:0:8} head=${head:0:8} scope=${scope} s5_required=${s5_req}"

  if [[ "$s5_req" == "no" ]]; then
    deploy_governance_phase3_blocked \
      "change scope=${scope} since frozen baseline — not a staging runtime deploy"
  fi
  echo "deploy-governance-phase3: OK staging runtime change detected"
}

deploy_governance_phase3_assert_s6_allowed() {
  local root="${1:-${DEPLOYMENT_THREE_STATE_ROOT:-${ROOT:-}}}"
  local expect_sha="${2:-${PHASE2_EXPECT_GIT_SHA:-}}"
  [[ -n "$root" ]] || deploy_governance_phase3_blocked "missing repo root"

  if [[ "${DEPLOY_GOVERNANCE_SKIP_GUARD:-}" == "1" ]]; then
    return 0
  fi

  local baseline
  baseline="$(deploy_governance_read_baseline_sha "$root" 2>/dev/null || true)"
  [[ -n "$baseline" ]] || return 0

  local head
  head="$(git -C "$root" rev-parse HEAD)"

  if [[ -n "$expect_sha" && "$expect_sha" == "$baseline" && "$head" != "$baseline" ]]; then
    echo "deploy-governance-phase3: OK S6 pinned to baseline ${baseline:0:8} (HEAD ahead evidence-only)"
    return 0
  fi

  if [[ "$head" == "$baseline" ]]; then
    return 0
  fi

  local scope_json s5_req
  scope_json="$(deploy_governance_classify_scope "$root" "$baseline" "$head")"
  s5_req="$(echo "$scope_json" | python -c "import json,sys; print('yes' if json.load(sys.stdin)['s5_required'] else 'no')")"

  if [[ "$s5_req" == "no" && "${DEPLOY_GOVERNANCE_FORCE_RUNTIME:-}" != "1" ]]; then
    deploy_governance_phase3_blocked \
      "S6 against HEAD ${head:0:8} but only evidence/docs changed — use PHASE2_EXPECT_GIT_SHA=${baseline:0:8} or deploy runtime first"
  fi
}
