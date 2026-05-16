#!/usr/bin/env bash
# Light gate after docs/fundraising/external/**/*.md edits (phase ① narrative only).
# Does not rebuild PDF/zip — run release-investor-lp-pack.sh before shipping.
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

echo "== fundraising IR governance (enforce) =="
FUNDRAISING_IR_GATE_ENFORCE=1 bash scripts/gates/check-fundraising-ir-governance.sh

echo "== fundraising monorepo export-ready tracked =="
bash scripts/gates/check-fundraising-monorepo-tracked.sh

echo ""
echo "OK: fundraising-external-touch (governance + monorepo index)"
echo "If narrative .md changed: run bash scripts/gates/release-investor-lp-pack.sh before external send"
echo "If shipping zip: also IR-PRE-SEND-MANUAL-001 + internal/19 registration"
echo "Freeze discipline: docs/fundraising/IR-MAINTENANCE-FREEZE-001.md"
echo ""
bash scripts/gates/ir-outbound-status.sh || true
