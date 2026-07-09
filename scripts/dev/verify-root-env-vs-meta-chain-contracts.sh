#!/usr/bin/env bash
# 根 .env ↔ GET /meta → chain.contracts 对拍（759 十三键 + chain.chain_id）
#
# 用法（仓库根）：
#   API_BASE_URL=http://127.0.0.1:8080 bash scripts/dev/verify-root-env-vs-meta-chain-contracts.sh
#
# 退出码：0 全部一致或跳过；1 不一致或 HTTP/JSON 失败；2 缺 .env
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-$ROOT/.env}"
BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

die() { echo "verify-root-env-vs-meta: ERROR: $*" >&2; exit 1; }

[[ -f "$ENV_FILE" ]] || die "missing ENV_FILE=$ENV_FILE"

get_val() {
  local k="$1"
  local line
  line=$(grep -E "^[[:space:]]*${k}=" "$ENV_FILE" 2>/dev/null | head -1) || true
  [[ -z "$line" ]] && echo -n "" && return 0
  echo "$line" | sed "s/^[[:space:]]*${k}=//" | sed 's/\r$//' | sed 's/^"\(.*\)"$/\1/'
}

norm_addr() {
  local x="${1:-}"
  x="${x#0x}"
  x="$(printf '%s' "$x" | tr '[:upper:]' '[:lower:]')"
  [[ -z "$x" ]] && echo "" && return
  printf '0x%s' "$x"
}

echo "=== verify-root-env-vs-meta-chain-contracts (759) ==="
echo "env_file=$ENV_FILE"
echo "api_base=$BASE"

META_BODY="$ROOT/.verify_meta_body.json"
code="$(curl -sS -o "$META_BODY" -w "%{http_code}" "$BASE/meta" || true)"
[[ "$code" == "200" ]] || die "GET $BASE/meta HTTP $code (start API and check API_BASE_URL)"

PY=""
if command -v python >/dev/null 2>&1 && python -c "import json" 2>/dev/null; then
  PY=python
elif command -v python3 >/dev/null 2>&1 && python3 -c "import json" 2>/dev/null; then
  PY=python3
else
  die "need python or python3 with json module"
fi

CC_JSON="$("$PY" -c "
import json, sys
with open(sys.argv[1], encoding='utf-8') as f:
    m = json.load(f)
ch = m.get('chain') or {}
cc = ch.get('contracts')
if cc is None or not isinstance(cc, dict):
    print('{}')
else:
    print(json.dumps(cc, separators=(',', ':')))
" "$META_BODY")"

CHAIN_ID_META="$("$PY" -c "
import json, sys
with open(sys.argv[1], encoding='utf-8') as f:
    m = json.load(f)
ch = m.get('chain') or {}
print(ch.get('chain_id') or '')
" "$META_BODY")"

[[ "$CC_JSON" != "{}" ]] || die "chain.contracts is null/empty — set CHAIN_RPC_URL (+ addresses) in root .env and restart API"

mismatches=0

cmp_addr_field() {
  local env_key="$1"
  local meta_key="$2"
  local want fallback=""
  want="$(get_val "$env_key")"
  if [[ -z "${want// }" && -n "${3:-}" ]]; then
    want="$(get_val "$3")"
    fallback="$3"
  fi
  want="$(norm_addr "$want")"
  local got
  got="$("$PY" -c "import json,sys; d=json.loads(sys.argv[1]); v=d.get(sys.argv[2]); print('' if v is None else str(v))" "$CC_JSON" "$meta_key")"
  got="$(norm_addr "$got")"
  if [[ -z "$want" ]]; then
    if [[ -n "$got" ]]; then
      echo "SKIP $env_key (unset in .env) but meta.$meta_key=$got"
    else
      echo "SKIP $env_key / meta.$meta_key (both empty)"
    fi
    return 0
  fi
  if [[ "$want" == "$got" ]]; then
    echo "OK   $env_key == meta.chain.contracts.$meta_key ($want)"
  else
    echo "FAIL $env_key (.env)=$want vs meta.chain.contracts.$meta_key=$got" >&2
    mismatches=$((mismatches + 1))
  fi
}

cmp_chain_id() {
  local want
  want="$(get_val "CHAIN_ID")"
  want="${want// /}"
  local got="${CHAIN_ID_META// /}"
  if [[ -z "$want" ]]; then
    echo "SKIP CHAIN_ID unset in .env; meta.chain.chain_id=$got"
    return 0
  fi
  if [[ "$want" == "$got" ]]; then
    echo "OK   CHAIN_ID == meta.chain.chain_id ($want)"
  else
    echo "FAIL CHAIN_ID=$want vs meta.chain.chain_id=$got" >&2
    mismatches=$((mismatches + 1))
  fi
}

cmp_addr_field "GUIDE_STAKING_ADDRESS" "guide_staking_address" "STAKING_ADDRESS"
cmp_addr_field "STAKING_PROVIDER_ADDRESS" "staking_provider_address" "PROVIDER_STAKING_POOL_ADDRESS"
cmp_addr_field "GOVERNANCE_VOTES_TOKEN_ADDRESS" "governance_token_address" "GOVERNANCE_TOKEN_ADDRESS"
cmp_addr_field "FEE_ROUTER_ADDRESS" "fee_router_address"
cmp_addr_field "REGISTRY_ADDRESS" "registry_address"
cmp_addr_field "ESCROW_FACTORY_ADDRESS" "escrow_factory_address"
cmp_addr_field "REGION_STEWARD_STAKE_POOL_ADDRESS" "region_steward_stake_pool_address"
cmp_addr_field "GOVERNOR_ADDRESS" "governor_address"
cmp_addr_field "GOVERNANCE_TIMELOCK_ADDRESS" "timelock_address" "TIMELOCK_ADDRESS"
cmp_addr_field "GOVERNANCE_TREASURY_P4CAP_ADDRESS" "treasury_address" "TREASURY_P4_CAP_ADDRESS"
cmp_addr_field "LEGACY_TREASURY_ADDRESS" "legacy_treasury_address"
cmp_chain_id

rm -f "$META_BODY"

if [[ "$mismatches" -gt 0 ]]; then
  die "$mismatches mismatch(es) between .env and GET /meta chain.contracts (759)"
fi

echo "verify-root-env-vs-meta: OK (759 fields aligned)"
