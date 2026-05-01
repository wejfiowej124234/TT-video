#!/usr/bin/env bash
# TT-9627 §5 — closed-loop / rules segment: verify SSOT runbook + spec files exist (① machine gate only).
# Does NOT replace TT-9624 row checks, 96-21 9–17 walkthrough, or 96-17 wallet evidence.
#
# Usage (from repo root):
#   bash scripts/gates/vertical-slice-tt9627-segment5-spec-presence.sh
#
# Read: docs/runbook/TT-9627-delivery-order-spine-then-full-site.md §5

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

need_file "docs/runbook/TT-9624-closed-loop-checklist.md"
need_file "docs/spec/96-21-工程闭环扩展清单进阶.md"
need_file "docs/spec/96-17-多重身份与钱包真值.md"

echo "pass: vertical-slice-tt9627-segment5-spec-presence (TT-9624 + 96-21 + 96-17)"
exit 0
