#!/usr/bin/env bash
# G3 Production CDN · Phase ①② release prep (artifacts + dry-run — NOT VERIFIED).
#
#   bash scripts/dev/run-g3-production-cdn-prep.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${G3_CDN_PREP_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
PREP="$ROOT/evidence/GO_production_readiness/G3-01/preparation"
mkdir -p "$PREP"

echo "== G3 Production CDN prep · generate implementation artifacts =="
node "$ROOT/scripts/dev/generate-g3-cdn-implementation-artifacts.cjs" "$PREP" 2>&1 | tee "$PREP/generate-artifacts.log"

echo "== G3 Production CDN prep · R2 bootstrap dry-run (60 objects) =="
OUT="$PREP/r2-bootstrap-result.v1.json" \
  node "$ROOT/scripts/dev/bootstrap-ocs-official-assets-to-r2.cjs" 2>&1 | tee "$PREP/r2-bootstrap-dry-run.log"

echo "== G3 Production CDN prep · configure script dry-run =="
PRODUCTION_CDN_DRY_RUN=1 bash "$ROOT/scripts/dev/configure-production-media-r2-cdn.sh" 2>&1 | tee "$PREP/configure-dry-run.log"

echo "== G3 Production CDN prep · validate =="
node "$ROOT/scripts/dev/validate-g3-production-cdn-prep.cjs" "$PREP" 2>&1 | tee "$PREP/validate.log"

echo "== G3 Production CDN prep · signoff =="
node "$ROOT/scripts/dev/write-g3-production-cdn-prep-signoff.cjs" "$PREP" "$STAMP" 2>&1 | tee "$PREP/signoff.log"

cp "$ROOT/registry/g3-01-production-network-checklist.v1.json" "$PREP/g3-01-checklist-registry-snapshot.json"

git rev-parse HEAD >"$PREP/local-git-sha.txt"
echo "stamp=$STAMP" >"$PREP/prep-target.txt"
echo "TT_G3_PRODUCTION_CDN_PREP: READY" >>"$PREP/prep-target.txt"
echo "TT_G3_PRODUCTION_CDN_VERIFIED: PLANNED" >>"$PREP/prep-target.txt"

cat "$PREP/STATUS.txt"
echo "evidence=$PREP"
