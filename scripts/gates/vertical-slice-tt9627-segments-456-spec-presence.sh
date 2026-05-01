#!/usr/bin/env bash
# TT-9627 · 编排：串行 run segment 4.0 + 5.0 + 6.0 spec-presence gates (①, no services).
# Prefer this single entry OR individual TT9627_SEGMENT{4,5,6}_SPEC_PRESENCE in ci-local — not all four
# at once (would duplicate work).
#
# Usage:
#   bash scripts/gates/vertical-slice-tt9627-segments-456-spec-presence.sh
#
# Read: docs/runbook/TT-9627-delivery-order-spine-then-full-site.md §4～§6

set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$_HERE/vertical-slice-tt9627-segment4-spec-presence.sh"
bash "$_HERE/vertical-slice-tt9627-segment5-spec-presence.sh"
bash "$_HERE/vertical-slice-tt9627-segment6-spec-presence.sh"

echo "pass: vertical-slice-tt9627-segments-456-spec-presence (4+5+6)"
exit 0
