#!/usr/bin/env bash
# Engineering SSOT Anchor gate — PSG-bound entity defaults must not cite forbidden pins.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
REG="registry/engineering-ssot-anchor.v1.yaml"
HUM="docs/runbook/TT-ENGINEERING-SSOT-ANCHOR-LATEST.md"
PIN="PSG-REL-20260720-WEB3-CAND-V2"
TIP="4050f50a7d0c94939c0e471e197806f766d4391f"
BAD="PSG-REL-20260722-STAGING-ALIGN-W0"

echo "TT_ENGINEERING_SSOT_ANCHOR_GATE: start"
[[ -f "$REG" ]] || { echo "FAIL missing $REG"; exit 1; }
[[ -f "$HUM" ]] || { echo "FAIL missing $HUM"; exit 1; }
grep -q 'machine_key: TT_ENGINEERING_SSOT_ANCHOR' "$REG" || { echo "FAIL machine_key"; exit 1; }
grep -q "$PIN" "$REG" || { echo "FAIL Candidate pin"; exit 1; }
grep -q "$TIP" "$REG" || { echo "FAIL tip SHA"; exit 1; }

fail=0
# Living assignment of BAD pin (not comments that forbid it)
check_no_bad_assign() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  if grep -E "(DEFAULT_PSG_RELEASE_VERSION|FROZEN_PSG_RELEASE_VERSION|PSG_RELEASE|NEXT_PUBLIC_PSG_RELEASE_VERSION).*${BAD}|\"${BAD}\"|'${BAD}'" "$f" \
    | grep -vE 'Forbidden|FORBIDDEN|SUPERSEDED|ARCHIVED|historical|#|///|"""' >/dev/null; then
    echo "FAIL living assignment of $BAD in $f"
    fail=1
  fi
}
check_no_bad_assign "crates/api/src/routes/health_meta/meta_build.rs"
check_no_bad_assign "frontend/app/api/release-identity/route.ts"
check_no_bad_assign "frontend/Dockerfile.fly-staging"
check_no_bad_assign "scripts/dev/run-psg-version-gate.py"
check_no_bad_assign "scripts/dev/run-deployment-identity-gate.py"

if grep -q "FROZEN_PSG_RELEASE_VERSION = \"$PIN\"" scripts/dev/run-psg-version-gate.py \
  && grep -q "$TIP" scripts/dev/run-psg-version-gate.py; then
  echo "version-gate defaults: OK"
else
  echo "FAIL version-gate defaults not Candidate tip/pin"
  fail=1
fi

# Dockerfile ARG must be Candidate
if grep -q "ARG NEXT_PUBLIC_PSG_RELEASE_VERSION=$PIN" frontend/Dockerfile.fly-staging; then
  echo "dockerfile ARG: OK"
else
  echo "FAIL dockerfile ARG not Candidate"
  fail=1
fi

# API default const
if grep -q "DEFAULT_PSG_RELEASE_VERSION: &str = \"$PIN\"" crates/api/src/routes/health_meta/meta_build.rs; then
  echo "api default: OK"
else
  echo "FAIL api DEFAULT_PSG not Candidate"
  fail=1
fi

# mint refuse present
if grep -q "ALLOW_HISTORICAL_STAGING_ALIGN_MINT" scripts/dev/run-psg-mint-staging-align-w0.py; then
  echo "mint refuse: OK"
else
  echo "FAIL mint refuse missing"
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "TT_ENGINEERING_SSOT_ANCHOR_GATE: FAIL"
  exit 1
fi
echo "TT_ENGINEERING_SSOT_ANCHOR_GATE: PASS"
exit 0
