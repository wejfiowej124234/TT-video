#!/usr/bin/env bash
# 根 .env ↔ GET /meta → chain.contracts 对拍（测试网回填后用）
#
# 对应操作顺序：
#   1) 根 .env 已写 CHAIN_* + 治理四件套 +（可选）资金/业务栈 +（可选）质押三键
#   2) 重启 traveltrust-api
#   3) 本脚本：比对 meta 与 .env（Timelock 不在 chain.contracts 顶层，见下方 cast 段）
#   4) 再跑 sync-frontend-env-local-from-root.sh / .ps1 核对 NEXT_PUBLIC_*
#
# 用法（仓库根）：
#   API_BASE_URL=http://127.0.0.1:8080 bash scripts/dev/verify-root-env-vs-meta-chain-contracts.sh
#   ENV_FILE=/path/to/.env API_BASE_URL=https://api.example bash scripts/dev/verify-root-env-vs-meta-chain-contracts.sh
#
# 退出码：0 全部一致或跳过（.env 未设且 meta 为空）；1 不一致或 HTTP/JSON 失败；2 缺 .env
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

echo "=== verify-root-env-vs-meta-chain-contracts ==="
echo "env_file=$ENV_FILE"
echo "api_base=$BASE"

code="$(curl -sS -o "$ROOT/.verify_meta_body.json" -w "%{http_code}" "$BASE/meta" || true)"
[[ "$code" == "200" ]] || die "GET $BASE/meta HTTP $code (start API and check API_BASE_URL)"

# Windows：Store 占位 `python3` 常直接退出 49；优先能 `import json` 的解释器（与 smoke-ab-core-chain 同源）
PY=""
if command -v python >/dev/null 2>&1 && python -c "import json" 2>/dev/null; then
  PY=python
elif command -v python3 >/dev/null 2>&1 && python3 -c "import json" 2>/dev/null; then
  PY=python3
else
  die "need python or python3 with json module"
fi

# --- meta → chain.contracts 扁平 JSON ---
META_BODY="$ROOT/.verify_meta_body.json"
CC_JSON="$("$PY" -c "
import json, sys
path = sys.argv[1]
with open(path, encoding='utf-8') as f:
    m = json.load(f)
ch = m.get('chain')
if not isinstance(ch, dict):
    print('{}')
    sys.exit(0)
cc = ch.get('contracts')
if cc is None or not isinstance(cc, dict):
    print('{}')
else:
    print(json.dumps(cc, separators=(',', ':')))
" "$META_BODY")"

[[ "$CC_JSON" != "{}" ]] || die "chain.contracts is null/empty — set CHAIN_RPC_URL (+ addresses) in root .env and restart API"

mismatches=0

cmp_addr_field() {
  local env_key="$1"
  local meta_key="$2"
  local want
  want="$(get_val "$env_key")"
  want="$(norm_addr "$want")"
  local got
  got="$("$PY" -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get(sys.argv[2]) or '')" "$CC_JSON" "$meta_key")"
  got="$(norm_addr "$got")"
  if [[ -z "$want" ]]; then
    if [[ -n "$got" ]]; then
      echo "SKIP $env_key (unset in .env) but meta.$meta_key=$got — set .env if you expect SSOT"
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
  local got
  got="$("$PY" -c "import json,sys; d=json.loads(sys.argv[1]); v=d.get('chain_id_configured'); print('' if v is None else str(v))" "$CC_JSON")"
  if [[ -z "$want" ]]; then
    echo "SKIP CHAIN_ID unset in .env; meta.chain_id_configured=$got"
    return 0
  fi
  if [[ "$want" == "$got" ]]; then
    echo "OK   CHAIN_ID == meta.chain.contracts.chain_id_configured ($want)"
  else
    echo "FAIL CHAIN_ID=$want vs meta.chain.contracts.chain_id_configured=$got" >&2
    mismatches=$((mismatches + 1))
  fi
}

cmp_addr_field "GOVERNOR_ADDRESS" "governor_address"
# TTG：API 只读 GOVERNANCE_VOTES_TOKEN_ADDRESS；若仅写 GOVERNANCE_TOKEN_ADDRESS，本脚本对拍时回退同名（与 sync-frontend 一致）
cmp_governance_votes_token() {
  local want
  want="$(get_val "GOVERNANCE_VOTES_TOKEN_ADDRESS")"
  [[ -z "${want// }" ]] && want="$(get_val "GOVERNANCE_TOKEN_ADDRESS")"
  want="$(norm_addr "$want")"
  local got
  got="$("$PY" -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('governance_votes_token_address') or '')" "$CC_JSON")"
  got="$(norm_addr "$got")"
  if [[ -z "$want" ]]; then
    echo "SKIP GOVERNANCE_VOTES_TOKEN_ADDRESS / GOVERNANCE_TOKEN_ADDRESS (unset)"
    return 0
  fi
  if [[ "$want" == "$got" ]]; then
    echo "OK   TTG (.env) == meta.chain.contracts.governance_votes_token_address ($want)"
  else
    echo "FAIL TTG .env vs meta.governance_votes_token_address: $want vs $got" >&2
    mismatches=$((mismatches + 1))
  fi
}
cmp_governance_votes_token
cmp_addr_field "REGISTRY_ADDRESS" "registry_address"
cmp_addr_field "STAKING_ADDRESS" "staking_address"
cmp_addr_field "ESCROW_FACTORY_ADDRESS" "escrow_factory_address"
cmp_addr_field "FEE_ROUTER_ADDRESS" "fee_router_address"
cmp_addr_field "REGION_VAULT_ADDRESS" "region_vault_address"
cmp_chain_id

rm -f "$ROOT/.verify_meta_body.json"

# --- Timelock：不在 chain.contracts 顶层；可选 cast ---
TL="$(get_val GOVERNANCE_TIMELOCK_ADDRESS)"
TL="$(norm_addr "$TL")"
RPC="$(get_val CHAIN_RPC_URL)"
if [[ -n "$TL" && -n "$RPC" ]]; then
  echo "=== optional: cast GovernanceTimelock admin() (set PATH to foundry) ==="
  if command -v cast >/dev/null 2>&1; then
    if out="$(cast call "$TL" "admin()(address)" --rpc-url "$RPC" 2>/dev/null)"; then
      echo "cast timelock admin() -> $(norm_addr "$out")"
    else
      echo "WARN cast call failed (RPC or address)" >&2
    fi
  else
    echo "SKIP cast not in PATH"
  fi
else
  echo "SKIP timelock cast block (GOVERNANCE_TIMELOCK_ADDRESS or CHAIN_RPC_URL empty)"
fi

if [[ "$mismatches" -gt 0 ]]; then
  die "$mismatches mismatch(es) between .env and GET /meta chain.contracts"
fi

echo "verify-root-env-vs-meta: OK (no address mismatches for compared fields)"
