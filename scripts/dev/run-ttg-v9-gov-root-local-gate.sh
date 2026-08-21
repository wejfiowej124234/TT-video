#!/usr/bin/env bash
# ① Local Forge gate for Governance Root Replacement. Not Sepolia. Not Mainnet. Not Production GO.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/contracts"
forge test --match-contract TtgGovRootReplacementLocalTest \
  --skip '**/ttg-meme-denom/**' --skip '**/ttg-v8/**' --skip '**/ttg-v9/**' \
  --skip 'test/EscrowV2.t.sol'
echo "TT_GOV_ROOT_LOCAL: PASS (stop at V9_GOV_ROOT_LOCAL_PASS_STOP · no Sepolia/Mainnet)"
