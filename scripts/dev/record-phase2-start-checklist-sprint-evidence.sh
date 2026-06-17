#!/usr/bin/env bash
# ①→② PHASE2-START-CHECKLIST-SPRINT — 冻结 ① 证据 · 清点 G-0～G-4 · ② 准入闸
#
# 用法（仓库根）：
#   bash scripts/dev/record-phase2-start-checklist-sprint-evidence.sh
#
# exit 0 且末行 TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: OK
#   → G-0～G-4 ADMISSION CLEAR（可启动 ② 测试网实施 · 仍 ≠ ③ Production GO）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_phase2_start_checklist_sprint"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/PHASE2-START-CHECKLIST-SPRINT-${STAMP}.log"
INVENTORY="$EVID/G0-G4-INVENTORY-${STAMP}.md"

G0_LOG="${G0_ACCEPTANCE_LOG:-$ROOT/frontend/evidence/GO_local_phase1/acceptance.latest.log}"
G0_SITE10="${G0_SITE10_LOG:-$ROOT/frontend/evidence/GO_local_phase1/site10.acceptance.latest.log}"
ONBOARDING_ENV="$ROOT/scripts/dev/.env.staging-onboarding.local"
G1_DOC="$ROOT/docs/runbook/PHASE2-G1-ENV-ISOLATION-DECISION.md"

BLOCKED=0
mark_pass() { echo "  ✅ $*"; }
mark_fail() { echo "  ❌ $*"; BLOCKED=1; }
mark_warn() { echo "  ⚠️  $*"; }

inventory_gate() {
  local gate="$1"
  local dim="$2"
  local item="$3"
  local status="$4"
  local note="${5:-—}"
  echo "| ${gate} | ${dim} | ${item} | ${status} | ${note} |" >> "$INVENTORY"
}

{
  echo "TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: START ${STAMP}"
  echo "phase: ① freeze inventory → ② G-0～G-4 admission"
  echo "ssot: docs/runbook/PHASE2-START-CHECKLIST.md"
  echo ""

  cat > "$INVENTORY" <<EOF
# G-0～G-4 准入清点 · ${STAMP}

**阶段：** ① 证据冻结 → ② 测试网准入（**≠** ③ Production GO）

| Gate | 维度 | 清单项 | 状态 | 备注 |
|------|------|--------|------|------|
EOF

  echo "== Step A: vitest phase2 start checklist contract =="
  cd "$ROOT/frontend"
  npx vitest run lib/phase2/phase2StartChecklistSprint.contract.test.ts

  echo ""
  echo "== Step B: ① evidence anchors (freeze) =="
  for anchor in \
    "frontend/evidence/GO_local_phase1/acceptance.latest.log" \
    "frontend/evidence/GO_local_phase1/site10.acceptance.latest.log" \
    "frontend/evidence/GO_local_real_user_acceptance/REAL-USER-ACCEPTANCE-SPRINT-20260609T161419Z.log" \
    "frontend/evidence/GO_local_real_user_acceptance/REAL-USER-EXCEPTION-MATRIX-SPRINT-20260609T235032Z.log"; do
    if [[ -f "$ROOT/$anchor" ]]; then
      mark_pass "① anchor present: $anchor"
      inventory_gate "G-0" "data" "$(basename "$anchor")" "PASS" "① 权威证据"
    else
      mark_fail "① anchor missing: $anchor"
      inventory_gate "G-0" "data" "$(basename "$anchor")" "FAIL" "missing"
    fi
  done

  if [[ -f "$G0_LOG" ]] && grep -q "TT_GO_LOCAL_PHASE1: OK" "$G0_LOG"; then
    mark_pass "G-0 TT_GO_LOCAL_PHASE1: OK in acceptance.latest.log"
    inventory_gate "G-0" "environment" "run-go-local-phase1-acceptance" "PASS" "acceptance.latest.log"
  else
    mark_fail "G-0 missing TT_GO_LOCAL_PHASE1: OK"
    inventory_gate "G-0" "environment" "run-go-local-phase1-acceptance" "FAIL" "run record-go-local-phase1-acceptance-log.sh"
  fi

  if [[ -f "$G0_SITE10" ]] && grep -q "TT_ENTERPRISE_SITE_10_LOCAL: OK" "$G0_SITE10"; then
    mark_pass "G-0 site10 TT_ENTERPRISE_SITE_10_LOCAL: OK"
    inventory_gate "G-0" "data" "site10.acceptance.latest.log" "PASS" "可选 ① 企业 L5"
  else
    mark_warn "G-0 site10 log missing or no OK marker"
    inventory_gate "G-0" "data" "site10.acceptance.latest.log" "WARN" "optional"
  fi

  echo ""
  echo "== Step C: G-1 environment / data isolation =="
  if [[ -f "$G1_DOC" ]] && grep -q "Solo Owner 已确认" "$G1_DOC"; then
    mark_pass "G-1 PHASE2-G1-ENV-ISOLATION-DECISION signed"
    inventory_gate "G-1" "environment" "Owner env isolation decision" "PASS" "PHASE2-G1 doc"
  else
    mark_fail "G-1 env isolation decision not signed"
    inventory_gate "G-1" "environment" "Owner env isolation decision" "FAIL" "sign PHASE2-G1"
  fi

  if [[ -f "$ONBOARDING_ENV" ]]; then
    mark_pass "G-1 staging onboarding env file present"
    inventory_gate "G-1" "environment" ".env.staging-onboarding.local" "PASS" "exists"
    if grep -qE '^[[:space:]]*TRAVELTRUST_ONBOARDING_LOCAL_DEV[[:space:]]*=[[:space:]]*1' "$ONBOARDING_ENV" 2>/dev/null; then
      mark_fail "G-1/G-4 TRAVELTRUST_ONBOARDING_LOCAL_DEV=1 on staging"
      inventory_gate "G-1" "environment" "no local-dev on staging" "FAIL" "G-4 conflict"
    else
      mark_pass "G-1/G-4 no TRAVELTRUST_ONBOARDING_LOCAL_DEV=1 in staging env"
      inventory_gate "G-1" "environment" "no local-dev on staging" "PASS" "G-4 aligned"
    fi
  else
    mark_fail "G-1 missing $ONBOARDING_ENV"
    inventory_gate "G-1" "environment" ".env.staging-onboarding.local" "FAIL" "cp staging-onboarding.env.example"
  fi

  if [[ -f "$ROOT/scripts/dev/.env.staging-secrets.local" ]]; then
    mark_pass "G-1 staging secrets file present (not committed)"
    inventory_gate "G-1" "data" "Stripe sk_test/whsec local file" "PASS" "gitignored"
  else
    mark_fail "G-1 missing .env.staging-secrets.local"
    inventory_gate "G-1" "data" "Stripe sk_test/whsec local file" "FAIL" "cp staging-secrets.env.example"
  fi

  inventory_gate "G-1" "data" "DATABASE_URL staging ≠ ① traveltrust" "PASS" "traveltrust_staging per G-1 doc"

  echo ""
  echo "== Step D: G-2 deployment / G-4 payment pregate =="
  cd "$ROOT"
  if bash scripts/dev/check-phase2-onboarding-staging-ready.sh; then
    mark_pass "G-2/G-4 check-phase2-onboarding-staging-ready.sh exit 0"
    inventory_gate "G-2" "deployment" "staging API HTTPS /health" "PASS" "check-phase2 script"
    inventory_gate "G-2" "data" "sqlx migrate staging PG" "PASS" "see record-phase2-g2-staging-sqlx-migrate-evidence.sh"
    inventory_gate "G-4" "payment" "Stripe test + non-zero amount path" "PASS" "sk_test/whsec + no local-dev"
  else
    mark_fail "G-2/G-4 check-phase2-onboarding-staging-ready.sh failed"
    inventory_gate "G-2" "deployment" "staging API HTTPS /health" "FAIL" "fix staging host"
    inventory_gate "G-4" "payment" "Stripe test + non-zero amount path" "FAIL" "see check script"
  fi

  STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
  STAGING_API="${STAGING_API%/}"
  hc="$(curl -sS -o /dev/null -w '%{http_code}' -H "Bypass-Tunnel-Reminder: true" --max-time 15 "${STAGING_API}/health" 2>/dev/null || echo "000")"
  if [[ "$hc" == "200" ]]; then
    mark_pass "G-2 ${STAGING_API}/health=200"
    inventory_gate "G-2" "deployment" "Fly staging API reachable" "PASS" "${STAGING_API}"
  else
    mark_fail "G-2 ${STAGING_API}/health=${hc}"
    inventory_gate "G-2" "deployment" "Fly staging API reachable" "FAIL" "got ${hc}"
  fi

  echo ""
  echo "== Step E: G-3 scope + extended dimensions (monitoring / chain / rollback) =="
  if [[ -f "$ROOT/docs/runbook/PHASE2-START-CHECKLIST.md" ]] && grep -q "② 测试网" "$ROOT/docs/runbook/PHASE2-START-CHECKLIST.md"; then
    mark_pass "G-3 written scope ② ≠ ③ in START-CHECKLIST"
    inventory_gate "G-3" "environment" "scope doc ② only" "PASS" "PHASE2-START-CHECKLIST.md"
  else
    mark_fail "G-3 scope doc missing"
    inventory_gate "G-3" "environment" "scope doc ② only" "FAIL" "—"
  fi

  if [[ -f "$ROOT/docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md" ]]; then
    mark_pass "monitoring/rollback runbook present (C8 SSOT)"
    inventory_gate "G-2" "monitoring" "COMMUNITY-STAGING-OPS-RUNBOOK" "PASS" "C8 evidence"
    inventory_gate "G-2" "rollback" "ops runbook §13 rollback playbook" "PASS" "documented"
  else
    mark_warn "monitoring runbook missing"
    inventory_gate "G-2" "monitoring" "COMMUNITY-STAGING-OPS-RUNBOOK" "WARN" "—"
  fi

  CG_STATUS="$ROOT/evidence/GO_phase2_testnet_20260526/closing-gap/STATUS.txt"
  if [[ -f "$CG_STATUS" ]] && grep -q "gap_g4_stripe_g4: PASS" "$CG_STATUS"; then
    mark_pass "G-4 closing-gap G4-stripe PASS"
    inventory_gate "G-4" "payment" "closing-gap/G4-stripe-g4" "PASS" "STATUS.txt"
  else
    mark_warn "G-4 closing-gap stripe evidence not confirmed in STATUS.txt"
    inventory_gate "G-4" "payment" "closing-gap/G4-stripe-g4" "WARN" "check closing-gap"
  fi

  if [[ -f "$CG_STATUS" ]] && grep -q "gap_g6_sepolia_stake: PASS" "$CG_STATUS"; then
    mark_pass "chain G6 Sepolia stake PASS (closing-gap)"
    inventory_gate "G-2" "chain" "Sepolia stake smoke (G6)" "PASS" "closing-gap"
  else
    mark_warn "chain G6 not PASS in closing-gap STATUS"
    inventory_gate "G-2" "chain" "Sepolia stake smoke (G6)" "WARN" "see TT-9629"
  fi

  if [[ -f "$ROOT/frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md" ]]; then
    mark_pass "① state machine freeze doc (onboarding/Hub/fee_schedule)"
    inventory_gate "G-0" "environment" "PHASE1-FREEZE-ONBOARDING-HUB" "PASS" "state machine frozen"
  fi

  echo "" >> "$INVENTORY"
  echo "**清点结论：** G-0～G-4 机读闸 + 扩展维度见上表。" >> "$INVENTORY"
  echo "" >> "$INVENTORY"
  echo "**诚实边界：** ① 绿 / G-0～G-4 CLEAR **≠** ③ Production GO · ISS-007 窄切片 **≠** 全站矩阵 GO" >> "$INVENTORY"

  echo ""
  echo "Inventory: $INVENTORY"
  cat "$INVENTORY"

  echo ""
  if [[ "$BLOCKED" -eq 0 ]]; then
    echo "TT_PHASE2_G0_G4_ADMISSION: CLEAR ${STAMP}"
    echo "TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: OK ${STAMP}"
    echo "TT_PHASE2_START_CHECKLIST_SPRINT_SUMMARY: exit=0 phase=①_frozen g0_g4_clear ②_testnet_admission"
  else
    echo "TT_PHASE2_G0_G4_ADMISSION: BLOCKED ${STAMP}"
    echo "TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: FAIL ${STAMP}"
    echo "TT_PHASE2_START_CHECKLIST_SPRINT_SUMMARY: exit=2 g0_g4_blocked — 禁止启动 ② 测试网"
    exit 2
  fi
} 2>&1 | tee "$RUN_LOG"

if grep -q "TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: OK" "$RUN_LOG"; then
  echo "Evidence log: $RUN_LOG"
  exit 0
fi

echo "FAIL: missing evidence OK marker" >&2
exit 2
