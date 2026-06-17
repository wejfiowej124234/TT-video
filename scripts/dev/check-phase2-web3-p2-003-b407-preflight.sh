#!/usr/bin/env bash
# Phase ② · WEB3-P2-003 + B-407 — chain env preflight (Sepolia keys + contracts).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/phase2-web3-p2-003-b407-lib.sh
source "$ROOT/scripts/dev/lib/phase2-web3-p2-003-b407-lib.sh"

echo "== check-phase2-web3-p2-003-b407-preflight =="
p2b407_preflight_chain_keys
echo "TT_CHECK_PHASE2_WEB3_P2_003_B407_PREFLIGHT: OK"
