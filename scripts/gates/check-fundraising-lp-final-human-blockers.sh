#!/usr/bin/env bash
# Reports human blockers for FINAL (not preview) LP send. Exit 1 until all ack env set.
# Does NOT prove phase 2 Pack A/B or phase 3 production.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1 && python -c "import sys" >/dev/null 2>&1; then
  PY=python
else
  echo "FAIL: need working python3 or python" >&2
  exit 2
fi

echo "== LP machine surface (phase 1) =="
"$PY" scripts/gates/check-fundraising-lp-receiver-strict.py

blockers=0
warn() { echo "BLOCKER: $*" >&2; blockers=$((blockers + 1)); }

echo ""
echo "== Human blockers for FINAL send (not preview) =="

if [[ "${FUNDRAISING_LP_LEGAL_SIGNED:-}" != "1" ]]; then
  warn "Legal PDF sign-off — set FUNDRAISING_LP_LEGAL_SIGNED=1 after counsel signs (internal/33)"
fi

demo_ack="${FUNDRAISING_LP_DEMO_ACK:-}"
if [[ "$demo_ack" != "omit" && "$demo_ack" != "shipped" ]]; then
  warn "Demo policy — set FUNDRAISING_LP_DEMO_ACK=omit (no video) or =shipped (final mp4 in zip)"
elif [[ "$demo_ack" == "shipped" ]]; then
  release="$("$PY" -c "import json; print(json.load(open('registry/fundraising-external-numeric-anchors.v1.json',encoding='utf-8'))['release'])")"
  mp4="docs/fundraising/external/export-ready/demo/TravelTrust-Product-Demo-v${release}.mp4"
  if [[ ! -f "$mp4" ]]; then
    warn "FUNDRAISING_LP_DEMO_ACK=shipped but missing $mp4"
  fi
fi

if [[ "${FUNDRAISING_LP_DISTRIBUTION_LOGGED:-}" != "1" ]]; then
  warn "Distribution log — set FUNDRAISING_LP_DISTRIBUTION_LOGGED=1 after real row in internal/19"
fi

start="docs/fundraising/external/export-ready/00-START-HERE.txt"
if [[ -f "$start" ]] && grep -q '________________' "$start"; then
  if [[ "${FUNDRAISING_LP_IR_CONTACT_FILLED:-}" != "1" ]]; then
    if [[ -n "${FUNDRAISING_IR_CONTACT_NAME:-}" && -n "${FUNDRAISING_IR_CONTACT_EMAIL:-}" ]]; then
      warn "FUNDRAISING_IR_CONTACT_* set but 00-START-HERE.txt still has placeholders — rerun release-investor-lp-pack.sh"
    else
      warn "IR contact placeholders still blank in 00-START-HERE.txt — set FUNDRAISING_IR_CONTACT_* and rebuild zip, or FUNDRAISING_LP_IR_CONTACT_FILLED=1"
    fi
  fi
fi

if [[ "${FUNDRAISING_LP_PACK_A_ENHANCED:-}" == "1" ]]; then
  echo "NOTE: FUNDRAISING_LP_PACK_A_ENHANCED=1 claims phase 2 Pack A — verify RUNBOOK truth table manually"
else
  echo "INFO: Pack A not claimed (phase 2) — OK for zip-only FINAL if Legal/Demo/log OK"
fi

if [[ $blockers -gt 0 ]]; then
  echo ""
  echo "FAIL: $blockers human blocker(s) for FINAL LP send (preview may still be OK with ir-preview-send-preflight.sh)"
  echo "Fill/update: docs/fundraising/data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md (SSOT)"
  echo "Summary: docs/fundraising/IR-LP-AUDIT-CLOSURE-001.md"
  exit 1
fi

echo ""
echo "OK: human blocker ack env set for FINAL send (counsel/demo/log/contact)"
echo "Still does NOT prove phase 2 Pack A/B closure or phase 3 production GO"
