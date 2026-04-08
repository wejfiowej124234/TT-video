#!/usr/bin/env bash
# B-089：Governor / Timelock / FeeRouter 相关 forge 用例（`[Bb]089` 匹配 test_b089_* 与 test*_B089_*；须 forge 在 PATH）
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

forge test --root "$CONTRACTS_DIR" --match-test "[Bb]089" -vv
