#!/usr/bin/env bash
# Phase ② · PRA-PARTIAL-CLOSING-GAP Sprint — 清零 unified-20260610T044503Z 的 3 项 FAIL
#
#   bash scripts/dev/record-pra-partial-closing-gap-sprint-evidence.sh
#
# 纪律：ops harness only · 不新增业务功能 · 不改主链
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/pra-local-spine-lib.sh
source "$ROOT/scripts/dev/lib/pra-local-spine-lib.sh"

BASELINE_STAMP="${PRA_PARTIAL_BASELINE_STAMP:-20260610T044503Z}"
BASELINE_DIR="$ROOT/evidence/PRODUCTION_READINESS_AUDIT/unified-${BASELINE_STAMP}"
EVID="$ROOT/evidence/PRODUCTION_READINESS_AUDIT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/PRA-PARTIAL-CLOSING-GAP-SPRINT-${STAMP}.log"
CLOSE_DIR="$EVID/pra-partial-closing-${STAMP}"
UNIFIED_DIR="$EVID/unified-${STAMP}"

mkdir -p "$CLOSE_DIR" "$UNIFIED_DIR"

export PRA_STAMP="$STAMP"
export PRA_UNIFIED_DIR="$UNIFIED_DIR"
export PRA_OUT_DIR="$UNIFIED_DIR"
export ROV2_OUT_DIR="$UNIFIED_DIR/rov/wave2"
export B477_API_BASE="${B477_API_BASE:-http://127.0.0.1:8080}"
export PRA_SECURITY_API="${PRA_SECURITY_API:-http://127.0.0.1:8080}"
export B477_RECOVERY_TIMEOUT_SEC="${B477_RECOVERY_TIMEOUT_SEC:-300}"
export B477_WORKERS="${B477_WORKERS:-4}"
export B477_DURATION_SEC="${B477_DURATION_SEC:-10}"
export B477_STRESS_MODE="${B477_STRESS_MODE:-meta_metrics}"
export B477_HTTP_TIMEOUT_SEC="${B477_HTTP_TIMEOUT_SEC:-120}"
export B477_SNAP_RETRIES="${B477_SNAP_RETRIES:-10}"

{
  echo "TT_PRA_PARTIAL_CLOSING_GAP_SPRINT: START ${STAMP}"
  echo "baseline: unified-${BASELINE_STAMP}"
  echo "discipline: ops harness only · no main-chain changes · feature freeze"

  if [[ ! -f "$BASELINE_DIR/unified_manifest.v1.json" ]]; then
    echo "FAIL: missing baseline manifest $BASELINE_DIR/unified_manifest.v1.json" >&2
    exit 2
  fi

  echo ""
  echo "== Step A: baseline failure inventory =="
  node -e "
    const fs=require('fs'); const p=process.argv[1];
    const m=JSON.parse(fs.readFileSync(p,'utf8'));
    const fails=Object.entries(m.phases||{}).filter(([,v])=>v==='FAIL'||v==='HOLD');
    console.log('baseline_overall:', m.overall_verdict, 'failures:', m.failure_count);
    for (const [k,v] of fails) console.log('  FAIL', k, v);
    fs.writeFileSync(process.argv[2], JSON.stringify({baseline_stamp:m.stamp, failures:fails.map(([k,v])=>({id:k,verdict:v}))}, null, 2));
  " "$BASELINE_DIR/unified_manifest.v1.json" "$CLOSE_DIR/baseline_failures.json"

  echo ""
  echo "== Step B: ensure local PRA spine API (:8080 + country-market route) =="
  ensure_pra_local_spine_api 2>&1 | tee "$CLOSE_DIR/local-spine.log"

  echo ""
  echo "== Step C: re-run 3 baseline failures only =="
  record_one() {
    local phase_id="$1" script="$2" log="$CLOSE_DIR/$1.log"
    echo "--- ${phase_id} ---"
    if bash "$ROOT/scripts/ops/$script" >"$log" 2>&1; then
      echo "TT_PRA_PARTIAL_RETRY_${phase_id}: GO"
      echo "${phase_id}:GO" >>"$CLOSE_DIR/retry-results.tsv"
    else
      echo "TT_PRA_PARTIAL_RETRY_${phase_id}: FAIL (see ${log})" >&2
      echo "${phase_id}:FAIL" >>"$CLOSE_DIR/retry-results.tsv"
      exit 3
    fi
  }
  : >"$CLOSE_DIR/retry-results.tsv"
  record_one "PRA-PRESSURE" "pra-pressure-stress.sh"
  record_one "PRA-SECURITY" "pra-security-privilege-escalation.sh"
  record_one "ROV-WAVE2" "rov-wave2-evidence-pack.sh"

  echo ""
  echo "== Step D: full unified PRA pack (verification) =="
  ensure_pra_local_spine_api 2>&1 | tee "$CLOSE_DIR/local-spine-pre-unified.log"
  bash "$ROOT/scripts/ops/pra-unified-release-evidence-pack.sh" 2>&1 | tee "$CLOSE_DIR/unified-rerun.log"

  echo ""
  echo "== Step E: Phase ② testnet practical freeze + Phase ③ gate (manual acceptance first) =="
  MANIFEST="$UNIFIED_DIR/unified_manifest.v1.json"
  OVERALL="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).overall_verdict)" "$MANIFEST")"
  FAILURES="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).failure_count)" "$MANIFEST")"
  FREEZE="$EVID/PHASE2-TESTNET-PRACTICAL-FREEZE-${STAMP}.md"
  cat >"$FREEZE" <<EOF
# Phase ② · 测试网实践冻结（PRA 收口后）

**stamp:** \`${STAMP}\` · **PRA unified:** \`unified-${STAMP}\` · **overall:** **${OVERALL}** · failures=${FAILURES}

**阶段纪律：** ② 实践冻结 · **③ Review 未进入**（须全角色人工验收 ①→② 全通过后）

**机读：** \`TT_PHASE2_TESTNET_PRACTICAL_FREEZE: ACTIVE ${STAMP}\`
EOF
  ln -sfn "$(basename "$FREEZE")" "$EVID/PHASE2-TESTNET-PRACTICAL-FREEZE-latest.md" 2>/dev/null || \
    cp "$FREEZE" "$EVID/PHASE2-TESTNET-PRACTICAL-FREEZE-latest.md"

  APP="$EVID/PHASE3-PRODUCTION-READINESS-REVIEW-APPLICATION-${STAMP}.md"
  cat >"$APP" <<EOF
# Phase ③ · Production Readiness Review · Application（**HOLD**）

**状态：** **HOLD** — 等待 **全角色人工验收（① 本地 → ② 测试网）** 全部通过后再提交 Review  
**PRA 统一包：** \`unified-${STAMP}\` · **overall:** **${OVERALL}** · failure_count=${FAILURES}  
**② 冻结：** \`PHASE2-TESTNET-PRACTICAL-FREEZE-${STAMP}.md\`

**阶段纪律：** ① → ② → **③**；PRA GO **≠** Phase ③ Review **≠** Production GO

---

## 已闭（机读 harness · ②）

| 轨 | 证据 |
|----|------|
| PRA partial closing gap | \`PRA-PARTIAL-CLOSING-GAP-SPRINT-${STAMP}.log\` |
| PRA unified | \`unified-${STAMP}/unified_manifest.v1.json\` |
| ② 实践冻结 | \`PHASE2-TESTNET-PRACTICAL-FREEZE-${STAMP}.md\` |

---

## 下一闸（Owner · 人工验收）

1. [测试账号与本地联调.md](../../docs/测试账号与本地联调.md) · [dev-local-smoke-baseline.md](../../docs/dev-local-smoke-baseline.md)
2. [93 全站功能验证矩阵](../../docs/spec/93-全站功能验证矩阵-域别回归清单.md) · staging 全角色
3. 全部通过后：再启用本申请 → [PRODUCTION-READINESS-REPORT.md](../docs/runbook/PRODUCTION-READINESS-REPORT.md)

**机读（当前）：** \`TT_PHASE3_PRODUCTION_READINESS_REVIEW: HOLD ${STAMP}\`（非 REQUESTED）
EOF
  ln -sfn "$(basename "$APP")" "$EVID/PHASE3-PRODUCTION-READINESS-REVIEW-APPLICATION-latest.md" 2>/dev/null || \
    cp "$APP" "$EVID/PHASE3-PRODUCTION-READINESS-REVIEW-APPLICATION-latest.md"

  if [[ "$OVERALL" != "GO" || "$FAILURES" != "0" ]]; then
    echo "FAIL: unified rerun not GO (overall=${OVERALL} failures=${FAILURES})" >&2
    exit 4
  fi

  echo ""
  echo "TT_PRA_PARTIAL_CLOSING_GAP_SPRINT: OK ${STAMP}"
  echo "TT_PHASE2_TESTNET_PRACTICAL_FREEZE: ACTIVE ${STAMP}"
  echo "TT_PHASE3_PRODUCTION_READINESS_REVIEW: HOLD ${STAMP}"
  echo "unified_evidence: ${UNIFIED_DIR}"
  echo "freeze: ${FREEZE}"
  echo "application_hold: ${APP}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_PRA_PARTIAL_CLOSING_GAP_SPRINT: OK" "$RUN_LOG" || exit 2
grep -q "TT_UNIFIED_RELEASE_EVIDENCE_PACK: GO" "$CLOSE_DIR/unified-rerun.log" || exit 2
echo "Log: $RUN_LOG"
exit 0
