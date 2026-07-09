#!/usr/bin/env bash
# Gate: Web3 Freeze must PASS before Mainnet Deployment Package generation.
#
#   bash scripts/gates/check-web3-freeze-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVID="$ROOT/evidence/GO_production_readiness/web3-freeze/WEB3-FREEZE-MANIFEST-LATEST.json"

[[ -f "$EVID" ]] || {
  echo "check-web3-freeze-gate: FAIL missing Web3 Freeze manifest" >&2
  echo "  prerequisite: bash scripts/gates/check-phase3-deployment-prerequisite-review-gate.sh" >&2
  echo "  run: node scripts/dev/run-web3-freeze.cjs" >&2
  exit 2
}

VERDICT="$(node -e "console.log(require(process.argv[1]).verdict||'UNKNOWN')" "$EVID")"

case "$VERDICT" in
  WEB3_FREEZE_PASS)
    echo "check-web3-freeze-gate: PASS ($VERDICT)"
    ;;
  *)
    echo "check-web3-freeze-gate: FAIL $VERDICT" >&2
    exit 2
    ;;
esac

# Verify frozen assets still match manifest (detect post-freeze drift)
node - "$EVID" "$ROOT" <<'NODE'
const fs = require('fs');
const crypto = require('crypto');
const [manifestPath, root] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function sha256File(abs) {
  if (!fs.existsSync(abs)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

let drift = 0;
for (const [scope, data] of Object.entries(m.scope || {})) {
  for (const [file, meta] of Object.entries(data.entries || {})) {
    const current = sha256File(require('path').join(root, file));
    if (current !== meta.sha256) {
      console.error(`check-web3-freeze-gate: DRIFT ${scope}/${file}`);
      drift++;
    }
  }
}
if (drift > 0) {
  console.error(`check-web3-freeze-gate: FAIL ${drift} frozen asset(s) changed — re-run run-web3-freeze.cjs`);
  process.exit(2);
}
NODE
