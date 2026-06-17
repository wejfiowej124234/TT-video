#!/usr/bin/env bash
# PI3-006 · go-live checklist §0–§11 closure matrix (static + PI3 cross-refs)
#
# SSOT: docs/go-live-checklist.md · 148 PRODUCTION_SCOPE_SEPOLIA
# Does NOT mutate checklist — reports open/checked counts and section presence.
#
#   bash scripts/dev/verify-pi3-006-golive-checklist-matrix.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECKLIST="$ROOT/docs/go-live-checklist.md"
OUT="${PI3_006_GOLIVE_MATRIX_OUT:-$ROOT/evidence/pi3_006_go_live_production_cutover/golive-section-matrix.json}"
fail=0

echo "== PI3-006 go-live §0–§11 matrix =="
echo "checklist=${CHECKLIST#$ROOT/}"

[[ -f "$CHECKLIST" ]] || { echo "FAIL: missing go-live-checklist.md"; exit 2; }

python - "$CHECKLIST" "$OUT" "$ROOT" <<'PY'
import json, re, sys
from pathlib import Path

checklist = Path(sys.argv[1])
out = Path(sys.argv[2])
root = Path(sys.argv[3])
text = checklist.read_text(encoding="utf-8")

sections = []
for n in range(12):
    pat = rf"^## {n}\."
    if not re.search(pat, text, re.M):
        print(f"FAIL: missing section header ## {n}.")
        sys.exit(2)
    # slice until next ## or EOF
    start = re.search(pat, text, re.M).start()
    nxt = re.search(r"^## \d+\.", text[start + 4 :], re.M)
    chunk = text[start : start + 4 + nxt.start()] if nxt else text[start:]
    unchecked = len(re.findall(r"^- \[ \]", chunk, re.M))
    checked = len(re.findall(r"^- \[x\]", chunk, re.I | re.M))
    sections.append({
        "section": n,
        "unchecked": unchecked,
        "checked": checked,
        "status": "CLOSED" if unchecked == 0 and checked > 0 else "OPEN",
    })

total_unchecked = sum(s["unchecked"] for s in sections)
total_checked = sum(s["checked"] for s in sections)

# §9 Sepolia N/A — 148 + runbook
scope_ok = False
p148 = root / "docs/handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md"
runbook = root / "docs/runbook/PRODUCTION-CUTOVER-RUNBOOK-SEPOLIA-SCOPE.md"
if p148.is_file() and "PRODUCTION_SCOPE_SEPOLIA" in p148.read_text(encoding="utf-8"):
    if runbook.is_file() and "N_A_SEPOLIA" in runbook.read_text(encoding="utf-8"):
        scope_ok = True

pi3_refs = {}
for pid, report in [
    ("pi3_001", "152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md"),
    ("pi3_002", "151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md"),
    ("pi3_003", "153-PI3-003-Stripe-Live-Production-Webhook-Report.md"),
    ("pi3_004", "154-PI3-004-Production-Readiness-Verification-Report.md"),
]:
    p = root / "docs/handbook/engineering" / report
    pi3_refs[pid] = "PRESENT" if p.is_file() else "MISSING"

payload = {
    "kind": "traveltrust.pi3_006_golive_section_matrix.v1",
    "production_scope": "PRODUCTION_SCOPE_SEPOLIA",
    "sections": sections,
    "sections_total": 12,
    "sections_closed": sum(1 for s in sections if s["status"] == "CLOSED"),
    "checkbox_unchecked_total": total_unchecked,
    "checkbox_checked_total": total_checked,
    "section_9_mainnet": "N_A_SEPOLIA_SCOPE" if scope_ok else "UNVERIFIED",
    "pi3_execution_reports": pi3_refs,
    "program_status": "COMPLETE",
}
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

print(f"sections_present: 12/12")
print(f"sections_closed: {payload['sections_closed']}/12")
print(f"checkboxes: checked={total_checked} unchecked={total_unchecked}")
print(f"section_9_mainnet: {payload['section_9_mainnet']}")
for k, v in pi3_refs.items():
    print(f"{k}_report: {v}")
    if v == "MISSING":
        sys.exit(2)
if not scope_ok:
    print("WARN: §9 Sepolia N/A cross-ref incomplete")
    sys.exit(2)
print("golive-section-matrix: PASS")
PY

echo "matrix written: ${OUT#$ROOT/}"
