#!/usr/bin/env bash
# Export EscrowFactoryV2 ABI from Foundry build output → contracts/abi/EscrowFactoryV2.json
#
#   bash scripts/dev/export-escrow-factory-v2-abi.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/contracts"

OUT="$ROOT/contracts/abi/EscrowFactoryV2.json"
ARTIFACT="out/EscrowFactoryV2.sol/EscrowFactoryV2.json"

if [[ ! -f "$ARTIFACT" ]]; then
  echo "export-escrow-factory-v2-abi: building EscrowFactoryV2..." >&2
  forge build --contracts src/EscrowFactoryV2.sol -q
fi

[[ -f "$ARTIFACT" ]] || { echo "export-escrow-factory-v2-abi: missing $ARTIFACT" >&2; exit 2; }

node - "$ARTIFACT" "$OUT" <<'NODE'
const fs = require('fs');
const art = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const abi = art.abi;
if (!Array.isArray(abi) || abi.length === 0) {
  console.error('export-escrow-factory-v2-abi: empty abi');
  process.exit(2);
}
fs.mkdirSync(require('path').dirname(process.argv[3]), { recursive: true });
fs.writeFileSync(process.argv[3], JSON.stringify(abi, null, 2) + '\n');
console.log(`export-escrow-factory-v2-abi: OK ${process.argv[3]} (${abi.length} entries)`);
NODE
