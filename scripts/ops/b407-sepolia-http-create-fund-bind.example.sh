#!/usr/bin/env bash
# **B-407 辅助**：**种子账号** **HTTP** **建单** **→** **接单** **→** **链上** **`EscrowFactory.createEscrow`** **（** **`orderId`** **=** **UUID** **左填充** **bytes32** **，** **与** **`frontend/lib/orderIdBytes32.ts`** **一致** **）** **→** **`POST …/set-escrow-address`** **→** **旅行者** **`approve`+`deposit`** **至** **`Funded`** **。**
#
# **完成后** **将** **打印** **`B407_ESCROW=`** **；** **写入** **`.env`** **后** **可** **执行** **：**
#   `B407_SKIP_DISTRIBUTE=1 bash scripts/ops/b407-exec-chain-release-distribute.sh`
# **Explorer** **核对** **`Released`** **与** **Escrow→FeeRouter** **转账** **见** **`b407-exec-chain-release-distribute.sh`** **头注释** **。**
#
# **须** **与** **本** **订单** **一致** **的** **私钥** **：**
#   **`B407_TRAVELER_PK`** **/** **`PRIVATE_KEY`** **：** **须** **等于** **`createEscrow`** **里** **`traveler`** **地址** **（** **`deposit`** **校验** **`msg.sender == traveler`** **）** **。**
#   **`B407_GUIDE_PK`** **：** **须** **等于** **`guide`** **地址** **（** **与** **`release()`** **向导** **收款** **一致** **）** **。**
#   **`B407_FACTORY_DEPLOYER_PK`** **（** **或** **`B407_RELAYER_PK`** **）：** **付** **`createEscrow`** **gas** **的** **EOA** **（** **任意** **有余额** **即可** **）** **。**
#
# **环境** **（** **仓库根** **`set -a && source .env && set +a`** **或** **手动** **`export`** **）** **：**
#   **`API_BASE_URL`** **、** **`CHAIN_RPC_URL`** **、** **`ESCROW_FACTORY_ADDRESS`** **、** **`FEE_ROUTER_ADDRESS`** **（** **`platformFeeRecipient`** **）** **、** **`PAYMENT_TOKEN`** **（** **标准** **ERC20** **，** **如** **MockERC20** **；** **勿** **用** **GovernanceVotesToken** **）** **。**
#   **`B407_TOURIST_EMAIL`** **/** **`B407_GUIDE_EMAIL`** **/** **`B407_PASSWORD`** **（** **默认** **同** **B-407** **runner** **）** **。**
#   **`B407_ORDER_AMOUNT`** **（** **默认** **100** **；** **链上** **按** **USDC** **6** **位** **×** **1e6** **与** **前端** **`orderAmountToBigInt`** **一致** **）** **。**
#   **`B407_SKIP_SEED`** **=** **1** **可** **跳过** **`POST /auth/seed-test-accounts`** **。**
#   **`B407_AUTO_RELEASE`** **=** **1** **时** **在** **`Funded`** **后** **直接** **调用** **`b407-exec-chain-release-distribute.sh`** **（** **须** **已** **设** **`B407_RELAYER_PK`** **等** **；** **默认** **仅** **打印** **Escrow** **地址** **）** **。**
#
# **依赖** **：** **`curl`** **、** **`jq`** **、** **`cast`** **、** **`forge`** **、** **`awk`** **（** **可选** **：** **小数** **金额** **→** **wei** **）** **；** **`orderId`** **bytes32** **由** **本** **脚本** **纯** **bash** **生成** **（** **避免** **Windows** **`python3`** **占位** **导致** **空** **变量** **）** **。**
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

_strip_cr() { printf '%s' "${1//$'\r'/}"; }

_normalize_hex_pk() {
  local k="$(_strip_cr "${1:-}")"
  [[ -z "$k" ]] && { printf '%s' "$k"; return; }
  if [[ "$k" =~ ^0x[0-9a-fA-F]{64}$ ]]; then printf '%s' "$k"; return; fi
  if [[ "$k" =~ ^[0-9a-fA-F]{64}$ ]]; then printf '0x%s' "$k"; return; fi
  printf '%s' "$k"
}

# 与 **`frontend/lib/orderIdBytes32.ts`** **`pad(0x`uuid_hex`, 32)`** **一致** **：** **左** **16** **字节** **0** **+** **UUID** **16** **字节** **。**
order_uuid_to_bytes32() {
  local raw="${1//-/}"
  raw="${raw,,}"
  if [[ ! "$raw" =~ ^[0-9a-f]{32}$ ]]; then
    echo "b407-sepolia-http-create-fund-bind: invalid order uuid: $1" >&2
    return 1
  fi
  printf '0x00000000000000000000000000000000%s' "$raw"
}

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

RPC="$(_strip_cr "${CHAIN_RPC_URL:-${B407_RPC_URL:-${RPC_URL:-}}}")"
FACTORY="$(_strip_cr "${ESCROW_FACTORY_ADDRESS:-}")"
FEE_ROUTER="$(_strip_cr "${FEE_ROUTER_ADDRESS:-${B407_FEE_ROUTER:-}}")"
TOKEN="$(_strip_cr "${PAYMENT_TOKEN:-${MOCK_ERC20_ADDRESS:-${ESCROW_PAYMENT_TOKEN:-}}}")"

TOURIST_EMAIL="${B407_TOURIST_EMAIL:-tourist@test.com}"
GUIDE_EMAIL="${B407_GUIDE_EMAIL:-guide@test.com}"
SEED_PW="${B407_PASSWORD:-Test123!}"
GUIDE_CITY="${B407_GUIDE_CITY:-杭州}"
ORDER_AMT="${B407_ORDER_AMOUNT:-100}"
ORDER_CCY="${B407_ORDER_CURRENCY:-USD}"

PK_T="$(_normalize_hex_pk "${B407_TRAVELER_PK:-${PRIVATE_KEY:-}}")"
PK_G="$(_normalize_hex_pk "${B407_GUIDE_PK:-}")"
PK_DEPLOY="$(_normalize_hex_pk "${B407_FACTORY_DEPLOYER_PK:-${B407_RELAYER_PK:-}}")"

for cmd in curl jq cast forge; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "b407-sepolia-http-create-fund-bind: need $cmd" >&2
    exit 1
  }
done

if [[ -z "$RPC" || -z "$FACTORY" || -z "$FEE_ROUTER" || -z "$TOKEN" ]]; then
  echo "b407-sepolia-http-create-fund-bind: need CHAIN_RPC_URL, ESCROW_FACTORY_ADDRESS, FEE_ROUTER_ADDRESS, PAYMENT_TOKEN (or MOCK_ERC20_ADDRESS)" >&2
  exit 1
fi
if [[ -z "$PK_T" || -z "$PK_G" || -z "$PK_DEPLOY" ]]; then
  echo "b407-sepolia-http-create-fund-bind: need B407_TRAVELER_PK (or PRIVATE_KEY), B407_GUIDE_PK, B407_FACTORY_DEPLOYER_PK (or B407_RELAYER_PK)" >&2
  exit 1
fi

ADDR_T="$(cast wallet address --private-key "$PK_T" | tr -d '\r\n')"
ADDR_G="$(cast wallet address --private-key "$PK_G" | tr -d '\r\n')"
echo "b407-sepolia-http-create-fund-bind: traveler=$ADDR_T guide=$ADDR_G"

login_json() {
  local email="$1"
  local out code
  out="$(mktemp)"
  code="$(
    curl -sS -o "$out" -w "%{http_code}" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${email}\",\"password\":\"${SEED_PW}\"}" \
      "${BASE}/auth/login"
  )"
  if [[ "$code" != "200" ]]; then
    echo "b407-sepolia-http-create-fund-bind: login failed ${email} HTTP ${code}" >&2
    head -c 1200 "$out" >&2 || true
    echo >&2
    rm -f "$out"
    exit 10
  fi
  cat "$out"
  rm -f "$out"
}

if [[ "${B407_SKIP_SEED:-0}" != "1" ]]; then
  curl -sS -X POST "${BASE}/auth/seed-test-accounts" -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true
fi

echo "b407-sepolia-http-create-fund-bind: logging in..."
TOURIST_JSON="$(login_json "$TOURIST_EMAIL")"
GUIDE_JSON="$(login_json "$GUIDE_EMAIL")"
TOKEN_T="$(echo "$TOURIST_JSON" | jq -r '.token // empty')"
TOKEN_G="$(echo "$GUIDE_JSON" | jq -r '.token // empty')"
if [[ -z "$TOKEN_T" || -z "$TOKEN_G" ]]; then
  echo "b407-sepolia-http-create-fund-bind: missing token in login response" >&2
  exit 10
fi

guides_tmp="$(mktemp)"
curl -sS -o "$guides_tmp" "${BASE}/api/v1/guides?city=$(printf '%s' "$GUIDE_CITY" | jq -sRr @uri)"
GUIDE_ROW_ID="$(jq -r '.items[0].id // empty' "$guides_tmp")"
if [[ -z "$GUIDE_ROW_ID" ]]; then
  curl -sS -o "$guides_tmp" "${BASE}/api/v1/guides"
  GUIDE_ROW_ID="$(jq -r '.items[0].id // empty' "$guides_tmp")"
fi
rm -f "$guides_tmp"

if [[ -z "$GUIDE_ROW_ID" ]]; then
  echo "b407-sepolia-http-create-fund-bind: no guide in GET /api/v1/guides" >&2
  exit 8
fi

echo "b407-sepolia-http-create-fund-bind: POST /api/v1/orders..."
body="$(jq -n \
  --arg gid "$GUIDE_ROW_ID" \
  --arg amt "$ORDER_AMT" \
  --arg ccy "$ORDER_CCY" \
  '{guide_id:$gid, amount:$amt, currency:$ccy}')"

oc_tmp="$(mktemp)"
code_oc="$(
  curl -sS -o "$oc_tmp" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN_T}" \
    -d "$body" \
    "${BASE}/api/v1/orders"
)"
if [[ "$code_oc" != "200" ]]; then
  echo "b407-sepolia-http-create-fund-bind: POST /orders HTTP ${code_oc}" >&2
  head -c 1600 "$oc_tmp" >&2 || true
  echo >&2
  rm -f "$oc_tmp"
  exit 11
fi
ORDER_ID="$(jq -r '.order.id // empty' "$oc_tmp")"
rm -f "$oc_tmp"
if [[ -z "$ORDER_ID" ]]; then
  echo "b407-sepolia-http-create-fund-bind: could not parse order.id" >&2
  exit 11
fi

echo "b407-sepolia-http-create-fund-bind: accept order ${ORDER_ID}..."
code_acc="$(
  curl -sS -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${TOKEN_G}" \
    "${BASE}/api/v1/orders/${ORDER_ID}/accept"
)"
if [[ "$code_acc" != "200" ]]; then
  echo "b407-sepolia-http-create-fund-bind: accept HTTP ${code_acc}" >&2
  exit 11
fi

ORDER_ID_B32="$(order_uuid_to_bytes32 "$ORDER_ID")"
CHAIN_ID="$(cast chain-id --rpc-url "$RPC" | tr -d '\r\n')"

# 与前端 orderAmountToBigInt 一致：最小单位 = round(amount * 1e6)
_norm_amt="${ORDER_AMT//,/}"
if command -v awk >/dev/null 2>&1; then
  TOTAL_WEI="$(awk -v a="$_norm_amt" 'BEGIN { printf "%d", a * 1000000 + 0.5 }')"
else
  int_part="${_norm_amt%%.*}"
  TOTAL_WEI=$((int_part * 1000000))
fi

# snapshotHash：链上 init 不校验内容；与「占位标签」绑定便于人工对照
SNAPSHOT="$(cast keccak "traveltrust/b407-e2e/${ORDER_ID}" | tr -d '\r\n')"

NOW="$(date +%s)"
END="$((NOW + 7 * 86400))"
DISPUTE="${B407_DISPUTE_WINDOW_SECONDS:-604800}"
SCHEMA_VER="${B407_ESCROW_SCHEMA_VERSION:-1}"
BPS="${B407_PLATFORM_FEE_BPS:-0}"
ARB="${B407_ESCROW_ARBITRATOR:-0x0000000000000000000000000000000000000000}"

echo "b407-sepolia-http-create-fund-bind: createEscrow on-chain (factory gas from B407_FACTORY_DEPLOYER_PK) via forge script..."
# 部分环境 **`cast send`** **嵌套元组** **会** **静默** **失败** **（** **exit 49** **）** **；** **统一** **走** **`CreateEscrowB407.s.sol`** **。**
export ESCROW_FACTORY_ADDRESS="$FACTORY"
export B407_ORDER_ID_BYTES32="$ORDER_ID_B32"
export B407_SNAPSHOT_BYTES32="$SNAPSHOT"
export B407_ESCROW_CHAIN_ID="$CHAIN_ID"
export B407_TRAVELER="$ADDR_T"
export B407_GUIDE="$ADDR_G"
export B407_FEE_ROUTER="$FEE_ROUTER"
export PAYMENT_TOKEN="$TOKEN"
export B407_TOTAL_AMOUNT_WEI="$TOTAL_WEI"
export B407_PLATFORM_FEE_BPS="$BPS"
export B407_SERVICE_START="$NOW"
export B407_SERVICE_END="$END"
export B407_DISPUTE_WINDOW_SECONDS="$DISPUTE"
export B407_ESCROW_SCHEMA_VERSION="$SCHEMA_VER"
export B407_ARBITRATOR="$ARB"
export B407_FACTORY_DEPLOYER_PK="$PK_DEPLOY"
if ! (cd "${ROOT}/contracts" && forge script script/CreateEscrowB407.s.sol:CreateEscrowB407 \
  --rpc-url "$RPC" --broadcast -vvv); then
  echo "b407-sepolia-http-create-fund-bind: forge script CreateEscrowB407 failed" >&2
  exit 12
fi

ESCROW="$(cast call "$FACTORY" "escrowOf(bytes32)(address)" "$ORDER_ID_B32" --rpc-url "$RPC" | tr -d '\r\n')"
if [[ -z "$ESCROW" || "${ESCROW,,}" == "0x0000000000000000000000000000000000000000" ]]; then
  echo "b407-sepolia-http-create-fund-bind: escrowOf returned empty after createEscrow" >&2
  exit 12
fi

echo "b407-sepolia-http-create-fund-bind: POST …/set-escrow-address ($ESCROW)..."
se_tmp="$(mktemp)"
code_se="$(
  curl -sS -o "$se_tmp" -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN_T}" \
    -d "$(jq -n --arg a "$ESCROW" '{escrow_address:$a}')" \
    "${BASE}/api/v1/orders/${ORDER_ID}/set-escrow-address"
)"
if [[ "$code_se" != "200" ]]; then
  echo "b407-sepolia-http-create-fund-bind: set-escrow-address HTTP ${code_se}" >&2
  head -c 1600 "$se_tmp" >&2 || true
  echo >&2
  rm -f "$se_tmp"
  exit 13
fi
rm -f "$se_tmp"

echo "b407-sepolia-http-create-fund-bind: traveler approve + deposit (Funded)..."
if [[ "${ESCROW_MINT_TEST_TOKENS:-0}" == "1" ]]; then
  cast send "$TOKEN" "mint(address,uint256)" "$ADDR_T" "$TOTAL_WEI" --rpc-url "$RPC" --private-key "$PK_T" --confirmations 1 || true
fi
cast send "$TOKEN" "approve(address,uint256)" "$ESCROW" "$TOTAL_WEI" --rpc-url "$RPC" --private-key "$PK_T" --confirmations 1
cast send "$ESCROW" "deposit(uint256)" "$TOTAL_WEI" --rpc-url "$RPC" --private-key "$PK_T" --confirmations 1

ST="$(cast call "$ESCROW" "status()(uint8)" --rpc-url "$RPC" | tr -d '\r\n')"
ST_RAW="${ST%%[*}"
ST_RAW="${ST_RAW%% *}"
echo "b407-sepolia-http-create-fund-bind: Escrow.status (2=Funded) = $ST_RAW"

echo ""
echo "=== OK: real order + Funded escrow ==="
echo "order_id (API):     $ORDER_ID"
echo "orderId (bytes32):  $ORDER_ID_B32"
echo "escrow_address:     $ESCROW"
echo ""
echo "Add to .env (or export for this shell):"
echo "  export B407_ESCROW=$ESCROW"
echo "  export CHAIN_RPC_URL=$RPC"
echo "  export FEE_ROUTER_ADDRESS=$FEE_ROUTER"
echo ""
echo "Release-only (Explorer: Released + Escrow→FeeRouter):"
echo "  B407_SKIP_DISTRIBUTE=1 bash scripts/ops/b407-exec-chain-release-distribute.sh"

if [[ "${B407_AUTO_RELEASE:-0}" == "1" ]]; then
  export B407_ESCROW="$ESCROW"
  export CHAIN_RPC_URL="$RPC"
  export B407_FEE_ROUTER="$FEE_ROUTER"
  export B407_SKIP_DISTRIBUTE="${B407_SKIP_DISTRIBUTE:-1}"
  bash "${ROOT}/scripts/ops/b407-exec-chain-release-distribute.sh"
fi

exit 0
