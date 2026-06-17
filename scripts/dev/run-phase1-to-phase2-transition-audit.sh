#!/usr/bin/env bash
# Phase ① → Phase ② Transition Audit（机读 · 非 C1～C12 实施）
#
# 用法（仓库根）：
#   bash scripts/dev/run-phase1-to-phase2-transition-audit.sh
#
# 产出：
#   evidence/GO_phase2_testnet_20260526/transition-audit/latest/
#   docs/runbook/PHASE2-READY-REPORT.md（由本脚本覆写摘要段）
#
# 合法宣称：exit 0 + 末行 TT_PHASE2_TRANSITION_AUDIT: OK = ①→② 过渡审计机读通过
#           **不** 等于 Phase ② C1～C12 已实施 / staging GO（仍须 G-1/G-2 + staging）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EV="$ROOT/evidence/GO_phase2_testnet_20260526/transition-audit/latest"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$EV"

REPORT="$ROOT/docs/runbook/PHASE2-READY-REPORT.md"
AUDIT_SSOT="$ROOT/docs/runbook/PHASE1-TO-PHASE2-TRANSITION-AUDIT.md"

FAILS=0
WARNS=0
pass() { log "PASS: $*"; }
fail() { log_err "FAIL: $*"; FAILS=$((FAILS + 1)); }
warn() { log_err "WARN: $*"; WARNS=$((WARNS + 1)); }

run_section() {
  local id="$1" title="$2"
  log ""
  log "== [$id] $title =="
}

{
  echo "# Transition audit run · $STAMP (UTC)"
  echo "# cmd: bash scripts/dev/run-phase1-to-phase2-transition-audit.sh"
  echo ""
} >"$EV/run.log"

log() { echo "$@" | tee -a "$EV/run.log"; }
log_err() { echo "$@" | tee -a "$EV/run.log" >&2; }

log "run-phase1-to-phase2-transition-audit: START $STAMP"

# --- T1 · Phase ① 社区 + G-08 ---
run_section T1 "Phase ① community evidence + G-08"
NARROW="$ROOT/frontend/evidence/GO_local_community_phase1_narrow"
G08="$ROOT/frontend/evidence/GO_local_phase1/acceptance.latest.log"
for pair in vitest-community-l5:82 e2e-narrow:13 e2e-l5-all:42 e2e-pi1-community-all:8 e2e-publishdrawer-minio:3; do
  f="${pair%%:*}"; exp="${pair##*:}"
  got=$(grep -oE '[0-9]+ passed' "$NARROW/${f}.latest.log" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo 0)
  if [[ "$got" == "$exp" ]]; then pass "$f $got passed"; else fail "$f expected $exp got $got"; fi
done
if [[ -f "$G08" ]] && grep -q "TT_GO_LOCAL_PHASE1: OK" "$G08"; then
  pass "G-08 acceptance.latest.log OK ($(grep recorded= "$G08" | tail -1))"
else
  fail "G-08 missing or not OK — run record-go-local-phase1-acceptance-log.sh"
fi

# --- T2 · PHASE1-FREEZE 文档 ---
run_section T2 "PHASE1-FREEZE baseline"
for f in \
  "$ROOT/frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md" \
  "$ROOT/docs/runbook/PHASE2-REPOSITORY-STATUS.md" \
  "$ROOT/docs/runbook/PHASE2-START-CHECKLIST.md"; do
  [[ -f "$f" ]] && pass "exists $(basename "$f")" || fail "missing $f"
done

# --- T3 · 04 路由闸（C11 同源 · STRICT_WARNINGS=1）---
run_section T3 "04 routes gate (API inventory vs spec · C11)"
if bash "$ROOT/scripts/run-check-04-routes.sh" >"$EV/check-04-routes.log" 2>&1; then
  pass "run-check-04-routes.sh exit 0"
else
  fail "run-check-04-routes.sh — 04 §3.4 与挂载路由漂移（见 check-04-routes.log · 阻塞 C11/READY）"
  grep -E '^\s+\?' "$EV/check-04-routes.log" 2>/dev/null | head -20 >>"$EV/check-04-routes.log" || true
fi

# --- T4 · Migrations count + optional sqlx ---
run_section T4 "SQL migrations"
MIG_DIR="$ROOT/crates/api/migrations"
cnt=$(find "$MIG_DIR" -maxdepth 1 -name '*.sql' | wc -l | tr -d ' ')
pass "migration files count=$cnt"
if [[ -z "${DATABASE_URL:-}" && -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env" 2>/dev/null || true
  set +a
fi
if [[ -n "${DATABASE_URL:-}" ]]; then
  if (cd "$ROOT/crates/api" && sqlx migrate info >"$EV/sqlx-migrate-info.log" 2>&1); then
    pass "sqlx migrate info (DATABASE_URL set)"
  else
    warn "sqlx migrate info failed — see sqlx-migrate-info.log"
  fi
else
  warn "DATABASE_URL unset — skip sqlx migrate info (empty→latest 须在 staging PG 或本机 docker 复验)"
fi

# --- T5 · Local-only / staging 禁配清单（机读 grep 旁证）---
run_section T5 "Local-only guards inventory"
rg -n 'SEED_TEST_ACCOUNTS|seed-test-accounts|TRAVELTRUST_ONBOARDING_LOCAL_DEV|P3_CHAIN_OFF|chain_off' \
  "$ROOT/crates/api/src/main.rs" \
  "$ROOT/crates/api/src/routes/auth.rs" \
  "$ROOT/crates/api/src/routes/onboarding/local_dev.rs" \
  >"$EV/local-only-anchors.txt" 2>/dev/null || true
[[ -s "$EV/local-only-anchors.txt" ]] && pass "local-only anchors captured ($(wc -l <"$EV/local-only-anchors.txt") lines)" || warn "local-only grep empty"
rg -o 'TRAVELTRUST_[A-Z0-9_]+' "$ROOT/crates/api/src" -g '*.rs' --no-heading 2>/dev/null \
  | sort -u >"$EV/traveltrust-env-flags.txt" || true
fc=$(wc -l <"$EV/traveltrust-env-flags.txt" | tr -d ' ')
pass "TRAVELTRUST_* env symbols uniq=$fc → $EV/traveltrust-env-flags.txt"

# --- T6 · Storage / 隔离 ---
run_section T6 "Storage paths + G-1 template"
[[ -f "$ROOT/docs/runbook/PHASE2-G1-ENV-ISOLATION-DECISION.md" ]] && pass "G-1 decision template" || fail "missing G-1 template"
[[ -f "$ROOT/docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md" ]] && pass "community storage runbook" || warn "COMMUNITY-MEDIA-OBJECT-STORAGE.md missing"
[[ -f "$ROOT/scripts/dev/staging-onboarding.env.example" ]] && pass "staging env example" || fail "missing staging-onboarding.env.example"

# --- T7 · Golden paths（脚本存在 + ① 烟测入口）---
run_section T7 "Golden paths (① scripts)"
[[ -f "$ROOT/scripts/evidence/run-community-phase1-local-evidence.sh" ]] \
  && pass "scripts/evidence/run-community-phase1-local-evidence.sh" \
  || fail "missing scripts/evidence/run-community-phase1-local-evidence.sh"
for s in \
  smoke-provider-onboarding-local.sh \
  smoke-acquisition-pd009-local.sh \
  run-go-local-phase1-acceptance.sh; do
  [[ -f "$ROOT/scripts/dev/$s" ]] && pass "scripts/dev/$s" || fail "missing scripts/dev/$s"
done

# --- T8 · SSOT 互指 ---
run_section T8 "Community SSOT docs"
for d in COMMUNITY-L5-CLOSURE.md COMMUNITY-L5-SYSTEM-AUDIT.md COMMUNITY-PHASE-2-3-ROADMAP.md; do
  [[ -f "$ROOT/frontend/evidence/GO_local_marketing_front_closure/$d" ]] && pass "$d" || fail "missing $d"
done
[[ -f "$ROOT/docs/go-live-checklist.md" ]] && pass "go-live-checklist.md" || fail "missing go-live-checklist"

# --- T9 · Phase ② 开工闸（预期 FAIL 直至 staging）---
run_section T9 "Phase ② start gates (G-1/G-2 — expected OPEN pre-staging)"
if bash "$ROOT/scripts/dev/check-phase2-onboarding-staging-ready.sh" >"$EV/check-phase2-staging-ready.log" 2>&1; then
  pass "check-phase2-onboarding-staging-ready.sh (staging env configured)"
else
  warn "check-phase2-onboarding-staging-ready.sh not ready — expected until .env.staging-onboarding.local"
  tail -2 "$EV/check-phase2-staging-ready.log" || true
fi

# --- 汇总 ---
STAGING_READY=0
if bash "$ROOT/scripts/dev/check-phase2-onboarding-staging-ready.sh" >>"$EV/check-phase2-staging-ready.log" 2>&1; then
  STAGING_READY=1
fi

log ""
if [[ "$FAILS" -eq 0 ]]; then
  log "TT_PHASE2_TRANSITION_AUDIT: OK (①→② transition · fails=0 warns=$WARNS)"
  if [[ "$STAGING_READY" -eq 1 ]]; then
    log "TT_PHASE2_READY_VERDICT: READY_FOR_C1_C12 (transition OK + staging preflight OK)"
  else
    log "TT_PHASE2_READY_VERDICT: READY_PENDING_STAGING (transition OK · G-1/G-2/staging preflight OPEN — no C1～C12 GO)"
  fi
  log "  evidence: $EV/"
  log "  SSOT: $AUDIT_SSOT"
  exit 0
else
  log "TT_PHASE2_TRANSITION_AUDIT: FAIL (fails=$FAILS warns=$WARNS)"
  log "TT_PHASE2_READY_VERDICT: NOT_READY"
  exit 1
fi
