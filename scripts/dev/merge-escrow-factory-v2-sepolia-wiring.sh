#!/usr/bin/env bash
# Post-broadcast · merge EscrowFactoryV2 Sepolia address into registry + env + parity (Owner)
#
# Prerequisites:
#   bash scripts/dev/phase2-sepolia-broadcast-escrow-factory-v2.sh  (with Owner authorize)
#
# Usage:
#   bash scripts/dev/merge-escrow-factory-v2-sepolia-wiring.sh
#   bash scripts/dev/merge-escrow-factory-v2-sepolia-wiring.sh --env-snippet evidence/.../escrow-factory-v2.env
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_SNIPPET="${1:-}"
if [[ "$ENV_SNIPPET" == "--env-snippet" ]]; then
  ENV_SNIPPET="${2:-}"
fi
ENV_SNIPPET="${ENV_SNIPPET:-$ROOT/evidence/GO_production_readiness/escrow-v2-factory-broadcast/latest/escrow-factory-v2.env}"

fail() { echo "merge-escrow-factory-v2-sepolia-wiring: FAIL $*" >&2; exit 2; }
ok() { echo "merge-escrow-factory-v2-sepolia-wiring: OK $*"; }

[[ -f "$ENV_SNIPPET" ]] || fail "missing env snippet: $ENV_SNIPPET (run broadcast first)"

# shellcheck disable=SC1090
source "$ENV_SNIPPET"

[[ -n "${ESCROW_FACTORY_V2_ADDRESS:-}" ]] || fail "ESCROW_FACTORY_V2_ADDRESS unset in $ENV_SNIPPET"
V2="${ESCROW_FACTORY_V2_ADDRESS}"

REGISTRY="$ROOT/registry/protocol-convergence-deployments.v1.yaml"
[[ -f "$REGISTRY" ]] || fail "missing registry"

if grep -q "escrow_factory_v2_address:" "$REGISTRY" && ! grep -q "escrow_factory_v2_address: PENDING" "$REGISTRY"; then
  ok "registry already has escrow_factory_v2_address (skip merge)"
else
  node - "$REGISTRY" "$V2" <<'NODE'
const fs = require('fs');
const [regPath, addr] = process.argv.slice(2);
let text = fs.readFileSync(regPath, 'utf8');
const block = `      escrow_factory_v2_address: "${addr}"`;
if (/escrow_factory_v2_address:/.test(text)) {
  text = text.replace(/escrow_factory_v2_address:.*(\n|$)/, block + '\n');
} else {
  text = text.replace(
    /(escrow_factory_address: "0x[^"]+")/,
    `$1\n${block}`,
  );
}
text = text.replace(
  /escrow_factory_v2_address: PENDING[^\n]*/g,
  `escrow_factory_v2_address: "${addr}"`,
);
text = text.replace(
  /# ESCROW_FACTORY_V2_ADDRESS: escrow_factory_v2_address[^\n]*/g,
  '      ESCROW_FACTORY_V2_ADDRESS: escrow_factory_v2_address',
);
fs.writeFileSync(regPath, text);
console.log('registry: merged escrow_factory_v2_address');
NODE
  ok "registry updated"
fi

PHASE2_ENV="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
append_env() {
  local file="$1"
  [[ -f "$file" ]] || touch "$file"
  grep -q "^ESCROW_FACTORY_V2_ADDRESS=" "$file" 2>/dev/null && \
    sed -i "s|^ESCROW_FACTORY_V2_ADDRESS=.*|ESCROW_FACTORY_V2_ADDRESS=$V2|" "$file" || \
    echo "ESCROW_FACTORY_V2_ADDRESS=$V2" >> "$file"
  grep -q "^NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS=" "$file" 2>/dev/null && \
    sed -i "s|^NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS=.*|NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS=$V2|" "$file" || \
    echo "NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS=$V2" >> "$file"
}
append_env "$PHASE2_ENV"
ok "phase2 env: $PHASE2_ENV"

MASTER="$ROOT/registry/web3-system-master-map.v1.yaml"
if [[ -f "$MASTER" ]]; then
  node - "$MASTER" <<'NODE'
const fs = require('fs');
const p = process.argv[2];
let t = fs.readFileSync(p, 'utf8');
t = t.replace(/parity_registry: pending_sepolia_broadcast/g, 'parity_registry: sepolia_active');
t = t.replace(/(\s+- escrow_factory_v2_address\n)/, '');
if (!t.includes('pending_registry_keys: []')) {
  t = t.replace(
    /pending_registry_keys:\n\s+- escrow_factory_v2_address\n/,
    'pending_registry_keys: []\n',
  );
}
fs.writeFileSync(p, t);
console.log('master-map: cleared pending_registry_keys for V2');
NODE
  ok "master map pending keys cleared"
fi

bash "$ROOT/scripts/dev/export-escrow-factory-v2-abi.sh" || echo "WARN: ABI export skipped (forge build failed)" >&2

ok "running parity probe..."
node "$ROOT/scripts/dev/check-web3-system-master-map-parity.cjs"

ok "EscrowFactoryV2=$V2 wired — restart API/staging with ESCROW_FACTORY_V2_ADDRESS + redeploy frontend NEXT_PUBLIC_*"
