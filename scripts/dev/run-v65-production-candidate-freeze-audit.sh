#!/usr/bin/env bash
# V65 Production Candidate Freeze Audit
# Unlock: TRAVELTRUST_V65_PRODUCTION_CANDIDATE_FREEZE_OK=1
# Forbidden: Web3 mainnet · Admin IA redesign · TT_PRODUCTION_GO flip · Human UAT substitute
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ "${TRAVELTRUST_V65_PRODUCTION_CANDIDATE_FREEZE_OK:-}" != "1" ]]; then
  echo "FAIL: set TRAVELTRUST_V65_PRODUCTION_CANDIDATE_FREEZE_OK=1" >&2
  exit 2
fi

# shellcheck disable=SC1091
[[ -f scripts/dev/.env.production.local ]] && set -a && . ./scripts/dev/.env.production.local && set +a

export PYTHONUTF8=1
export PYTHONIOENCODING=utf-8
export TT_LIVE_COMPOSITION_SHA="${TT_LIVE_COMPOSITION_SHA:-0e5d438916f29395b9cbfbc376be70723e3b0848}"
export TT_EXPECT_API_SHA="${TT_EXPECT_API_SHA:-6e76a299dfbeac8f412923533d56e00efaae0893}"
export TT_EXPECT_WEB_SHA="${TT_EXPECT_WEB_SHA:-075a295fbf5138777dd957feea4d885004a6a953}"
export PROD_API_BASE="${PROD_API_BASE:-https://api.web3-ttg.com}"
export PROD_WEB_BASE="${PROD_WEB_BASE:-https://www.web3-ttg.com}"
export RI_SKIP_MPG_PROXY="${RI_SKIP_MPG_PROXY:-1}"

exec python scripts/dev/run-v65-production-candidate-freeze-audit.py "$@"
