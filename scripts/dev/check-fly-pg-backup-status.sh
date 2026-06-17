#!/usr/bin/env bash
# Fly PG managed backup status probe（PI3-001 Execution · Owner optional）
#
#   bash scripts/dev/check-fly-pg-backup-status.sh
#   FLY_PG_APP=tt-traveltrust-prod bash scripts/dev/check-fly-pg-backup-status.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAGING_PG="${FLY_STAGING_PG_APP:-tt-traveltrust-staging}"
PROD_PG="${FLY_PROD_PG_APP:-tt-traveltrust-prod}"
APPS=("${FLY_PG_APPS:-$STAGING_PG $PROD_PG}")

pass=0
fail_n=0
warn_n=0
pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

section "0 · Fly CLI"
if ! command -v fly >/dev/null 2>&1; then
  warn "fly CLI not installed — skip live backup probes"
  echo "check-fly-pg-backup-status: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
  exit 0
fi
if ! fly auth whoami >/dev/null 2>&1; then
  warn "fly not authenticated — skip live backup probes"
  echo "check-fly-pg-backup-status: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
  exit 0
fi
pass "fly CLI authenticated"

for app in $APPS; do
  section "Fly PG · ${app}"
  out="$(mktemp)"
  if fly postgres backup list -a "$app" >"$out" 2>&1; then
    if grep -qiE "not enabled|no backups|Could not find|Error" "$out"; then
      fail "${app}: managed backups NOT enabled"
      grep -iE "not enabled|no backups|Could not find|Error" "$out" | head -3 || true
    else
      pass "${app}: backup list OK"
      head -5 "$out" || true
    fi
  else
    fail "${app}: fly postgres backup list command failed"
    cat "$out" || true
  fi
  rm -f "$out"
done

echo ""
echo "check-fly-pg-backup-status: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
