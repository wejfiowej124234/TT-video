#!/usr/bin/env bash
# ① PH-1 human-verify preflight — evidence paths + hero mobile baseline anchor
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECKLIST="$ROOT/evidence/GO_local_traveltrust_ph1/human-verify-checklist.md"
HERO="$ROOT/evidence/GO_local_traveltrust_ph1/traveltrust-hero-mobile-390x812.png"

test -f "$CHECKLIST" || { echo "MISSING: $CHECKLIST"; exit 1; }
grep -q "TT-PH1-150" "$CHECKLIST"
grep -q "traveltrust-hero-mobile-390x812.png" "$CHECKLIST"

if [[ ! -f "$HERO" ]]; then
  echo "WARN: optional hero baseline missing ($HERO) — ① contract index only"
fi

echo "OK: traveltrust-ph1-human-verify-preflight"
