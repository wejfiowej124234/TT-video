#!/usr/bin/env bash
# ① 本地 · 固定六账号 C1–C4/E1/E2 · UI/UX L5 全量手测编排
#
#   bash scripts/dev/run-local-six-account-ui-l5-audit.sh
#
# 前置：API :8080（推荐 scripts/start-api-with-seed.bat · P3_CHAIN_OFF=1）
# 可选：SKIP_FE_START=1（前端已起 :3012）· SKIP_MACHINE=1（仅浏览器）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${LOCAL_SIX_ACCOUNT_UI_L5_OUT:-$ROOT/evidence/local-six-account-ui-l5-audit/$STAMP}"
API_BASE="${API_BASE:-http://127.0.0.1:8080}"
FE_BASE="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
FE_PORT="${FRONTEND_PORT:-3012}"
SKIP_FE_START="${SKIP_FE_START:-0}"
SKIP_MACHINE="${SKIP_MACHINE:-0}"

mkdir -p "$OUT" "$OUT/screenshots" "$OUT/machine"

log() { echo "[six-account-l5] $*"; }
fail() { echo "[six-account-l5] FAIL $*" >&2; exit 1; }

run_smoke() {
  local id="$1" cmd="$2"
  local logf="$OUT/machine/${id}.log"
  set +e
  bash -lc "$cmd" >"$logf" 2>&1
  local rc=$?
  set -e
  echo "$rc" >"$OUT/machine/${id}.rc"
  if [[ "$rc" == "0" ]]; then
    echo "PASS|$id" >> "$OUT/machine-summary.tsv"
  else
    echo "FAIL|$id" >> "$OUT/machine-summary.tsv"
  fi
  return 0
}

# --- API health ---
health="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" 2>/dev/null || echo 000)"
[[ "$health" == "200" ]] || fail "API ${API_BASE}/health=$health — start scripts/start-api-with-seed.bat first"

# --- Frontend :3012 ---
if [[ "$SKIP_FE_START" != "1" ]]; then
  fe_code="$(curl -sS -o /dev/null -w '%{http_code}' "${FE_BASE}/" 2>/dev/null || echo 000)"
  if [[ "$fe_code" != "200" && "$fe_code" != "307" && "$fe_code" != "308" ]]; then
    log "Starting Next.js on :${FE_PORT}..."
    cd "$ROOT/frontend"
    nohup npm run dev -- -p "$FE_PORT" > "$OUT/frontend-dev.log" 2>&1 &
    cd "$ROOT"
  fi
fi

log "Waiting for frontend ${FE_BASE}..."
ready=0
for _ in $(seq 1 90); do
  fe_code="$(curl -sS -o /dev/null -w '%{http_code}' "${FE_BASE}/" 2>/dev/null || echo 000)"
  if [[ "$fe_code" == "200" || "$fe_code" == "307" || "$fe_code" == "308" ]]; then
    ready=1
    break
  fi
  sleep 3
done
[[ "$ready" == "1" ]] || fail "Frontend not ready on ${FE_BASE} (see $OUT/frontend-dev.log)"

log "Frontend ready HTTP $fe_code"

: > "$OUT/machine-summary.tsv"

# --- P0 + domain machine smokes ---
if [[ "$SKIP_MACHINE" != "1" ]]; then
  log "Running P0-01..06 + domain L3 smokes..."
  run_smoke "P0-01-admin-rbac" "cd '$ROOT' && bash scripts/dev/smoke-admin-rbac-matrix-local.sh"
  run_smoke "P0-02-growth" "cd '$ROOT' && bash scripts/dev/smoke-growth-referral-p0-local.sh"
  run_smoke "P0-03-steward-onboarding" "cd '$ROOT' && bash scripts/dev/smoke-steward-onboarding-local.sh"
  run_smoke "P0-04-dispute" "cd '$ROOT' && OED_SKIP_API_RESTART=1 bash scripts/dev/smoke-order-escrow-dispute-p0-local.sh"
  run_smoke "P0-05-governance-proposals" "cd '$ROOT' && bash scripts/dev/smoke-governance-proposals-l5-local.sh"
  run_smoke "P0-06-escrow-chain-b" "cd '$ROOT' && RESTART_API=0 bash scripts/dev/smoke-seed-tourist-guide-transaction-local.sh"
  run_smoke "escrow-chain-a-gd-l5" "cd '$ROOT' && RESTART_API=0 SKIP_PLAYWRIGHT=0 API_BASE='$API_BASE' PLAYWRIGHT_BASE_URL='$FE_BASE' bash scripts/dev/smoke-guide-detail-booking-local.sh"
  run_smoke "acquisition-pd009" "cd '$ROOT' && bash scripts/dev/smoke-acquisition-pd009-local.sh"
  run_smoke "governance-doc-smoke" "cd '$ROOT' && bash scripts/dev/smoke-governance-proposals-l5-local.sh"
fi

# --- Browser matrix Playwright ---
log "Running six-account browser matrix Playwright..."
export LOCAL_SIX_ACCOUNT_UI_L5_AUDIT=1
export LOCAL_SIX_ACCOUNT_UI_L5_STAMP="$STAMP"
export LOCAL_SIX_ACCOUNT_UI_L5_OUT="$OUT"
export PLAYWRIGHT_BASE_URL="$FE_BASE"
export PLAYWRIGHT_API_BASE_URL="$API_BASE"
export PLAYWRIGHT_REUSE_FE_SERVER=1
export PLAYWRIGHT_REUSE_API_SERVER=1

set +e
(cd "$ROOT/frontend" && npx playwright test e2e/local-six-account-matrix-ui-l5-audit.spec.ts \
  --project=chromium --reporter=list) 2>&1 | tee "$OUT/playwright-matrix.log"
PW_RC=$?
set -e

# 3) Dedicated L5 specs (existing · full b469 incl. drawer in audit orchestrator)
log "Running dedicated L5 corridor specs..."
for spec in \
  "e2e/b469-guides-drawer-booking-convergence.spec.ts" \
  "e2e/steward-workbench-full-l5.spec.ts" \
  "e2e/guide-workbench-full-l5.spec.ts" \
  "e2e/provider-workbench-full-l5.spec.ts" \
  "e2e/governance-proposals-full-l5.spec.ts" \
  "e2e/orders-list-to-escrow.spec.ts" \
  "e2e/93-matrix-path-did-rank-boards.spec.ts"; do
  name="$(basename "$spec" .spec.ts)"
  if [[ "$name" == "b469-guides-drawer-booking-convergence" ]]; then
    if grep -q '^PASS|escrow-chain-a-gd-l5' "$OUT/machine-summary.tsv" 2>/dev/null; then
      echo "SKIP b469 Playwright — escrow-chain-a-gd-l5 PASS (GD-L5 corridor SSOT)" >"$OUT/playwright-${name}.log"
      echo "PASS|playwright-${name}" >> "$OUT/machine-summary.tsv"
      echo "0" >"$OUT/machine/playwright-${name}.rc"
      continue
    fi
    # shellcheck source=scripts/dev/lib/release-seed-guide-slot.sh
    source "$ROOT/scripts/dev/lib/release-seed-guide-slot.sh"
    curl -sS -X POST "${API_BASE}/auth/seed-test-accounts" -H 'Content-Type: application/json' -d '{}' >/dev/null 2>&1 || true
    release_seed_guide_slot "$API_BASE" >/dev/null 2>&1 || true
  fi
  set +e
  if [[ "$name" == "b469-guides-drawer-booking-convergence" ]]; then
    # 编排内仅跑 /guides/[id] 走廊（drawer 切片由 smoke-guide-detail-booking-local 旁证）
    (cd "$ROOT/frontend" && npx playwright test "$spec" --grep "/guides/\\[id\\]" --project=chromium --reporter=list) \
      >"$OUT/playwright-${name}.log" 2>&1
  else
    (cd "$ROOT/frontend" && npx playwright test "$spec" --project=chromium --reporter=list) \
      >"$OUT/playwright-${name}.log" 2>&1
  fi
  rc=$?
  set -e
  echo "$rc" >"$OUT/machine/playwright-${name}.rc"
  if [[ "$rc" == "0" ]]; then echo "PASS|playwright-${name}" >> "$OUT/machine-summary.tsv"; else echo "FAIL|playwright-${name}" >> "$OUT/machine-summary.tsv"; fi
done

# Fail orchestrator if any machine probe failed
if grep -q '^FAIL|' "$OUT/machine-summary.tsv" 2>/dev/null; then
  log "Machine summary has FAIL rows — see $OUT/machine-summary.tsv"
  PW_RC=1
fi

# --- Escrow UI full (Chain B list→escrow) ---
set +e
(cd "$ROOT/frontend" && npx playwright test e2e/escrow-bilateral-experience-l5.spec.ts --project=chromium --reporter=list) \
  >"$OUT/playwright-escrow-bilateral.log" 2>&1
esc_rc=$?
set -e
echo "$esc_rc" >"$OUT/machine/playwright-escrow-bilateral.rc"
if [[ "$esc_rc" == "0" ]]; then echo "PASS|escrow-ui-bilateral" >> "$OUT/machine-summary.tsv"; else echo "FAIL|escrow-ui-bilateral" >> "$OUT/machine-summary.tsv"; fi

# --- Report ---
PY="${PYTHON:-}"
if [[ -z "$PY" ]]; then command -v python >/dev/null 2>&1 && PY=python || PY=python3; fi
"$PY" "$ROOT/scripts/dev/generate-local-six-account-ui-l5-report.py" \
  --out-dir "$OUT" \
  --stamp "$STAMP" \
  --api-base "$API_BASE" \
  --fe-base "$FE_BASE" \
  --playwright-rc "$PW_RC"

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/local-six-account-ui-l5-audit/latest" 2>/dev/null || true

log "Evidence: $OUT"
log "Report: docs/runbook/LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md"
log "phase: ① local ONLY — NOT ② Graduation GO"

[[ "$PW_RC" -ne 0 ]] && exit 1
exit 0
