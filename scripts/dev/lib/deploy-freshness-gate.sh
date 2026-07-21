#!/usr/bin/env bash
# Deploy Freshness Gate · source from any Staging / Web3 companion deploy script.
# SSOT: docs/runbook/TT-PSG-DEPLOY-FRESHNESS-GATE-LATEST.md
# Identity: docs/runbook/TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST.md
# PSG Version: docs/runbook/TT-PSG-RELEASE-SOURCE-OF-TRUTH-LATEST.md
#
#   source scripts/dev/lib/deploy-freshness-gate.sh
#   deploy_freshness_gate_pre_deploy web   # or api | all | web3
#   deploy_freshness_gate_post_deploy all
#
# Pre-deploy order: Identity → PSG Version Gate → Freshness
set -euo pipefail

_deploy_freshness_gate_root() {
  if [[ -n "${DEPLOY_FRESHNESS_ROOT:-}" ]]; then
    echo "$DEPLOY_FRESHNESS_ROOT"
  else
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
  fi
}

deploy_freshness_gate_skip() {
  [[ "${TRAVELTRUST_DEPLOY_FRESHNESS_OVERRIDE:-}" == "1" ]] && return 0
  [[ "${SKIP_DEPLOY_FRESHNESS_GATE:-}" == "1" ]] && return 0
  return 1
}

deployment_identity_gate_skip() {
  [[ "${TRAVELTRUST_DEPLOY_IDENTITY_OVERRIDE:-}" == "1" ]] && return 0
  [[ "${SKIP_DEPLOYMENT_IDENTITY_GATE:-}" == "1" ]] && return 0
  return 1
}

psg_version_gate_skip() {
  [[ "${TRAVELTRUST_PSG_VERSION_OVERRIDE:-}" == "1" ]] && return 0
  [[ "${SKIP_PSG_VERSION_GATE:-}" == "1" ]] && return 0
  return 1
}

deployment_identity_gate_enforce() {
  local mode="${1:-pre-deploy}"
  local root
  root="$(_deploy_freshness_gate_root)"

  if deployment_identity_gate_skip; then
    echo "deployment-identity-gate: SKIP ($mode · override/skip env)"
    return 0
  fi

  echo "deployment-identity-gate: enforce $mode DEPLOY_TARGET=${DEPLOY_TARGET:-"(missing)"}"
  python "$root/scripts/dev/run-deployment-identity-gate.py" --mode "$mode" \
    || {
      echo "deployment-identity-gate: BLOCKED — declare DEPLOY_TARGET and answer identity questions" >&2
      echo "  CERTIFICATION_FREEZE | STAGING_PATCH | EXPERIMENT" >&2
      echo "  STAGING_PATCH requires TT_STAGING_PATCH_IDS=PATCH-STG-…" >&2
      echo "  SSOT: docs/runbook/TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST.md" >&2
      return 2
    }
}

psg_version_gate_enforce() {
  local mode="${1:-pre-deploy}"
  local root
  root="$(_deploy_freshness_gate_root)"

  if psg_version_gate_skip; then
    echo "psg-version-gate: SKIP ($mode · override/skip env)"
    return 0
  fi

  echo "psg-version-gate: enforce $mode STRICT (eight-way + runtime attestation)"
  # Deploy path always STRICT; unknown /meta attestation = DEPLOY BLOCKED
  TT_PSG_VERSION_STRICT="${TT_PSG_VERSION_STRICT:-1}" \
    python "$root/scripts/dev/run-psg-version-gate.py" --mode "$mode" --env both \
    || {
      echo "psg-version-gate: DEPLOY BLOCKED — STRICT eight-way mismatch or unknown runtime" >&2
      echo "  Local SHA == Artifact == Image Digest == /meta Release Version == PSG Version" >&2
      echo "  Only scripts/deploy/*.sh (TT_CANONICAL_DEPLOY=1); bare fly/forge = INVALID RELEASE ACTION" >&2
      echo "  SSOT: docs/runbook/TT-PSG-RUNTIME-ATTESTATION-LATEST.md" >&2
      return 2
    }
}

deploy_freshness_gate_pre_deploy() {
  local target="${1:-all}"
  deployment_identity_gate_enforce pre-deploy || return 2
  psg_version_gate_enforce pre-deploy || return 2
  deploy_freshness_gate_enforce pre-deploy "$target"
}

deploy_freshness_gate_post_deploy() {
  local target="${1:-all}"
  psg_version_gate_enforce post-deploy || return 2
  deploy_freshness_gate_enforce post-deploy "$target"
}

deploy_freshness_gate_enforce() {
  local mode="${1:-pre-deploy}"
  local target="${2:-all}"
  local root
  root="$(_deploy_freshness_gate_root)"

  if deploy_freshness_gate_skip; then
    echo "deploy-freshness-gate: SKIP ($mode · override/skip env)"
    return 0
  fi

  echo "deploy-freshness-gate: enforce $mode target=$target"
  STAGING_API_BASE="${STAGING_API_BASE:-${API_BASE:-https://tt-api-staging.fly.dev}}" \
    python "$root/scripts/dev/run-deploy-freshness-gate.py" --mode "$mode" --target "$target" \
    || {
      echo "deploy-freshness-gate: BLOCKED — stale code/data risk ($mode)" >&2
      echo "  Rule: any deploy must prove latest baseline (10×4 display · ACTIVE v311 · Catalog bake)." >&2
      echo "  Display lock: STAGING_RC_BASELINE_ALIGNING=1 bash scripts/dev/run-lock-public-display-10x4-staging.sh" >&2
      echo "  Owner override (rare): TRAVELTRUST_DEPLOY_FRESHNESS_OVERRIDE=1" >&2
      return 2
    }
}
