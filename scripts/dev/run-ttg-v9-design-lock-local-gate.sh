#!/usr/bin/env bash
# ① Local Design LOCK gate. Not Sepolia. Not Mainnet. Not TT_PRODUCTION_GO.
# Owner Design LOCK: NEW Solo Timelock · NEW Project Pool · Country FeeRouter · Role Stake · V9 wire.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/contracts"
FOUNDRY_PROFILE=ttg_v9 forge test --match-contract TtgV9DesignLockLocalTest -vv
echo "TT_V9_DESIGN_LOCK_LOCAL: PASS (stop · no Sepolia/Mainnet · old R2_FINAL PASS not inherited)"
