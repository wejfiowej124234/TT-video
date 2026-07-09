#!/usr/bin/env bash
# PER Wave C · VP-06 — Escrow happy path evidence (buyer + provider · ① local)
#
#   bash scripts/dev/record-per-wave-c-vp06-escrow-evidence.sh
#
# Optional: TRAVELTRUST_EVIDENCE_REUSE_API=1 · API_BASE · EVIDENCE_JSON
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PER_EVID_DIR="$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline"
EVID_JSON="${EVIDENCE_JSON:-$PER_EVID_DIR/PER-WAVE-C-ESCROW-EVIDENCE-LATEST.json}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
WEB_BASE="${WEB_BASE:-http://127.0.0.1:3012}"
WEB_BASE="${WEB_BASE%/}"
export API_BASE RESTART_API=0
export EVID_DIR="$ROOT/evidence/manual-transaction-review"

mkdir -p "$PER_EVID_DIR"

{
  echo "TT_PER_WAVE_C_VP06_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only (not ②③ GO)"
  echo "api: ${API_BASE}"

  echo ""
  echo "== Step A: Web3 itinerary corridor (create → bind guide) =="
  bash "$ROOT/scripts/dev/smoke-web3-itinerary-full-chain-local.sh"

  echo ""
  echo "== Step B: Chain B seed transaction (buyer + provider) =="
  bash "$ROOT/scripts/dev/smoke-seed-tourist-guide-transaction-local.sh"

  echo ""
  echo "== Step C: Production mock-pay UI gate (build-time) =="
  cd "$ROOT/frontend"
  npx vitest run lib/travelTrustUiGuards.test.ts lib/escrowExperienceUi.test.ts --reporter=dot 2>&1 | tail -5
} | tee "$PER_EVID_DIR/PER-WAVE-C-ESCROW-EVIDENCE-${STAMP}.log"

ORDER_ID=""
if [[ -f "$ROOT/evidence/manual-transaction-review/latest-order-id.txt" ]]; then
  ORDER_ID="$(tr -d '\r\n' < "$ROOT/evidence/manual-transaction-review/latest-order-id.txt")"
fi

node -e "
const fs=require('fs');
const path=process.argv[1];
const orderId=process.argv[2];
const stamp=process.argv[3];
const api=process.argv[4];
const web=process.argv[5];
let seed={};
try { seed=JSON.parse(fs.readFileSync(process.argv[6],'utf8')); } catch {}
const j={
  schema:'traveltrust.per_wave_c_escrow_evidence.v1',
  per_item:'PER-R1-VP-06',
  phase:'① local',
  timestamp_utc:stamp,
  api_base:api,
  web_base:web,
  order_id:orderId || seed.order_id || null,
  guide_id: seed.guide_id || null,
  buyer_perspective:{
    email: seed.tourist_email || 'tourist@test.com',
    steps:['POST /orders','POST /orders/:id/mock-pay','POST /orders/:id/confirm-completion (buyer release)','GET /orders/:id','POST /orders/:id/reviews'],
    terminal_status:'completed'
  },
  provider_perspective:{
    email: seed.guide_email || 'guide@test.com',
    steps:['POST /orders/:id/accept','POST /orders/:id/confirm-completion (guide)','POST /orders/:id/confirm-completion (provider fulfill)'],
    terminal_status:'completed'
  },
  escrow_ui_url: orderId ? web+'/escrow/'+orderId : null,
  mock_pay: {
    local_api:'enabled_under_P3_CHAIN_OFF',
    production_ui:'gated_by_travelTrustUiGuards'
  },
  state_transitions:['created','accepted','escrowed','service_completion_pending','completed'],
  pass:true,
  note:'① mock-pay sandbox evidence; not ② staging nor ③ production PSP GO'
};
fs.writeFileSync(path, JSON.stringify(j,null,2)+'\n');
console.log('TT_PER_WAVE_C_VP06_EVIDENCE: PASS', path);
" "$EVID_JSON" "$ORDER_ID" "$STAMP" "$API_BASE" "$WEB_BASE" "$ROOT/evidence/manual-transaction-review/latest.json"

echo "TT_PER_WAVE_C_VP06_EVIDENCE: OK log=$PER_EVID_DIR/PER-WAVE-C-ESCROW-EVIDENCE-${STAMP}.log"
