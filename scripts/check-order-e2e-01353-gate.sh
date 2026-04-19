#!/usr/bin/env bash
# B-427 · **b409** **acceptance** **（** **可选** **跳过** **cargo** **）** **。**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then JSON=true
  else echo "check-order-e2e-01353-gate: unknown option: $a" >&2; exit 1
  fi
done

if [[ "${B427_SKIP_CARGO:-}" == "1" ]]; then
  echo "check-order-e2e-01353-gate: skip cargo (B427_SKIP_CARGO=1)" >&2
  if ! grep -q "B-427-ORDER-E2E-01353-GATE" "${ROOT}/ops/RUNBOOK.md"; then
    echo "check-order-e2e-01353-gate: ops/RUNBOOK.md missing B-427 anchor" >&2
    exit 2
  fi
else
  bash "${ROOT}/scripts/ops/b409-order-state-primary-acceptance.sh"
  bash "${ROOT}/scripts/ops/b409-order-state-exception-acceptance.sh"
fi

if $JSON; then
  command -v jq >/dev/null 2>&1 || { echo "jq required for --json" >&2; exit 1; }
  ran_json='true'
  if [[ "${B427_SKIP_CARGO:-}" == "1" ]]; then ran_json='false'; fi
  jq -n \
    --arg schema "traveltrust.order_e2e_01353_gate.v1" \
    --arg verdict "GO" \
    --argjson ran_cargo "$ran_json" \
    '{schema_version: $schema, verdict: $verdict, ran_cargo_tests: $ran_cargo}'
else
  echo "check-order-e2e-01353-gate: ok" >&2
fi
