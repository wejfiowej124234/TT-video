#!/usr/bin/env bash
# LP investor zip pre-send machine checks (phase ① — does not prove ② staging / ③ production).
# Human: PACK-RELEASE-CHECKLIST-001 §2.2–2.8, internal/33 legal sign-off, demo playback.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "FAIL: need python3 or python" >&2
  exit 2
fi

EXPORT_READY="docs/fundraising/external/export-ready"
echo "== fundraising IR governance (enforce) =="
FUNDRAISING_IR_GATE_ENFORCE=1 bash scripts/gates/check-fundraising-ir-governance.sh

echo "== fundraising monorepo export-ready tracked =="
bash scripts/gates/check-fundraising-monorepo-tracked.sh

echo "== LP receiver strict audit (investor surface) =="
"$PY" scripts/gates/check-fundraising-lp-receiver-strict.py

if [[ "${FUNDRAISING_LP_REPORT_FINAL_BLOCKERS:-}" == "1" ]]; then
  echo ""
  bash scripts/gates/check-fundraising-lp-final-human-blockers.sh || true
fi

if [[ ! -f "$EXPORT_READY/00-START-HERE.txt" ]]; then
  echo "FAIL: missing $EXPORT_READY/00-START-HERE.txt" >&2
  echo "  run: python scripts/tools/build-investor-ir-pdf-pack.py" >&2
  exit 1
fi

if [[ -f scripts/tools/verify_investor_zip_layout.py ]]; then
  release="$("$PY" -c "import json; print(json.load(open('registry/fundraising-external-numeric-anchors.v1.json', encoding='utf-8'))['release'])")"
  zip_path="dist/TravelTrust-Investor-Materials-v${release}.zip"
  if [[ -f "$zip_path" ]]; then
    echo "== verify-investor-zip-layout ($zip_path) =="
    "$PY" scripts/tools/verify_investor_zip_layout.py --zip "$zip_path"
  else
    echo "SKIP: no $zip_path (run export first for zip layout check)"
  fi
fi

if [[ -f scripts/tools/ir_pdf_pagecount_diff.py ]]; then
  echo "== CN/EN PDF pagecount diff =="
  if "$PY" scripts/tools/ir_pdf_pagecount_diff.py; then
    :
  else
    echo "WARN: CN/EN pair with page delta >1 (PACK-RELEASE §2.7 — document or rebuild PDFs)" >&2
    if [[ "${FUNDRAISING_LP_PACK_PRE_SEND_STRICT_PAGECOUNT:-}" == "1" ]]; then
      exit 1
    fi
  fi
fi

echo ""
echo "OK: LP pack machine pre-send (governance + 00-START-HERE.txt"
if [[ -f scripts/tools/ir_pdf_pagecount_diff.py ]]; then
  echo "     + pagecount scan)"
else
  echo ")"
fi
echo "MANUAL still required: PACK-RELEASE-CHECKLIST-001 §2.2–2.8 · internal/33 legal · demo mp4 if shipped"
if [[ -f scripts/tools/print_ir_outbound_pending.py ]]; then
  echo ""
  echo "== IR outbound pending (informational) =="
  "$PY" scripts/tools/print_ir_outbound_pending.py || true
fi
