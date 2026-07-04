#!/usr/bin/env bash
# Evidence Integrity Audit — pre-Formal Release Train step.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

GATE="${1:-G2}"
STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/evidence-integrity/${STAMP}"

VERIFY_SIGNOFF=""
LATEST="$(ls -1d evidence/GO_production_readiness/g2-reality-verification/*/g2-reality-verification-signoff.json 2>/dev/null | sort | tail -1 || true)"
[[ -n "$LATEST" ]] && VERIFY_SIGNOFF="$LATEST"

echo "=== Evidence Integrity Audit · gate=${GATE} · ${STAMP} ==="
ARGS=(--gate "$GATE" --evidence-dir "$EVID")
[[ -n "$VERIFY_SIGNOFF" ]] && ARGS+=(--verification-signoff "$VERIFY_SIGNOFF")

node scripts/dev/validate-evidence-integrity-audit.cjs "${ARGS[@]}"

node -e "
const fs=require('fs');
const p='registry/production-readiness-master-matrix.v1.yaml';
let y=fs.readFileSync(p,'utf8');
if (/TT_EVIDENCE_INTEGRITY_AUDIT:/.test(y)) y=y.replace(/TT_EVIDENCE_INTEGRITY_AUDIT: \\w+/, 'TT_EVIDENCE_INTEGRITY_AUDIT: PASS');
else y=y.replace(/(machine_keys:\\r?\\n)/, '\$1  TT_EVIDENCE_INTEGRITY_AUDIT: PASS\\n');
fs.writeFileSync(p,y);
"
