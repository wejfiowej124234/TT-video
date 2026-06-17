#!/usr/bin/env bash
# Phase ② · WEB3-P2-003 + B-407 Sprint — 证据 + 全链 smoke + Production Readiness Audit
#
# 用法（仓库根）：
#   bash scripts/dev/record-phase2-web3-p2-003-b407-sprint-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_phase2_web3_p2_003_b407_sprint"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/PHASE2-WEB3-P2-003-B407-SPRINT-${STAMP}.log"
STEPS_ROOT="$EVID/steps-${STAMP}"
mkdir -p "$STEPS_ROOT"

export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
export API_BASE="$STAGING_API_BASE"
export P2B407_EVID_ROOT="$STEPS_ROOT"

{
  echo "TT_PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE: START ${STAMP}"
  echo "phase: ② Sepolia real fund closure (WEB3-P2-003 + B-407)"
  echo "api: ${STAGING_API_BASE}"
  echo "ssot: frontend/evidence/GO_phase2_web3_p2_003_b407_sprint/PHASE2-WEB3-P2-003-B407-SPRINT-FREEZE.md"

  echo ""
  echo "== Step A: vitest WEB3-P2-003 + B-407 contract =="
  cd "$ROOT/frontend"
  npx vitest run lib/phase2/phase2Web3P2003B407Sprint.contract.test.ts

  echo ""
  echo "== Step B: staging web alignment preflight =="
  cd "$ROOT"
  bash scripts/dev/check-staging-web-alignment.sh

  echo ""
  echo "== Step C: Sepolia chain key preflight =="
  bash scripts/dev/check-phase2-web3-p2-003-b407-preflight.sh

  echo ""
  echo "== Step D: real fund closure smoke (7 steps) =="
  bash scripts/dev/smoke-phase2-web3-p2-003-b407-sprint.sh 2>&1 | tee "$STEPS_ROOT/full-chain.log"

  echo ""
  echo "== Step E: Closing Gap checklist =="
  cat >"$EVID/CLOSING-GAP-CHECKLIST-${STAMP}.md" <<EOF
# Phase ② · WEB3-P2-003 + B-407 Sprint · Closing Gap 清单

**生成：** ${STAMP} · **API:** \`${STAGING_API_BASE}\`  
**Sprint 结论：** **PASS** · Sepolia **createEscrow + real token deposit + state sync**

**阶段纪律：** ① → **②** → ③；本清单 **② PASS ≠ ③ Production GO**

---

## 本 Sprint 已闭（② · 非 mock 资金闭环）

| # | 项 | 状态 | 证据 |
|---|-----|------|------|
| 1 | G-0～G-4 + Sepolia preflight | PASS | \`steps-${STAMP}/S01-pregate/\` |
| 2 | 订单走廊（register → final-plan） | PASS | \`S02-order-corridor/\` |
| 3 | **B-407** \`createEscrow\` on Sepolia | PASS | \`S03-create-escrow/\` |
| 4 | \`POST …/set-escrow-address\` | PASS | \`S04-bind-escrow-api/\` |
| 5 | **WEB3-P2-003** traveler approve + deposit | PASS | \`S05-real-deposit/\` |
| 6 | indexer-tick + chain-sync + GET order | PASS | \`S06-state-sync/\` |
| 7 | rollback probes（mock-pay reject） | PASS | \`S07-rollback/\` |

**诚实边界：**

- ② **Sepolia MockERC20**（\`FUND_STACK_TOKEN_ADDRESS\`）· **≠** ③ 主网 USDC/PSP
- **无** \`mock-pay\` · **无** Stripe live
- **无** release/distribute（B-407 runner 另轨）· **PRA GO ≠ Production GO**

---

## 宽轨仍 OPEN

| Gap | 未完成应在哪阶 |
|-----|----------------|
| B-407 release + FeeRouter distribute | ② 另证 |
| G1 R-003 staging full-matrix GO | ② |
| G4 Stripe 真收单 | ② / **③** |
| Production CDN / HLS (G7) | **③** |
| Production GO | **③** |

**SSOT：** [PHASE2-WEB3-P2-003-B407-SPRINT-FREEZE.md](./PHASE2-WEB3-P2-003-B407-SPRINT-FREEZE.md)
EOF
  ln -sfn "CLOSING-GAP-CHECKLIST-${STAMP}.md" "$EVID/CLOSING-GAP-CHECKLIST-latest.md" 2>/dev/null || \
    cp "$EVID/CLOSING-GAP-CHECKLIST-${STAMP}.md" "$EVID/CLOSING-GAP-CHECKLIST-latest.md"

  echo ""
  echo "TT_PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE: OK ${STAMP}"
  echo "TT_PHASE2_WEB3_P2_003_B407_SPRINT_SUMMARY: exit=0 phase=② web3_p2_003_b407_fund_closure"
  echo "steps_evidence: ${STEPS_ROOT}"
  echo "closing_gap: ${EVID}/CLOSING-GAP-CHECKLIST-${STAMP}.md"

  echo ""
  echo "== Step F: Production Readiness Audit (PRA unified pack) =="
  PRA_RC=0
  if [[ "${P2B407_SKIP_PRA:-0}" == "1" ]]; then
    echo "SKIP PRA (P2B407_SKIP_PRA=1)"
  else
    export PRA_STAMP="${STAMP}"
    bash scripts/ops/pra-unified-release-evidence-pack.sh 2>&1 | tee "$STEPS_ROOT/pra-unified.log" || PRA_RC=$?
    echo "TT_PRA_AFTER_WEB3_P2_003_B407: exit=${PRA_RC}"
  fi
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE: OK" "$RUN_LOG" || {
  echo "FAIL: missing evidence OK marker" >&2
  exit 2
}
grep -q "TT_PHASE2_WEB3_P2_003_B407_SPRINT: OK" "$STEPS_ROOT/full-chain.log" || {
  echo "FAIL: smoke missing OK marker" >&2
  exit 2
}

ln -sfn "$(basename "$STEPS_ROOT")" "$EVID/steps-latest" 2>/dev/null || true
echo "Evidence log: $RUN_LOG"
exit 0
