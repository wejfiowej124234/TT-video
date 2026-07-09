#!/usr/bin/env bash
# TT_STAGING_RC_BASELINE · pre/post deploy gate (② Staging only)
# SSOT: registry/staging-rc-baseline.v1.yaml
#
#   source scripts/dev/lib/staging-rc-baseline-gate.sh
#   staging_rc_baseline_gate_pre_deploy
set -euo pipefail

_staging_rc_baseline_gate_root() {
  if [[ -n "${STAGING_RC_BASELINE_ROOT:-}" ]]; then
    echo "$STAGING_RC_BASELINE_ROOT"
  else
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
  fi
}

staging_rc_baseline_gate_skip() {
  [[ "${TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE:-}" == "1" ]] && return 0
  [[ "${STAGING_RC_BASELINE_ALIGNING:-}" == "1" ]] && return 0
  [[ "${SKIP_STAGING_RC_BASELINE_GATE:-}" == "1" ]] && return 0
  return 1
}

staging_rc_baseline_gate_pre_deploy() {
  staging_rc_baseline_gate_enforce "pre-deploy" "$@"
}

staging_rc_baseline_gate_post_deploy() {
  staging_rc_baseline_gate_enforce "post-deploy" "$@"
}

staging_rc_baseline_gate_pre_change() {
  staging_rc_baseline_gate_enforce "pre-change" "$@"
}

staging_rc_baseline_gate_post_change() {
  staging_rc_baseline_gate_enforce "post-change" "$@"
}

staging_rc_baseline_gate_enforce() {
  local mode="${1:-enforce}"
  shift || true
  local root
  root="$(_staging_rc_baseline_gate_root)"

  if staging_rc_baseline_gate_skip; then
    echo "staging-rc-baseline-gate: SKIP ($mode · override/aligning/skip env)"
    return 0
  fi

  echo "staging-rc-baseline-gate: enforce $mode (SSOT registry/staging-rc-baseline.v1.yaml)"
  API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}" \
  WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}" \
    node "$root/scripts/dev/validate-staging-rc-baseline-enforcement.cjs" "$@" \
    || {
      echo "staging-rc-baseline-gate: BLOCKED — Staging drift vs TT_STAGING_RC_BASELINE ($mode)" >&2
      echo "  realign: bash scripts/dev/run-staging-rc-baseline-final-alignment.sh" >&2
      echo "  override (Owner only): TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1" >&2
      return 2
    }
  echo "staging-rc-baseline-gate: OK $mode"
}
