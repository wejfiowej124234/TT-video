#!/usr/bin/env bash
# Web3 mainline gate — Candidate v2 ACTIVE; FG-15-A archived historical.
#   bash scripts/gates/check-web3-mainline-candidate-v2-gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MAIN="$ROOT/registry/web3-mainline.v1.yaml"
CAND="$ROOT/registry/web3-candidate-v2.v1.yaml"
ARCH="$ROOT/registry/fg15-a-historical-archive.v1.yaml"
BREG="$ROOT/registry/fg15-b-candidate-v2.v1.yaml"
VER="$ROOT/registry/psg-release-version-LATEST.yaml"
DEP="$ROOT/registry/protocol-convergence-deployments.v1.yaml"
IDENT="$ROOT/evidence/GO_web3_candidate_v2/WEB3-CANDIDATE-V2-RELEASE-IDENTITY-LATEST.json"
FG15B="$ROOT/evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json"
FAIL=0

need() { [[ -f "$1" ]] || { echo "FAIL missing: $1"; FAIL=1; }; }

need "$MAIN"; need "$CAND"; need "$ARCH"; need "$BREG"; need "$VER"; need "$DEP"; need "$IDENT"; need "$FG15B"

grep -q 'ACTIVE_WEB3_CANDIDATE_BASELINE' "$MAIN" || { echo "FAIL mainline missing ACTIVE_WEB3_CANDIDATE_BASELINE"; FAIL=1; }
grep -q 'status: ACTIVE_WEB3_CANDIDATE_BASELINE' "$CAND" || { echo "FAIL candidate status must be ACTIVE_WEB3_CANDIDATE_BASELINE"; FAIL=1; }
grep -q 'PSG-REL-20260720-WEB3-CAND-V2' "$VER" || { echo "FAIL active release must be PSG-REL-20260720-WEB3-CAND-V2"; FAIL=1; }
grep -q 'ARCHIVED_HISTORICAL' "$ARCH" || { echo "FAIL FG-15-A archive missing ARCHIVED_HISTORICAL"; FAIL=1; }
grep -q 'NOT_FOR_PROMOTION: true' "$ARCH" || { echo "FAIL FG-15-A must be NOT_FOR_PROMOTION"; FAIL=1; }
grep -q 'IMMUTABLE_NO_DELETE_NO_OVERWRITE' "$ARCH" || { echo "FAIL FG-15-A must declare immutable evidence policy"; FAIL=1; }
grep -q 'web3_mainline_baseline: v311_fund_safety_candidate_v2' "$DEP" || { echo "FAIL DEP web3_mainline_baseline must be Candidate v2"; FAIL=1; }
grep -q 'active_deploy_baseline: v311_fund_safety_candidate_v2' "$DEP" || { echo "FAIL DEP active_deploy_baseline must be Candidate v2 (Baseline Migration v2)"; FAIL=1; }
grep -q 'historical_fg15_a_deploy_baseline: v311_sepolia_clean_baseline' "$DEP" || { echo "FAIL DEP missing historical_fg15_a_deploy_baseline"; FAIL=1; }
grep -q 'status: ACTIVE_WEB3_CANDIDATE_BASELINE' "$DEP" || { echo "FAIL Candidate env status must be ACTIVE_WEB3_CANDIDATE_BASELINE"; FAIL=1; }
grep -q 'HISTORICAL_FG15_A_SNAPSHOT' "$DEP" || { echo "FAIL v311_sepolia must be HISTORICAL_FG15_A_SNAPSHOT"; FAIL=1; }
grep -q 'PROMOTION_CANDIDATE' "$BREG" || { echo "FAIL FG-15-B must be PROMOTION_CANDIDATE"; FAIL=1; }
grep -q 'PSG-REL-20260720-WEB3-CAND-V2' "$IDENT" || { echo "FAIL release identity missing Candidate version"; FAIL=1; }

# Active block must NOT still claim FG-15-A as active freeze tip
if awk '
  /^active:/ {ina=1; next}
  /^archived_historical:/ {ina=0}
  /^superseded:/ {ina=0}
  ina && /PSG-REL-20260719-FG15-09c72b93/ {bad=1}
  END {exit bad?0:1}
' "$VER"; then
  echo "FAIL psg-release-version active block still cites FG-15-A pin"
  FAIL=1
fi

# Must archive FG-15-A somewhere
grep -q 'PSG-REL-20260719-FG15-09c72b93' "$VER" || { echo "FAIL archived FG-15-A pin missing from version file (must retain history)"; FAIL=1; }

# Hard Gate still refused
HG="$ROOT/registry/mainnet-cutover-hard-gate.v1.yaml"
if [[ -f "$HG" ]]; then
  grep -q 'current_verdict: REFUSED' "$HG" || { echo "FAIL Hard Gate must stay REFUSED"; FAIL=1; }
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "TT_WEB3_MAINLINE_CANDIDATE_V2_GATE: FAIL"
  exit 1
fi
echo "TT_WEB3_MAINLINE_CANDIDATE_V2_GATE: PASS"
echo "NOTE: FG-15-A ARCHIVED_HISTORICAL · Candidate v2 ACTIVE Web3 mainline · Wave FORBIDDEN"
exit 0
