#!/usr/bin/env bash
# PI3 Owner Live wave · 002 → 001 → 003 → 004 (+ go-audit after each)
#
#   PROD_WEB_BASE=https://app.<domain> PROD_API_BASE=https://api.<domain> \
#     bash scripts/dev/run-pi3-owner-live-wave.sh
#
# Interim fly.dev (prep only):
#   bash scripts/dev/run-pi3-owner-live-wave.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_OWNER_LIVE_EVIDENCE:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-owner-live-${STAMP}}"
mkdir -p "$OUT"
LOG="$OUT/run.log"
exec > >(tee -a "$LOG") 2>&1

PROD_WEB_BASE="${PROD_WEB_BASE:-https://tt-web-prod.fly.dev}"
PROD_API_BASE="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
export PROD_WEB_BASE PROD_API_BASE

record_gate() {
  local id="$1" rc="$2"
  echo "GATE ${id}: exit ${rc}" >>"$OUT/gates-summary.txt"
}

echo "== PI3 Owner Live Wave · ${STAMP} =="
echo "PROD_WEB_BASE=${PROD_WEB_BASE}"
echo "PROD_API_BASE=${PROD_API_BASE}"

echo "== [0] Bootstrap prod env =="
bash "$ROOT/scripts/dev/bootstrap-prod-env-from-staging.sh" 2>&1 | tee "$OUT/bootstrap-env.log"

echo "== [1] Ensure Fly prod apps =="
for app in tt-api-prod tt-web-prod; do
  if fly apps list 2>/dev/null | grep -q "^${app}[[:space:]]"; then
    echo "fly app ${app}: exists"
  else
    echo "fly app ${app}: creating..."
    fly apps create "$app" 2>&1 | tee "$OUT/fly-create-${app}.log" || true
  fi
done

if ! fly apps list 2>/dev/null | grep -q "^tt-traveltrust-prod[[:space:]]"; then
  echo "== [1b] Create prod PG tt-traveltrust-prod (enable-backups) =="
  fly postgres create \
    --name tt-traveltrust-prod \
    --region sin \
    --initial-cluster-size 1 \
    --volume-size 10 \
    --vm-size shared-cpu-2x \
    --enable-backups \
    --detach 2>&1 | tee "$OUT/fly-pg-create.log" || echo "WARN: pg create failed or already exists"
fi

if [[ -z "$(grep '^DATABASE_URL=' "$ROOT/scripts/dev/.env.production.local" 2>/dev/null | cut -d= -f2-)" ]]; then
  echo "== [1c] Attach PG to tt-api-prod =="
  fly postgres attach tt-traveltrust-prod -a tt-api-prod --yes 2>&1 | tee "$OUT/fly-pg-attach.log" || true
  # Refresh DATABASE_URL from fly postgres db list / credentials if attach printed it
  bash "$ROOT/scripts/dev/bootstrap-prod-env-from-staging.sh" 2>&1 | tee -a "$OUT/bootstrap-env.log" || true
fi

echo "== [2] PI3-002 Deploy API + Web =="
if [[ -f "$ROOT/scripts/dev/.env.production.local" ]]; then
  bash "$ROOT/scripts/dev/phase3-production-fly-deploy-and-sync.sh" 2>&1 | tee "$OUT/pi3-002-api-deploy.log" || echo "WARN: api deploy failed"
  PROD_WEB_BASE="$PROD_WEB_BASE" PROD_API_BASE="$PROD_API_BASE" \
    bash "$ROOT/scripts/dev/patch-tt-api-prod-cors.sh" 2>&1 | tee "$OUT/pi3-002-cors.log" || true
  bash "$ROOT/scripts/dev/deploy-tt-web-production.sh" 2>&1 | tee "$OUT/pi3-002-web-deploy.log" || echo "WARN: web deploy failed"
fi

echo "== [3] PI3-002 Gate =="
PROD_WEB_BASE="$PROD_WEB_BASE" PROD_API_BASE="$PROD_API_BASE" \
  bash "$ROOT/scripts/check-pi3-002-production-domain-tls-cdn-cors-execution.sh" 2>&1 | tee "$OUT/pi3-002-gate.log" || true
record_gate PI3-002 $?

echo "== [4] PI3-001 Backup =="
bash "$ROOT/scripts/dev/enable-fly-pg-backup.sh" tt-traveltrust-prod 2>&1 | tee "$OUT/pi3-001-backup-enable.log" || echo "WARN: backup enable"
bash "$ROOT/scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh" 2>&1 | tee "$OUT/pi3-001-gate.log" || true
record_gate PI3-001 $?

echo "== [5] PI3-003 Stripe (skip live if keys empty) =="
bash "$ROOT/scripts/check-pi3-003-stripe-live-production-webhook-execution.sh" 2>&1 | tee "$OUT/pi3-003-gate.log" || true
record_gate PI3-003 $?

echo "== [6] PI3-004 Gate =="
bash "$ROOT/scripts/check-pi3-004-production-readiness-verification-execution.sh" 2>&1 | tee "$OUT/pi3-004-gate.log" || true
record_gate PI3-004 $?

echo "== [7] Phase3 GO audit =="
API_BASE="${PROD_API_BASE}" WEB_BASE="${PROD_WEB_BASE}" \
  bash "$ROOT/scripts/dev/run-phase3-production-go-audit.sh" 2>&1 | tee "$OUT/phase3-go-audit.log" || true

ROOT="$ROOT" STAMP="$STAMP" EVIDENCE_DIR="$OUT" node "$ROOT/scripts/dev/gen-pi3-owner-live-ledger.cjs" | tee "$OUT/ledger-gen.log"

echo ""
echo "Evidence: $OUT"
echo "PI3_OWNER_LIVE_WAVE: complete (see gates-summary.txt · brand domain + Stripe live may still block GO)"
