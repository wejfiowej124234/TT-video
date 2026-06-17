#!/usr/bin/env bash
# 拒绝 LEGACY / 旧 V2 栈作为活跃读口（HAT-R1 前置）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
fail() { echo "GOV_FREEZE_V2_ACTIVE_BASELINE: FAIL $*" >&2; exit 2; }

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

[[ "${GOV_FREEZE_V2_BASELINE_ACTIVE:-}" == "1" ]] || fail "GOV_FREEZE_V2_BASELINE_ACTIVE≠1"

lc() { echo "${1,,}"; }

TTG="$(lc "${GOVERNANCE_TOKEN_ADDRESS:-}")"
LEG_TTG="$(lc "${LEGACY_GOVERNANCE_TOKEN_ADDRESS:-}")"
[[ -n "$TTG" ]] || fail "GOVERNANCE_TOKEN_ADDRESS unset"
[[ "$TTG" != "$LEG_TTG" ]] || fail "active TTG equals LEGACY_GOVERNANCE_TOKEN"

for pair in \
  "GOVERNOR:${GOVERNOR_ADDRESS:-}:${LEGACY_PRE_GOV_FREEZE_V2_GOVERNOR_ADDRESS:-}" \
  "POOL:${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:-}:${LEGACY_PRE_GOV_FREEZE_V2_REGION_STEWARD_STAKE_POOL_ADDRESS:-}" \
  "TIMELOCK:${TIMELOCK_ADDRESS:-}:${LEGACY_PRE_GOV_FREEZE_V2_TIMELOCK_ADDRESS:-}"; do
  label="${pair%%:*}"
  rest="${pair#*:}"
  active="$(lc "${rest%%:*}")"
  legacy="$(lc "${rest##*:}")"
  [[ -n "$active" ]] || fail "${label} active unset"
  [[ -z "$legacy" || "$active" != "$legacy" ]] || fail "${label} active equals LEGACY"
done

echo "GOV_FREEZE_V2_ACTIVE_BASELINE: OK ttg=${GOVERNANCE_TOKEN_ADDRESS} governor=${GOVERNOR_ADDRESS} pool=${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS}"
