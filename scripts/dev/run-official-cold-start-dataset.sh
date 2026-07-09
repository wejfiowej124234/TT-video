#!/usr/bin/env bash
# Official Cold Start Dataset · Admin Public Operations apply
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${OCS_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="${OCS_EVIDENCE_DIR:-$ROOT/evidence/GO_official_cold_start_dataset/$STAMP}"
mkdir -p "$EVID"

API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
export API_BASE API="$API_BASE"
export OCS_EVIDENCE_DIR="$EVID"
export OCS_STAMP="$STAMP"

echo "== OCS apply · $STAMP =="
node "$ROOT/scripts/dev/run-official-cold-start-dataset.cjs" 2>&1 | tee "$EVID/run.log"

echo "== post-apply DDG scan =="
API="$API_BASE" FS_DG_JSON="$EVID/fs-dg-post.json" \
  node "$ROOT/scripts/dev/staging-full-site-display-governance-audit.cjs" 2>&1 | tee "$EVID/fs-dg.log" || true

cat > "$EVID/STATUS.txt" <<EOF
TT_OFFICIAL_COLD_START_DATASET: APPLIED
at=${STAMP}
api=${API_BASE}
manifest=data/official-cold-start/dataset.v1.json
evidence=${EVID#"$ROOT/"}
EOF

echo "Evidence: $EVID"
