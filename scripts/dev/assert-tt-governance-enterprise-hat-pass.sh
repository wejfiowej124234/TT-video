#!/usr/bin/env bash
# Assert TT_GOVERNANCE_ENTERPRISE_HAT human signoff (all L1-L9 PASS)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ "${TT_GOVERNANCE_ENTERPRISE_HAT_OK:-}" == "1" ]]; then
  SIGNOFF="$(ls -td "$ROOT/evidence/GO_tt_governance_enterprise_hat/signoff"/*/HUMAN-ENTERPRISE-HAT-SIGNOFF.json 2>/dev/null | head -1 || true)"
  [[ -n "$SIGNOFF" ]] || {
    echo "TT_GOVERNANCE_ENTERPRISE_HAT: FAIL OK=1 but no signoff evidence" >&2
    exit 2
  }
fi

SIGNOFF="${TT_ENTERPRISE_HAT_SIGNOFF_JSON:-}"
if [[ -z "$SIGNOFF" ]]; then
  LATEST="$(cat "$ROOT/evidence/GO_tt_governance_enterprise_hat/signoff/latest-stamp.txt" 2>/dev/null || true)"
  [[ -n "$LATEST" ]] && SIGNOFF="$ROOT/evidence/GO_tt_governance_enterprise_hat/signoff/${LATEST}/HUMAN-ENTERPRISE-HAT-SIGNOFF.json"
fi
[[ -f "$SIGNOFF" ]] || SIGNOFF="$(ls -td "$ROOT/evidence/GO_tt_governance_enterprise_hat/signoff"/*/HUMAN-ENTERPRISE-HAT-SIGNOFF.json 2>/dev/null | head -1 || true)"

[[ -f "$SIGNOFF" ]] || {
  echo "TT_GOVERNANCE_ENTERPRISE_HAT: FAIL no HUMAN-ENTERPRISE-HAT-SIGNOFF.json" >&2
  echo "  Run: bash scripts/dev/run-tt-governance-enterprise-hat-review.sh" >&2
  echo "  Then: bash scripts/dev/record-tt-governance-enterprise-hat-signoff.sh --all-pass" >&2
  exit 2
}

python <<PY
import json, sys, pathlib
p = pathlib.Path(r"""$SIGNOFF""")
doc = json.loads(p.read_text(encoding="utf-8"))
layers = doc.get("layers") or {}
required = [f"L{i}" for i in range(1, 10)]
missing = [k for k in required if layers.get(k, {}).get("verdict") != "PASS"]
if doc.get("verdict") != "PASS" or missing:
    print("TT_GOVERNANCE_ENTERPRISE_HAT: FAIL", "missing_or_not_pass", missing or doc.get("verdict"))
    sys.exit(2)
print("TT_GOVERNANCE_ENTERPRISE_HAT: PASS evidence=" + str(p.parent))
print("TT_GOVERNANCE_ENTERPRISE_HAT_SUMMARY: PASS")
PY
