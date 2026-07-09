#!/usr/bin/env bash
# Gate: Phase ③ Mainnet requires generated Mainnet Deployment Package (RULE-DEPLOY-001).
#
#   bash scripts/gates/check-mainnet-deployment-package-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVID="$ROOT/evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-LATEST.json"

[[ -f "$EVID" ]] || {
  echo "check-mainnet-deployment-package-gate: FAIL package not generated" >&2
  echo "  prerequisite: node scripts/dev/run-web3-freeze.cjs" >&2
  echo "  run: node scripts/dev/generate-mainnet-deployment-package.cjs" >&2
  exit 2
}

VERDICT="$(node -e "console.log(require(process.argv[1]).verdict||'UNKNOWN')" "$EVID")"
PREREQ="$(node -e "
const p=require(process.argv[1]);
console.log((p.prerequisite||{}).web3_freeze||'UNKNOWN');
" "$EVID")"

[[ "$PREREQ" == "WEB3_FREEZE_PASS" ]] || {
  echo "check-mainnet-deployment-package-gate: FAIL package requires WEB3_FREEZE_PASS (was $PREREQ)" >&2
  exit 2
}

case "$VERDICT" in
  MAINNET_DEPLOYMENT_PACKAGE_GENERATED)
    echo "check-mainnet-deployment-package-gate: PASS ($VERDICT)"
    ;;
  *)
    echo "check-mainnet-deployment-package-gate: FAIL $VERDICT" >&2
    exit 2
    ;;
esac

# Package must include wave matrix + env template
PKG_DIR="$(node -e "console.log(require(process.argv[1]).package_dir||'')" "$EVID")"
[[ -n "$PKG_DIR" ]] || { echo "check-mainnet-deployment-package-gate: FAIL missing package_dir" >&2; exit 2; }
[[ -f "$ROOT/$PKG_DIR/wave-deployment-matrix.v1.yaml" ]] || {
  echo "check-mainnet-deployment-package-gate: FAIL missing wave-deployment-matrix.v1.yaml" >&2
  exit 2
}
[[ -f "$ROOT/$PKG_DIR/MANIFEST/manifest.json" ]] || {
  echo "check-mainnet-deployment-package-gate: FAIL missing MANIFEST/manifest.json (single SSOT)" >&2
  exit 2
}
[[ -d "$ROOT/$PKG_DIR/abi-snapshot" ]] || {
  echo "check-mainnet-deployment-package-gate: FAIL missing abi-snapshot/" >&2
  exit 2
}
[[ -f "$ROOT/$PKG_DIR/env/mainnet.env.template" ]] || {
  echo "check-mainnet-deployment-package-gate: FAIL missing env/mainnet.env.template" >&2
  exit 2
}
[[ -f "$ROOT/$PKG_DIR/contract-bytecode-hashes.json" ]] || {
  echo "check-mainnet-deployment-package-gate: FAIL missing contract-bytecode-hashes.json" >&2
  exit 2
}
