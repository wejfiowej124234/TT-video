#!/usr/bin/env bash
# TT-9627 §6 — production GO segment: verify SSOT runbook/spec/ops files exist (① machine gate only).
# Does NOT replace go-live checkboxes, P0 rows, mainnet G0–G6, or 96-15 §3 sign-off.
#
# Usage (from repo root):
#   bash scripts/gates/vertical-slice-tt9627-segment6-spec-presence.sh
#
# Read: docs/runbook/TT-9627-delivery-order-spine-then-full-site.md §6

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

need_file "docs/runbook/TT-9626-zero-to-production-go-single-path.md"
need_file "docs/go-live-checklist.md"
need_file "docs/spec/缺口与待补-官方总表.md"
need_file "docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md"
need_file "docs/spec/96-15-深度多维度检查与审计体系.md"
need_file "ops/RUNBOOK.md"

echo "pass: vertical-slice-tt9627-segment6-spec-presence (TT-9626 + go-live + P0表 + TT-MAINNET + 96-15 + RUNBOOK)"
exit 0
