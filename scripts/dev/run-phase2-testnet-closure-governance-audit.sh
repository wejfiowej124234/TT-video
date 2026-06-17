#!/usr/bin/env bash
# TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD · ② 毕业多维审计编排
#
#   bash scripts/dev/run-phase2-testnet-closure-governance-audit.sh
#   bash scripts/dev/run-phase2-testnet-closure-governance-audit.sh --matrix-only
#
# SSOT: docs/runbook/TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md
# 诚实边界：exit 0 + AUDIT:PASS ≠ TT_TESTNET_GRADUATION:CLOSED（须 §1.1 全 AND + Owner 签字）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

MATRIX_ONLY=0
[[ "${1:-}" == "--matrix-only" ]] && MATRIX_ONLY=1

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_graduation/${STAMP}"
mkdir -p "$EVID"
LOG="$EVID/audit-${STAMP}.log"

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
FE="${FE%/}"

merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    export "${line%%=*}=${line#*=}"
  done < "$f"
}

merge_env "$ROOT/scripts/dev/.env.staging-onboarding.local"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1"

exec > >(tee -a "$LOG") 2>&1

echo "TT_PHASE2_TESTNET_CLOSURE_GOVERNANCE_AUDIT: START ${STAMP}"
echo "standard=TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD api=${API}"

OPEN_P0="${OPEN_TESTNET_P0_COUNT:-0}"
OPEN_P1="${OPEN_TESTNET_P1_COUNT:-0}"
READINESS="${TT_PHASE2_READINESS:-100}"

if [[ "$MATRIX_ONLY" != "1" ]]; then
  echo ""
  echo "== probe: health =="
  hc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' --max-time 25 "${API}/health" || echo 000)"
  echo "{\"http_code\":\"${hc}\"}" >"$EVID/probe-health.json"

  echo ""
  echo "== probe: meta chain =="
  curl --noproxy "*" -sS --max-time 30 "${API}/meta" >"$EVID/probe-meta.json" || echo '{"error":"meta_fetch_failed"}' >"$EVID/probe-meta.json"

  SEC="${INTERNAL_API_SECRET:-}"
  if [[ -n "$SEC" ]]; then
    echo ""
    echo "== probe: indexer-reconcile (read-only) =="
    curl --noproxy "*" -sS --max-time 120 -X POST \
      -H "Content-Type: application/json" \
      -H "X-Internal-Api-Secret: ${SEC}" \
      -d '{"persist":false,"rpc_escrow_samples":3,"include_event_log_escrow_coverage":true}' \
      "${API}/api/v1/internal/indexer-reconcile" >"$EVID/probe-indexer-reconcile.json" || \
      echo '{"error":"reconcile_failed"}' >"$EVID/probe-indexer-reconcile.json"
  else
    echo '{"skipped":true,"reason":"INTERNAL_API_SECRET unset"}' >"$EVID/probe-indexer-reconcile.json"
  fi

  SOAK_COMPLETED=0
  [[ -f "$ROOT/evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json" ]] && SOAK_COMPLETED=1
  echo "{\"completed\":${SOAK_COMPLETED},\"path\":\"evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json\"}" >"$EVID/probe-p2fc-soak.json"

  echo ""
  echo "== probe: surface coverage matrix (D24 registry) =="
  node "$ROOT/scripts/dev/gen-phase2-testnet-surface-coverage-matrix.mjs" --evid-dir "$EVID"

  echo ""
  echo "== probe: deep + enterprise + operational + governance + surface (D1→D24) =="
  node "$ROOT/scripts/dev/probe-phase2-testnet-deep-closure.mjs" \
    --evid-dir "$EVID" \
    --api "$API" || echo '{"error":"deep_closure_probe_failed"}' >"$EVID/probe-deep-closure.json"
fi

node "$ROOT/scripts/dev/gen-phase2-testnet-graduation-matrix.mjs" \
  --evid-dir "$EVID" \
  --stamp "$STAMP" \
  --api "$API" \
  --fe "$FE" \
  --open-p0 "$OPEN_P0" \
  --open-p1 "$OPEN_P1" \
  --readiness "$READINESS"

if [[ "$MATRIX_ONLY" == "1" && ! -f "$EVID/probe-deep-closure.json" ]]; then
  echo ""
  echo "== probe: deep closure addendum (matrix-only backfill) =="
  node "$ROOT/scripts/dev/probe-phase2-testnet-deep-closure.mjs" \
    --evid-dir "$EVID" \
    --api "$API" || true
  node "$ROOT/scripts/dev/gen-phase2-testnet-graduation-matrix.mjs" \
    --evid-dir "$EVID" \
    --stamp "$STAMP" \
    --api "$API" \
    --fe "$FE" \
    --open-p0 "$OPEN_P0" \
    --open-p1 "$OPEN_P1" \
    --readiness "$READINESS"
fi

BLOCKING="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).summary.blocking_open)" "$EVID/graduation-matrix.v1.json")"
GRAD="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).graduation_verdict)" "$EVID/graduation-matrix.v1.json")"
MISSING_COV="$(node -e "const m=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(m.deep_closure?.summary?.missing_coverage ?? 'n/a')" "$EVID/graduation-matrix.v1.json")"
EVID_GAP="$(node -e "const m=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(m.deep_closure?.summary?.evidence_gap ?? 'n/a')" "$EVID/graduation-matrix.v1.json")"

cat >"$EVID/STATUS.txt" <<EOF
phase: ② testnet
standard: TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD
addendum: Deep + Enterprise + Operational + Governance + Full Surface v4
at: ${STAMP}
graduation_verdict: ${GRAD}
blocking_open: ${BLOCKING}
missing_coverage: ${MISSING_COV}
evidence_gap: ${EVID_GAP}
open_p0: ${OPEN_P0}
open_p1: ${OPEN_P1}
readiness: ${READINESS}
EOF

if [[ "$GRAD" == "CLOSED" && "$OPEN_P0" == "0" && "$OPEN_P1" == "0" && "$BLOCKING" == "0" && "$MISSING_COV" == "0" && "$EVID_GAP" == "0" ]]; then
  echo ""
  echo "TT_PHASE2_TESTNET_CLOSURE_GOVERNANCE_AUDIT: PASS ${STAMP}"
  echo "TT_TESTNET_GRADUATION: CLOSED"
  echo "evidence: ${EVID}"
  exit 0
fi

echo ""
echo "TT_PHASE2_TESTNET_CLOSURE_GOVERNANCE_AUDIT: PARTIAL ${STAMP}"
echo "TT_TESTNET_GRADUATION: OPEN"
echo "evidence: ${EVID}"
exit 0
