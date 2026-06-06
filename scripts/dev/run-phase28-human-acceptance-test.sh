#!/usr/bin/env bash
# Phase ②.8 · Human Acceptance Test (staging)
#
#   bash scripts/dev/run-phase28-human-acceptance-test.sh
#
# Independent of six-domain Playwright UAT. Probes HTML shells + business APIs
# from five role perspectives; generates HUMAN-ACCEPTANCE-REPORT.md.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="${HAT_OUT:-$ROOT/evidence/phase28-human-acceptance/$(date -u +%Y%m%dT%H%M%SZ)}"
FINDINGS_REL="evidence/phase28-human-acceptance/$(basename "$OUT")/hat-findings.json"
FINDINGS="$ROOT/$FINDINGS_REL"
WEB="${HAT_WEB_BASE:-https://tt-web-staging.fly.dev}"
API="${HAT_API_BASE:-https://tt-api-staging.fly.dev}"

export HAT_OUT="$OUT"
export HAT_WEB_BASE="$WEB"
export HAT_API_BASE="$API"
export HAT_PASSWORD="${HAT_PASSWORD:-Test123!}"

export HAT_META_GIT_SHA="$(curl --noproxy "*" -sS "${API}/meta" 2>/dev/null | python -c "import sys,json; print(json.load(sys.stdin).get('build',{}).get('git_sha',''))" 2>/dev/null || echo '')"

mkdir -p "$OUT"

echo "phase28-hat: targets web=$WEB api=$API"
echo "phase28-hat: out=$OUT"

python "$ROOT/scripts/dev/phase28-human-acceptance-probe.py" | tee "$OUT/probe.log"

echo "phase28-hat: browser leg (authenticated human-visible) …"
export PHASE28_HAT_BROWSER=1
export PLAYWRIGHT_BASE_URL="$WEB"
export PLAYWRIGHT_API_BASE_URL="$API"
export PLAYWRIGHT_REUSE_FE_SERVER=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
cd "$ROOT/frontend"
npx playwright test e2e/phase28-human-acceptance-browser.spec.ts \
  --config=playwright.staging-uat.config.ts \
  --project=chromium \
  --reporter=list 2>&1 | tee "$OUT/browser.log"
cd "$ROOT"

python "$ROOT/scripts/dev/generate-human-acceptance-report.py" \
  --findings "$FINDINGS" \
  --out "$ROOT/docs/runbook/HUMAN-ACCEPTANCE-REPORT.md"

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/phase28-human-acceptance/latest" 2>/dev/null || true

VERDICT="$(PYTHONIOENCODING=utf-8 python -c "import json; print(json.load(open(r'''${FINDINGS}''', encoding='utf-8'))['verdict'])")"
echo "PHASE28_HUMAN_ACCEPTANCE: $VERDICT"
echo "Report: docs/runbook/HUMAN-ACCEPTANCE-REPORT.md"
echo "phase28-hat: OK · ≠ Production GO · Phase ③ gate see report"
[[ "$VERDICT" == "NO-GO" ]] && exit 1 || exit 0
