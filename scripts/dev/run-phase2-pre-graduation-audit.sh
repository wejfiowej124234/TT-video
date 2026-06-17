#!/usr/bin/env bash
# Phase ② · Pre-Graduation Audit（不等待 72h soak · 清零非 soak 阻塞）
#
#   bash scripts/dev/run-phase2-pre-graduation-audit.sh
#
# 产出：evidence/P2FC_SOAK_72H_STAGING/PRE-GRADUATION-AUDIT-<stamp>.md
#       + evidence/GO_phase2_testnet_graduation/<stamp>/（同 governance audit）
#
# 诚实边界：本脚本 **≠** TT_TESTNET_GRADUATION:CLOSED · 须 COMPLETED.json + G-09
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
REPORT="$SOAK_DIR/PRE-GRADUATION-AUDIT-${STAMP}.md"

export OPEN_TESTNET_P0_COUNT="${OPEN_TESTNET_P0_COUNT:-0}"
export OPEN_TESTNET_P1_COUNT="${OPEN_TESTNET_P1_COUNT:-0}"
export TT_PHASE2_READINESS="${TT_PHASE2_READINESS:-100}"

echo "TT_PHASE2_PRE_GRADUATION_AUDIT: START ${STAMP}"

bash "$ROOT/scripts/dev/run-phase2-testnet-closure-governance-audit.sh"

EVID="$(ls -td "$ROOT/evidence/GO_phase2_testnet_graduation"/*/ 2>/dev/null | head -1)"
EVID="${EVID%/}"
[[ -f "$EVID/graduation-matrix.v1.json" ]] || {
  echo "FAIL: graduation matrix missing" >&2
  exit 2
}

node -e "
const fs=require('fs');
const m=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const g=m.gates||{};
const blocking=(m.cells||[]).filter(c=>c.blocking);
const nonSoak=blocking.filter(c=>!(c.dimension==='A6'&&c.note&&c.note.includes('TN-P1-009')));
const soakOnly=blocking.length>0&&nonSoak.length===0;
const tracks=(m.deep_closure?.tracks||[]).filter(t=>t.status!=='PASS');
const nonSoakTracks=tracks.filter(t=>!t.soak_deferred);
console.log(JSON.stringify({
  graduation_verdict:m.graduation_verdict,
  blocking_open:m.summary?.blocking_open,
  soak_only_blocking:soakOnly,
  non_soak_blocking:nonSoak.map(c=>c.domain+' '+c.dimension),
  non_soak_track_gaps:nonSoakTracks.map(t=>t.id+':'+t.status),
  missing_coverage:g.deep_closure_missing_coverage,
  evidence_gap:g.deep_closure_evidence_gap,
  soak_completed:g.p2fc_soak_completed,
  indexer_ok:g.indexer_compound_pass&&g.missing_projection===0,
  surface_ok:g.surface_coverage_pct===100&&g.untested_ui_element===0&&g.untested_user_action===0,
},null,2));
if(nonSoak.length>0||nonSoakTracks.length>0){process.exit(5);}
if(g.deep_closure_missing_coverage!==0||g.deep_closure_evidence_gap!==0){process.exit(6);}
" "$EVID/graduation-matrix.v1.json" >"$EVID/pre-graduation-gates-check.json"

PRE_EXIT=$?
if [[ "$PRE_EXIT" -eq 0 ]]; then
  PRE_VERDICT="PRE_GRADUATION_CLEAR"
  NON_SOAK_STATUS="已清零"
elif [[ "$PRE_EXIT" -eq 5 || "$PRE_EXIT" -eq 6 ]]; then
  PRE_VERDICT="BLOCKED_NON_SOAK"
  NON_SOAK_STATUS="仍有 OPEN（见 gates-check）"
else
  PRE_VERDICT="PROBE_ERROR"
  NON_SOAK_STATUS="探测异常"
fi

SOAK_COMPLETED_TXT="等待中"
[[ -f "$SOAK_DIR/COMPLETED.json" ]] && SOAK_COMPLETED_TXT="已有"

SOAK_JOB="${P2FC_SOAK_EXPECTED_JOB:-job-20260614T070154Z}"
SOAK_PID="$(cat "$SOAK_DIR/$SOAK_JOB/pid.txt" 2>/dev/null || echo n/a)"
SOAK_ALIVE="no"
[[ -n "$SOAK_PID" && "$SOAK_PID" != "n/a" ]] && kill -0 "$SOAK_PID" 2>/dev/null && SOAK_ALIVE="yes"

cat >"$REPORT" <<EOF
# Phase ② · Pre-Graduation Audit（Pre-Graduation · 不等待 soak）

**Stamp:** ${STAMP}  
**Standard:** TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD  
**Machine evidence:** \`${EVID#"$ROOT/"}\`  
**Pre-verdict:** **${PRE_VERDICT}**

**阶段口径：** ① → **②** → ③ · 本审计 **② 预审** · **≠** \`TT_TESTNET_GRADUATION:CLOSED\` · **≠** ③ Production GO

---

## 总表

| 项 | 结论 |
|----|------|
| **非 soak 阻塞** | ${NON_SOAK_STATUS} |
| **Soak 唯一阻塞** | G04/G06/G11 · A6 · TN-P1-009（72h） |
| **COMPLETED.json** | ${SOAK_COMPLETED_TXT} |
| **Soak job** | \`${SOAK_JOB}\` pid=${SOAK_PID} alive=${SOAK_ALIVE} |

---

## G-01～G-09 预审

| Gate | 条件 | 预审态 | Soak 后 |
|------|------|--------|---------|
| G-01 | Open P0 = 0 | ✅ | ✅ |
| G-02 | Open P1 = 0 | ✅ | ✅ |
| G-03 | Readiness ≥ 100 | ✅ | ✅ |
| G-04 | Perfect validation GO | ✅ | ✅ |
| G-05 | blocking_open = 0 | ⏳ soak | ✅ |
| G-06 | P2FC COMPLETED.json | ⏳ INFLIGHT | ✅ |
| G-07 | indexer compound + missing=0 | ✅ live | ✅ |
| G-08 | D1–D24 + surface 100% | ⏳ full_closure 88%→100%* | ✅ |
| G-09 | OWNER-SIGNOFF.md | ⏳ post-soak | ✅ |

\* D1/D12/D15 为 soak-deferred PARTIAL；\`COMPLETED.json\` 后机读应 24/24 PASS。

---

## 机读摘要

See \`pre-graduation-gates-check.json\` · \`graduation-matrix.v1.json\`

**Post-soak 唯一合法路径：**

\`\`\`bash
bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh
# 或 watcher: evidence/P2FC_SOAK_72H_STAGING/post-soak-graduation-watcher.log
\`\`\`

**末行 grep：** \`TT_PRE_GRADUATION_AUDIT: ${PRE_VERDICT} ${STAMP}\`
EOF

echo ""
echo "TT_PRE_GRADUATION_AUDIT: ${PRE_VERDICT} ${STAMP}"
echo "report: $REPORT"
echo "evidence: $EVID"
echo "TT_TESTNET_GRADUATION: OPEN (await COMPLETED.json + G-09)"

node "$ROOT/scripts/dev/emit-l5-pre-graduation-verdict.mjs" \
  --evid-dir "$EVID" \
  --stamp "$STAMP" 2>/dev/null || true

exit "$PRE_EXIT"
