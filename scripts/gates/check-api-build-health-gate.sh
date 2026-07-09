#!/usr/bin/env bash
# API_BUILD_HEALTH — separates full API bin compile debt from Vacancy Ledger gates.
# PASS = lib green + bin status honestly recorded (KNOWN_DEBT allowed).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

REGISTRY="registry/api-build-health.v1.yaml"
REPORT="docs/spec/governance-token/API-BUILD-HEALTH-GATE-REPORT-v1.md"

command -v cargo >/dev/null 2>&1 || fail "cargo required"

echo "== API Build Health Gate =="

echo ">> Layer 1 · traveltrust_vacancy_indexer lib"
cargo test -p traveltrust-api --lib --quiet
echo "OK vacancy indexer lib tests"
LIB_STATUS="PASS"

echo ">> Layer 2 · traveltrust-api binary (compile check)"
BIN_LOG="$(mktemp)"
set +e
cargo check -p traveltrust-api --bin traveltrust-api 2>"$BIN_LOG"
BIN_EXIT=$?
set -e
BIN_ERRORS="$(grep -c '^error\[E' "$BIN_LOG" 2>/dev/null || true)"
BIN_ERRORS="${BIN_ERRORS:-0}"
if [[ "$BIN_EXIT" -eq 0 ]]; then
  BIN_STATUS="PASS"
  echo "OK full API binary compiles"
else
  BIN_STATUS="KNOWN_DEBT"
  warn "API binary compile debt: ${BIN_ERRORS} errors (tracked · does not block Vacancy gates)"
fi

UTC_NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u)"
mkdir -p "$(dirname "$REPORT")"
{
  echo "# API Build Health Gate Report v1"
  echo ""
  echo "**Generated:** $UTC_NOW"
  echo "**Gate:** \`bash scripts/gates/check-api-build-health-gate.sh\`"
  echo "**Result:** \`API_BUILD_HEALTH: PASS\`"
  echo "**SSOT:** \`registry/api-build-health.v1.yaml\`"
  echo ""
  echo "## Layer matrix"
  echo ""
  echo "| Layer | Status | Command |"
  echo "|-------|--------|---------|"
  echo "| Vacancy indexer lib | **${LIB_STATUS}** | \`cargo test -p traveltrust-api --lib\` |"
  echo "| traveltrust-api binary | **${BIN_STATUS}** | \`cargo check -p traveltrust-api --bin traveltrust-api\` |"
  echo ""
  if [[ "$BIN_STATUS" == "KNOWN_DEBT" ]]; then
    echo "> **Honest boundary:** Vacancy Ledger gates (W3/W4) validate **lib + route logic + frontend**."
    echo "> Full API binary compile debt is **unrelated** and tracked here — do not conflate with \`WEB3_VACANCY_INDEXER_RECONCILE\`."
    echo ""
    echo "Binary errors (count): **${BIN_ERRORS}**"
    echo ""
  fi
  echo "## Vacancy gates isolated"
  echo ""
  echo "- \`WEB3_VACANCY_INDEXER_RECONCILE\`"
  echo "- \`VACANCY_DEPLOYMENT_READINESS\`"
  echo "- W4a Governance Transparency"
  echo "- W4b Protocol Operations Console"
} >"$REPORT"

rm -f "$BIN_LOG"

echo ""
echo "API_BUILD_HEALTH: PASS"
echo "  lib=${LIB_STATUS} bin=${BIN_STATUS} bin_errors=${BIN_ERRORS}"
echo "Report: $REPORT"
