#!/usr/bin/env bash
# Production GO prep (NO_GO — checklist + template only).
#
#   bash scripts/dev/run-production-go-prep.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${PRODUCTION_GO_PREP_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
PREP="$ROOT/evidence/GO_production_readiness/G3-06/preparation"
mkdir -p "$PREP"

node "$ROOT/scripts/dev/write-production-go-prep-signoff.cjs" "$PREP" "$STAMP" 2>&1 | tee "$PREP/write.log"
cp "$ROOT/registry/production-go-decision-package.v1.template.json" "$PREP/production-go-decision-package.template.json"
cp "$ROOT/registry/production-release-prep.v1.yaml" "$PREP/production-release-prep-registry-snapshot.yaml"

git rev-parse HEAD >"$PREP/local-git-sha.txt"
cat "$PREP/STATUS.txt"
echo "evidence=$PREP"
