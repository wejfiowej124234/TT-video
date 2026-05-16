#!/usr/bin/env bash
# Build export-ready PDFs/PPTX, zip investor handoff, run LP pre-send gate (phase ①).
# Does not prove ② staging / ③ production. Manual: PACK-RELEASE §2.2–2.8, internal/33 Legal.
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

if [[ "${RELEASE_LP_SKIP_PDF:-}" != "1" ]]; then
  echo "== build-investor-ir-pdf-pack =="
  "$PY" scripts/tools/build-investor-ir-pdf-pack.py
fi

if [[ "${RELEASE_LP_SKIP_DECK:-}" != "1" ]]; then
  echo "== build-investor-pitch-deck =="
  "$PY" scripts/tools/build-investor-pitch-deck.py
fi

if [[ "${RELEASE_LP_WITH_DEMO_BUILD:-}" == "1" ]]; then
  echo "== build-investor-demo-video (placeholder/title-card; DO NOT ship to LPs) =="
  echo "WARN: placeholder mp4 fails governance/zip verify unless FUNDRAISING_LP_ALLOW_PLACEHOLDER_DEMO=1" >&2
  "$PY" scripts/tools/build-investor-demo-video.py || {
    echo "WARN: demo build failed; continue without demo mp4" >&2
  }
fi

if [[ "${RELEASE_LP_SKIP_EXPORT:-}" != "1" ]]; then
  echo "== export-investor-dataroom (--zip --omit-markdown) =="
  "$PY" scripts/tools/export-investor-dataroom.py --zip --omit-markdown
  if [[ "${RELEASE_LP_SKIP_ZIP_VERIFY:-}" != "1" ]]; then
    echo "== verify-investor-zip-layout =="
    "$PY" scripts/tools/verify_investor_zip_layout.py
  fi
fi

if [[ "${RELEASE_LP_RUN_DEMO_TESTS:-}" == "1" ]]; then
  echo "== test_investor_handoff_demo_policy =="
  (cd scripts/tools && "$PY" test_investor_handoff_demo_policy.py)
fi

if [[ "${RELEASE_LP_SKIP_PRE_SEND:-}" != "1" ]]; then
  bash scripts/gates/check-fundraising-lp-pack-pre-send.sh
fi

echo ""
echo "OK: release-investor-lp-pack (① machine path complete)"
echo "MANUAL: PACK-RELEASE-CHECKLIST-001 §2.2–2.8 · internal/33 · demo playback if mp4 shipped"
echo "Preview send: bash scripts/gates/ir-preview-send-preflight.sh"
echo "② evidence (not in zip): docs/fundraising/data-room/evidence/RUNBOOK-III-PACK-A.v1.md"
