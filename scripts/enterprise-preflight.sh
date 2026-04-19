#!/usr/bin/env bash
# Unix: SQLx + 55-S13 + optional forge ABI multiset. Run from repo root: bash scripts/enterprise-preflight.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "=== enterprise-preflight (repo: $ROOT) ==="

echo ""
echo "[1] SQLx migration prefixes"
bash "$ROOT/scripts/check-sqlx-migration-prefixes.sh"

echo ""
echo "[2] 55-S13"
bash "$ROOT/scripts/check-55-s13.sh"

if [[ "${TRAVELTRUST_ABI_FORGE_VERIFY:-0}" == "1" ]]; then
  echo ""
  echo "[3] forge ABI multiset"
  export PATH="${HOME}/.foundry/bin:${PATH}"
  bash "$ROOT/scripts/run-verify-abi-forge.sh"
fi

echo ""
echo "=== enterprise-preflight OK ==="
