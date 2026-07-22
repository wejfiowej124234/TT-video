#!/usr/bin/env bash
# Shared canonical-deploy prelude · sourced by scripts/deploy/*.sh
# Sets TT_CANONICAL_DEPLOY=1 and attestation env from Active PSG pin.
set -euo pipefail

_tt_deploy_root() {
  echo "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
}

tt_canonical_deploy_prelude() {
  local root target="${1:-all}"
  root="$(_tt_deploy_root)"
  export TT_CANONICAL_DEPLOY=1
  export DEPLOY_FRESHNESS_ROOT="$root"

  # Active PSG pin (mint SSOT: registry/psg-release-version-LATEST.yaml) — FG-15-A ARCHIVED
  export TRAVELTRUST_PSG_RELEASE_VERSION="${TRAVELTRUST_PSG_RELEASE_VERSION:-PSG-REL-20260720-WEB3-CAND-V2}"
  export TRAVELTRUST_CONTRACT_PROFILE="${TRAVELTRUST_CONTRACT_PROFILE:-v311_fund_safety_candidate_v2}"
  export TRAVELTRUST_FG15_TRACK="${TRAVELTRUST_FG15_TRACK:-FG-15-B}"
  export TRAVELTRUST_GIT_SHA="${TRAVELTRUST_GIT_SHA:-$(git -C "$root" rev-parse HEAD)}"
  export TT_ARTIFACT_SHA="${TT_ARTIFACT_SHA:-$TRAVELTRUST_GIT_SHA}"
  export TRAVELTRUST_ARTIFACT_SHA="${TRAVELTRUST_ARTIFACT_SHA:-$TT_ARTIFACT_SHA}"
  export TRAVELTRUST_BUILD_TIME="${TRAVELTRUST_BUILD_TIME:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
  # Staging attestation: stamp gitsha digest pre-fly; real OCI digest may replace post-deploy
  if [[ -z "${TRAVELTRUST_IMAGE_DIGEST:-}" || "${TRAVELTRUST_IMAGE_DIGEST}" == "unknown" ]]; then
    export TRAVELTRUST_IMAGE_DIGEST="${TT_RUNTIME_IMAGE_SHA:-gitsha:${TRAVELTRUST_GIT_SHA}}"
  fi
  export TT_RUNTIME_IMAGE_SHA="${TT_RUNTIME_IMAGE_SHA:-$TRAVELTRUST_IMAGE_DIGEST}"
  export TRAVELTRUST_DATABASE_BASELINE="${TRAVELTRUST_DATABASE_BASELINE:-staging_rc_ssot_alignment.v1#expected_staging_surface}"
  export TRAVELTRUST_CMS_BASELINE="${TRAVELTRUST_CMS_BASELINE:-public_display_10x4 + catalog_bake=1}"

  # Web build-time mirrors
  export NEXT_PUBLIC_PSG_RELEASE_VERSION="${NEXT_PUBLIC_PSG_RELEASE_VERSION:-$TRAVELTRUST_PSG_RELEASE_VERSION}"
  export NEXT_PUBLIC_GIT_SHA="${NEXT_PUBLIC_GIT_SHA:-$TRAVELTRUST_GIT_SHA}"
  export NEXT_PUBLIC_ARTIFACT_SHA="${NEXT_PUBLIC_ARTIFACT_SHA:-$TRAVELTRUST_ARTIFACT_SHA}"
  export NEXT_PUBLIC_IMAGE_DIGEST="${NEXT_PUBLIC_IMAGE_DIGEST:-$TRAVELTRUST_IMAGE_DIGEST}"
  export NEXT_PUBLIC_BUILD_TIME="${NEXT_PUBLIC_BUILD_TIME:-$TRAVELTRUST_BUILD_TIME}"
  export NEXT_PUBLIC_CONTRACT_PROFILE="${NEXT_PUBLIC_CONTRACT_PROFILE:-$TRAVELTRUST_CONTRACT_PROFILE}"
  export NEXT_PUBLIC_DATABASE_BASELINE="${NEXT_PUBLIC_DATABASE_BASELINE:-$TRAVELTRUST_DATABASE_BASELINE}"
  export NEXT_PUBLIC_CMS_BASELINE="${NEXT_PUBLIC_CMS_BASELINE:-$TRAVELTRUST_CMS_BASELINE}"

  # shellcheck source=../dev/lib/deploy-freshness-gate.sh
  source "$root/scripts/dev/lib/deploy-freshness-gate.sh"
  deploy_freshness_gate_pre_deploy "$target" || {
    echo "INVALID RELEASE ACTION / DEPLOY BLOCKED — canonical gates failed" >&2
    return 2
  }
}

tt_forbid_during_fg15() {
  if [[ "${FG15_ELAPSED:-}" != "1" ]]; then
    echo "scripts/deploy: BLOCKED during FG-15 (set FG15_ELAPSED=1 only after window ends)" >&2
    echo "  Do not redeploy. Use Runtime Attestation dry-run / Drift Scanner instead." >&2
    return 2
  fi
  return 0
}
