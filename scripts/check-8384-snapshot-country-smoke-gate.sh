#!/usr/bin/env bash
# B-423：**B-384** **→** **B-385** **（** **可** **跳过** **）** **。**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then JSON=true
  else echo "check-8384-snapshot-country-smoke-gate: unknown option: $a" >&2; exit 1
  fi
done

if [[ "${B423_SKIP_REGION_VAULT_SMOKE:-}" != "1" ]] && [[ -f scripts/ops/b384-region-vault-forwarded-log-count-reconcile-admin-overview-smoke.sh ]]; then
  bash scripts/ops/b384-region-vault-forwarded-log-count-reconcile-admin-overview-smoke.sh
fi
if [[ "${B423_SKIP_COUNTRY_LEDGER_SMOKE:-}" != "1" ]] && [[ -f scripts/ops/b385-p5-country-ledger-credited-log-count-reconcile-admin-overview-smoke.sh ]]; then
  bash scripts/ops/b385-p5-country-ledger-credited-log-count-reconcile-admin-overview-smoke.sh
fi

if $JSON; then
  command -v jq >/dev/null 2>&1 || { echo "jq required for --json" >&2; exit 1; }
  jq -n --arg schema "traveltrust.data_8384_snapshot_country_smoke_gate.v1" --arg verdict GO \
    '{schema_version:$schema, verdict:$verdict}'
else
  echo "check-8384-snapshot-country-smoke-gate: ok" >&2
fi
