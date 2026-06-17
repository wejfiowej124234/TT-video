#!/usr/bin/env bash
# Cert #1 completed regression — evidence + AI pre-UAT PASS (no Playwright re-run)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || { echo "smoke-cert1-regression: FAIL no session" >&2; exit 1; }
AI_STAMP="$(cat "$ROOT/evidence/GO_ai_pre_human_uat/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
AI_PASS="$ROOT/evidence/GO_ai_pre_human_uat/${AI_STAMP}/AI-PRE-HUMAN-UAT-PASS.json"
SIG="$ROOT/evidence/GO_ttg_cert/${STAMP}/human-uat/HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json"
[[ -f "$AI_PASS" ]] || { echo "smoke-cert1-regression: FAIL missing AI-PRE-HUMAN-UAT-PASS" >&2; exit 1; }
[[ -f "$SIG" ]] || { echo "smoke-cert1-regression: FAIL missing Cert #1 signoff" >&2; exit 1; }
export TTG_CERT1_AI_PASS="$AI_PASS"
python - <<'PY'
import json, os, sys
from pathlib import Path
p = Path(os.environ["TTG_CERT1_AI_PASS"])
if json.loads(p.read_text(encoding="utf-8")).get("verdict") != "PASS":
    sys.exit(1)
PY
echo "smoke-cert1-regression: OK AI_PASS + signoff"
echo "TT_CERT1_REGRESSION: OK"
