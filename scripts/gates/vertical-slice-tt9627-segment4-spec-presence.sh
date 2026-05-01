#!/usr/bin/env bash
# TT-9627 §4 — UI/UX segment: verify SSOT spec files exist (① machine gate only).
# Does NOT replace 96-13 walkthrough, 96-16 D1–D12 sampling, or 96-15 Tier C evidence.
#
# Usage (from repo root):
#   bash scripts/gates/vertical-slice-tt9627-segment4-spec-presence.sh
#
# Read: docs/runbook/TT-9627-delivery-order-spine-then-full-site.md §4; TT-9628 §0.0.1

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

need_file() {
  local rel="$1"
  if [[ ! -f "$ROOT/$rel" ]]; then
    echo "error: missing $rel" >&2
    exit 1
  fi
  echo "ok: $rel"
}

need_file "docs/spec/96-13-UI-UX-i18n-a11y-性能走查.md"
need_file "docs/spec/96-16-全页面UI-UX优化方案总册.md"
need_file "docs/spec/29-自由市场-企业级检查清单.md"

echo "pass: vertical-slice-tt9627-segment4-spec-presence (96-13 + 96-16 + 29)"
exit 0
