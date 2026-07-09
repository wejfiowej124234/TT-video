#!/usr/bin/env bash
# Repository CFG drift scan (tracked files only). Exit 0 = Repository Drift 0.
# Usage: bash scripts/dev/scan-repository-cfg-drift.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
fail=0
EVIDENCE="${CFG_DRIFT_SCAN_LOG:-evidence/manual-uat/signoff/CFG-REPOSITORY-DRIFT-SCAN.log}"
mkdir -p "$(dirname "$EVIDENCE")"
: >"$EVIDENCE"

note() { echo "$*" | tee -a "$EVIDENCE"; }
die() { note "FAIL $*"; fail=1; }
ok() { note "OK   $*"; }

note "=== scan-repository-cfg-drift $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# Frontend dev port in SSOT tables (not historical narrative)
if rg -q '\| \*\*Frontend \(Next\.js\)\*\* \| 3000 \|' docs/spec/38-端口与接口完整清单.md 2>/dev/null; then
  die "spec/38 Frontend port still 3000 in table"
else
  ok "spec/38 Frontend 3012"
fi

if rg -q 'password123' frontend/e2e 2>/dev/null; then
  die "e2e password123"
else
  ok "e2e passwords SSOT"
fi

if rg -q 'NEXT_PUBLIC_API_BASE_URL=.*:3012' frontend/.env.example deploy/fly 2>/dev/null; then
  die "NEXT_PUBLIC_API_BASE_URL points at 3012 in template"
else
  ok "templates API base not 3012"
fi

if rg -q 'GOVERNOR_ADDRESS=0xa79c8df5' deploy/fly/tt-web-staging/build.env.example 2>/dev/null; then
  die "staging build.env.example legacy GOVERNOR"
else
  ok "staging GOVERNOR GovFreeze V2"
fi

if rg -q '^INTERNAL_API_SECRET=.{8,}' scripts/dev/staging-onboarding.env.example 2>/dev/null; then
  die "staging-onboarding.env.example has real INTERNAL_API_SECRET"
else
  ok "staging example INTERNAL_API_SECRET empty"
fi

# Secrets in tracked tree (exclude examples with placeholders)
if git grep -E 're_[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{10,}' -- ':!*.md' ':!evidence/**' ':!.env.example' ':!scripts/dev/.env.production.example' ':!scripts/dev/staging-onboarding.env.example' 2>/dev/null | grep -v 'sk_test_\.\.\.' | grep -v 're_\.\.\.' | head -5 | tee -a "$EVIDENCE"; then
  die "possible real secrets in tracked files (see log)"
else
  ok "no real secrets in tracked code"
fi

if rg -q 'localhost:3000/escrow' scripts/dev/smoke-acquisition-pd009-local.sh 2>/dev/null; then
  die "smoke-acquisition hardcoded :3000"
else
  ok "smoke-acquisition FRONTEND_PORT"
fi

test -f scripts/dev/verify-cfg-drift-closure.sh && ok "verify-cfg-drift-closure.sh" || die "missing verify script"
test -f evidence/manual-uat/summary/config-drift-registry.json && ok "CFG registry JSON" || die "missing CFG registry"

note "=== scan-repository-cfg-drift exit $fail ==="
exit "$fail"
