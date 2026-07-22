#!/usr/bin/env bash
# Web3 Candidate v2 mainline env — source from all NEW Web3 test / deploy entries.
# SSOT: registry/web3-mainline.v1.yaml
#
# Usage:
#   source scripts/dev/lib/web3-candidate-v2-mainline.sh
#
# Refuses FG-15-A pin/SHA as active; does not delete historical evidence.
set -euo pipefail

_TT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

export TRAVELTRUST_WEB3_MAINLINE="${TRAVELTRUST_WEB3_MAINLINE:-candidate_v2}"
export TRAVELTRUST_PSG_RELEASE_VERSION="${TRAVELTRUST_PSG_RELEASE_VERSION:-PSG-REL-20260720-WEB3-CAND-V2}"
export TRAVELTRUST_CONTRACT_PROFILE="${TRAVELTRUST_CONTRACT_PROFILE:-v311_fund_safety_candidate_v2}"
export TRAVELTRUST_FG15_TRACK="${TRAVELTRUST_FG15_TRACK:-FG-15-B}"
export TRAVELTRUST_FG15_EVIDENCE_ROOT="${TRAVELTRUST_FG15_EVIDENCE_ROOT:-evidence/GO_fg15_observation_48h_candidate_v2}"
export TRAVELTRUST_WEB3_CANDIDATE_ID="${TRAVELTRUST_WEB3_CANDIDATE_ID:-WEB3-CANDIDATE-V2-FUND-SAFETY-P0}"

# Historical FG-15-A — cite only as archive
export TRAVELTRUST_FG15_A_PIN_ARCHIVED="PSG-REL-20260719-FG15-09c72b93"
export TRAVELTRUST_FG15_A_SHA_ARCHIVED="09c72b934b62f848e60b38bcc7ff0e6cac44f923"
export TRAVELTRUST_FG15_A_EVIDENCE_HINT="evidence/GO_fg15_observation_48h"

web3_mainline_refuse_fg15_a_as_active() {
  local context="${1:-web3-mainline}"
  if [[ "${TRAVELTRUST_PSG_RELEASE_VERSION}" == "PSG-REL-20260719-FG15-09c72b93" ]]; then
    echo "web3-mainline: REFUSE $context — FG-15-A pin is ARCHIVED_HISTORICAL (NOT FOR PROMOTION)" >&2
    echo "  Use PSG-REL-20260720-WEB3-CAND-V2 / Candidate v2 (registry/web3-mainline.v1.yaml)" >&2
    return 2
  fi
  if [[ "${TRAVELTRUST_CONTRACT_PROFILE}" == "v311_sepolia_clean_baseline" && "${TRAVELTRUST_ALLOW_HISTORICAL_BASELINE:-}" != "1" ]]; then
    echo "web3-mainline: REFUSE $context — v311_sepolia_clean_baseline is HISTORICAL_FG15_A_SNAPSHOT" >&2
    echo "  Set TRAVELTRUST_CONTRACT_PROFILE=v311_fund_safety_candidate_v2 (or TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1 for read-only audit)" >&2
    return 2
  fi
  local head
  head="$(git -C "$_TT_ROOT" rev-parse HEAD 2>/dev/null || true)"
  if [[ -n "$head" && "$head" == "$TRAVELTRUST_FG15_A_SHA_ARCHIVED" && "${TRAVELTRUST_ALLOW_FG15_A_HEAD:-}" != "1" ]]; then
    echo "web3-mainline: WARN $context — HEAD equals archived FG-15-A SHA; prefer Candidate v2 tip" >&2
  fi
  return 0
}

web3_mainline_refuse_write_fg15_a_evidence() {
  local path="${1:-}"
  case "$path" in
    *GO_fg15_observation_48h/*|*GO_fg15_observation_48h)
      case "$path" in
        *GO_fg15_observation_48h_candidate_v2*) return 0 ;;
        *)
          echo "web3-mainline: REFUSE write to FG-15-A evidence root: $path" >&2
          echo "  Use evidence/GO_fg15_observation_48h_candidate_v2/ (FG-15-B)" >&2
          return 2
          ;;
      esac
      ;;
  esac
  return 0
}

web3_mainline_ok() {
  echo "web3-mainline: OK Candidate v2 · ${TRAVELTRUST_PSG_RELEASE_VERSION} · profile=${TRAVELTRUST_CONTRACT_PROFILE} · ${TRAVELTRUST_FG15_TRACK}"
}
