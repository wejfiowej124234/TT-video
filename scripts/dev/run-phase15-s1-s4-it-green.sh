#!/usr/bin/env bash
# ①.5 · PHASE1_5 §6 S1–S4 cargo IT + 烟测编排
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "== phase15 S1–S4 cargo IT =="
cargo test -p traveltrust-api phase15_identity_s -- --nocapture
cargo test -p traveltrust-api role_identity_dual_write -- --nocapture

if [[ -n "${SKIP_PHASE15_SMOKE:-}" ]]; then
  echo "SKIP_PHASE15_SMOKE=1 — skip smoke-phase15-identity-demo-local.sh"
else
  echo "== phase15 smoke (API :8080) =="
  bash scripts/dev/smoke-phase15-identity-demo-local.sh
fi

echo ""
echo "TT_PHASE15_S1_S4_IT_GREEN: OK (① local · not ② GO)"
