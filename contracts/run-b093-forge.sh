#!/usr/bin/env bash
# B-093：本地跑 Escrow.t.sol 中全部 B-093 相关用例（test_B093_* / test_COMP_B093_* / testFuzz_B093_*；须 forge 在 PATH）
set -euo pipefail
CONTRACTS_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$CONTRACTS_DIR"

if ! command -v forge >/dev/null 2>&1; then
  echo "forge not found (exit 127). Install Foundry and add ~/.foundry/bin to PATH." >&2
  echo "See: contracts/LOCAL-FOUNDRY.md" >&2
  exit 127
fi

if [ ! -f lib/forge-std/src/Test.sol ]; then
  forge install foundry-rs/forge-std
fi

forge test --root "$CONTRACTS_DIR" --match-path test/Escrow.t.sol --match-test "B093" -vv
