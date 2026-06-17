#!/usr/bin/env bash
# PI3-006 · P0 十二项闭环矩阵（go-live §11.1–11.12 + 映射表）
#
# SSOT: docs/go-live-checklist.md · P0 覆盖映射表
# Tracks closure paths — honest 0/12 until Owner signs.
#
#   bash scripts/dev/verify-pi3-006-p0-twelve-items-matrix.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECKLIST="$ROOT/docs/go-live-checklist.md"
OUT="${PI3_006_P0_MATRIX_OUT:-$ROOT/evidence/pi3_006_go_live_production_cutover/p0-twelve-items-matrix.json}"

echo "== PI3-006 P0 twelve items matrix =="

[[ -f "$CHECKLIST" ]] || { echo "FAIL: missing go-live-checklist.md"; exit 2; }

python - "$CHECKLIST" "$OUT" <<'PY'
import json, re, sys
from pathlib import Path

checklist = Path(sys.argv[1])
out = Path(sys.argv[2])
text = checklist.read_text(encoding="utf-8")

# P0 #1–#12 from mapping table + §11.x anchors
items = [
    (1, "11.1", "08-4 签字/定稿日期"),
    (2, "11.2", "08-2 Owner + backup"),
    (3, "11.3", "08-2 审查一"),
    (4, "11.4", "08-2 审查二 / Gate 矩阵"),
    (5, "11.5", "08-4 定稿检查勾选"),
    (6, "11.6", "Runbook P0 九项、值班链"),
    (7, "11.7", "evidence / 08-2 Evidence"),
    (8, "11.8", "00 快速核对 7 项"),
    (9, "11.9", "P26 可调通"),
    (10, "11.10", "E2E 三项留痕"),
    (11, "11.11", "资损 runbook 演练"),
    (12, "11.12", "02 §十三 发版前勾选"),
]

rows = []
closed = 0
for p0_num, anchor, summary in items:
    # §11.x checkbox in checklist
    pat = rf"^- \[([ xX])\] \*\*{re.escape(anchor)}"
    m = re.search(pat, text, re.M)
    if not m:
        # fallback: any line containing anchor
        pat2 = rf"^- \[([ xX])\].*{re.escape(anchor)}"
        m = re.search(pat2, text, re.M)
    if m and m.group(1).lower() == "x":
        status = "CLOSED"
        closed += 1
    else:
        status = "OPEN"
    rows.append({
        "p0_number": p0_num,
        "go_live_anchor": anchor,
        "summary": summary,
        "status": status,
        "evidence_path_hint": f"go-live §{anchor} · 官方总表 P0 #{p0_num}",
    })

payload = {
    "kind": "traveltrust.pi3_006_p0_twelve_items_matrix.v1",
    "production_scope": "PRODUCTION_SCOPE_SEPOLIA",
    "items_total": 12,
    "items_closed": closed,
    "items": rows,
    "closure_verdict": "GO" if closed == 12 else "HOLD",
}
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

print(f"p0_items_closed: {closed}/12")
print(f"p0_closure_verdict: {payload['closure_verdict']}")
for r in rows:
    print(f"  P0 #{r['p0_number']:2d} §{r['go_live_anchor']:5s} {r['status']}")
print("p0-twelve-items-matrix: PASS (tracking)")
PY

echo "matrix written: ${OUT#$ROOT/}"
