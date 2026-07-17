#!/usr/bin/env bash
# TravelTrust Public Surface Governance · Runtime Certification (permanent deploy gate)
# Fail-fast: any step FAIL → Deploy FAIL (exit 2). Does not claim Production GO.
#
#   bash scripts/gates/run-psg-runtime-certification.sh
#   PSG_SKIP_BOOTSTRAP=1 bash scripts/gates/run-psg-runtime-certification.sh   # readonly path
#   PSG_EXPECT_SHA=<fullsha> STAGING_API_BASE=https://tt-api-staging.fly.dev ...
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
EVID="$ROOT/evidence/GO_psg_runtime_certification"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$EVID/run-${STAMP}.log"
SKIP_BOOT="${PSG_SKIP_BOOTSTRAP:-0}"

fail() { echo "TT_PSG_RUNTIME_CERT: FAIL $*" | tee -a "$LOG" >&2; echo "Deploy FAIL — stop" | tee -a "$LOG" >&2; exit 2; }
ok() { echo "TT_PSG_RUNTIME_CERT: OK $*" | tee -a "$LOG"; }
step() { echo "" | tee -a "$LOG"; echo "=== PSG STEP: $* ===" | tee -a "$LOG"; }

LOCAL_SHA="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
echo "PSG Runtime Certification · local_sha=$LOCAL_SHA · api=$API · stamp=$STAMP" | tee "$LOG"
echo "production_go=NO_GO · pf_step5=FROZEN" | tee -a "$LOG"

# 1 · Git SHA
step "1 Git SHA"
[[ "$LOCAL_SHA" != "unknown" && ${#LOCAL_SHA} -ge 7 ]] || fail "cannot resolve local git SHA"
ok "local SHA $LOCAL_SHA"

# 2 · Migration LF integrity
step "2 Migration LF integrity"
bash "$ROOT/scripts/gates/check-sqlx-migration-lf-integrity.sh" | tee -a "$LOG" \
  || fail "migration LF integrity"

# 3 · Database (static: UPSERT + canonical_key wiring)
step "3 Database UPSERT / Canonical Key (static)"
node "$ROOT/scripts/gates/check-ocs-market-listing-idempotency.cjs" 2>&1 | tee -a "$LOG" \
  || fail "database/static OCS idempotency"

# 4 · OCS Bootstrap ×2 (write path — Owner env; skipable for readonly)
step "4 OCS Bootstrap ×2"
if [[ "$SKIP_BOOT" == "1" ]]; then
  ok "SKIP bootstrap (PSG_SKIP_BOOTSTRAP=1) — cannot claim full Deploy PASS"
  echo "TT_PSG_BOOTSTRAP_X2: SKIPPED" | tee -a "$LOG"
else
  [[ "${PSG_ALLOW_BOOTSTRAP_WRITE:-}" == "1" ]] \
    || fail "set PSG_ALLOW_BOOTSTRAP_WRITE=1 to run Staging OCS bootstrap (or PSG_SKIP_BOOTSTRAP=1)"
  export API_BASE="$API" API="$API"
  # Clear STATE cache only (not DB) so second path still hits UPSERT
  STATE_DIR="$ROOT/evidence/GO_official_cold_start"
  STATE_FILE="$STATE_DIR/state.json"
  if [[ -f "$STATE_FILE" ]]; then
    mv "$STATE_FILE" "${STATE_FILE}.bak.${STAMP}" || true
    ok "moved STATE cache aside (DB untouched)"
  fi
  node "$ROOT/scripts/dev/run-official-cold-start-dataset.cjs" 2>&1 | tee -a "$EVID/bootstrap-1-${STAMP}.log" | tee -a "$LOG" \
    || fail "OCS bootstrap pass 1"
  # Second pass: clear STATE again
  [[ -f "$STATE_FILE" ]] && mv "$STATE_FILE" "${STATE_FILE}.pass1.${STAMP}" || true
  node "$ROOT/scripts/dev/run-official-cold-start-dataset.cjs" 2>&1 | tee -a "$EVID/bootstrap-2-${STAMP}.log" | tee -a "$LOG" \
    || fail "OCS bootstrap pass 2"
  echo "TT_PSG_BOOTSTRAP_X2: PASS" | tee -a "$LOG"
fi

# 5 · CMS Publish lifecycle stub (P0③ — fail if Guest can see non-published when probe exists)
step "5 CMS Publish lifecycle (P0③ gate)"
node "$ROOT/scripts/gates/check-psg-cms-lifecycle.cjs" 2>&1 | tee -a "$LOG" \
  || fail "CMS lifecycle P0③"

# 6 · COS reference integrity stub (P0④)
step "6 COS Verify (P0④ gate)"
node "$ROOT/scripts/gates/check-psg-cos-reference-integrity.cjs" 2>&1 | tee -a "$LOG" \
  || fail "COS integrity P0④"

# 7 · API Contract + Public Data isolation (P0⑤ partial)
step "7 API Contract / Public Data (P0⑤)"
node "$ROOT/scripts/gates/check-psg-public-data-isolation.cjs" 2>&1 | tee -a "$LOG" \
  || fail "public data isolation P0⑤"

# 8 · Public Surface Audit (Guest unique=10 Acq/Provider hard)
step "8b Public Surface Matrix (Home/Guides/Community/...)"
# Structural-only when bootstrap skipped (local green); full Staging matrix requires PSG_FORCE_STAGING_MATRIX=1
if [[ "$SKIP_BOOT" == "1" && "${PSG_FORCE_STAGING_MATRIX:-}" != "1" ]]; then
  ok "matrix structural-only (set PSG_FORCE_STAGING_MATRIX=1 to hit Staging)"
  ( unset STAGING_API_BASE API_BASE; node "$ROOT/scripts/gates/check-psg-public-surface-matrix.cjs" ) 2>&1 | tee -a "$LOG"     || fail "PSG public surface matrix structural"
else
  STAGING_API_BASE="$API" node "$ROOT/scripts/gates/check-psg-public-surface-matrix.cjs" 2>&1 | tee -a "$LOG"     || fail "PSG public surface matrix"
fi


step "8 Public Surface Audit + Guest Runtime"
STAGING_API_BASE="$API" node "$ROOT/scripts/gates/check-ocs-market-listing-idempotency.cjs" 2>&1 | tee -a "$LOG" \
  || fail "Guest unique=10 / surface audit"

# 9 · Runtime SHA match (optional expect)
step "9 Runtime SHA"
META="$(curl --noproxy '*' -sS --max-time 45 "$API/meta" || true)"
[[ -n "$META" ]] || fail "/meta unreachable"
REMOTE_SHA="$(printf '%s' "$META" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const d=JSON.parse(s);const b=d.build||{};process.stdout.write(String(b.git_sha||d.git_sha||''))})" 2>/dev/null || true)"
ok "remote /meta.git_sha=${REMOTE_SHA:-unknown}"
if [[ -n "${PSG_EXPECT_SHA:-}" ]]; then
  echo "$REMOTE_SHA" | grep -qi "^${PSG_EXPECT_SHA}" \
    || fail "remote SHA $REMOTE_SHA != expect $PSG_EXPECT_SHA"
  ok "SHA matches PSG_EXPECT_SHA"
fi

# Evidence LATEST
node -e "
const fs=require('fs');const p=process.argv[1];
const j={schema:'traveltrust.psg_runtime_certification.v1',machine_key:'TT_PSG_RUNTIME_CERT',
status:process.argv[2]==='1'?'PASS_READONLY_PARTIAL':'PASS',stamp_utc:process.argv[3],
local_sha:process.argv[4],remote_sha:process.argv[5]||null,production_go:'NO_GO',pf_step5:'FROZEN',
bootstrap_skipped:process.argv[2]==='1'};
fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
" "$EVID/PSG-RUNTIME-CERT-LATEST.json" "$SKIP_BOOT" "$STAMP" "$LOCAL_SHA" "${REMOTE_SHA:-}"

if [[ "$SKIP_BOOT" == "1" ]]; then
  echo "TT_PSG_RUNTIME_CERT: PASS_READONLY_PARTIAL (bootstrap skipped — not full Deploy PASS)" | tee -a "$LOG"
  exit 0
fi
echo "TT_PSG_RUNTIME_CERT: PASS" | tee -a "$LOG"
echo "NOTE: PASS ≠ Production GO · PF Step 5 still FROZEN until Board Exit" | tee -a "$LOG"
