#!/usr/bin/env bash
# **Runtime Chain SSOT · cast 只读接线校验**（通用版）
#
# **验证什么**：当前 shell / `.env` 中的 **`CHAIN_RPC_URL`** **+** **治理** **/** **FeeRouter** **地址**
# 是否与 **该 RPC 上** **链上** **`TravelTrustGovernor` / `GovernanceTimelock` / `FeeRouter`** **的** **immutable** **引用** **一致** **（** **自洽** **）** **。**
#
# **不验证什么**：**不** **证明** **「** **测试网** **全网** **最新** **一次** **`DeployGovernanceStack`** **」** **——** **那** **须** **运维** **记录** **/** **Explorer** **/** **部署** **流水** **与** **本** **脚本** **并列** **人工** **确认** **。**
#
# **依赖**：**`cast`** **（** **Foundry** **）** **；** **须** **可访问** **`CHAIN_RPC_URL`** **。**
#
# **环境**：
#   **`ENV_FILE`**              默认 **`$REPO_ROOT/.env`**
#   **`RUNTIME_SSOT_NO_AUTOLOAD_ENV=1`**  不 source **`.env`** **（** **仅用** **当前** **已** **export** **变量** **）**
#   **`RUNTIME_SSOT_SKIP_FEE_ROUTER=1`**  跳过 **`FeeRouter.owner()==Timelock`** **（** **非** **标准** **owner** **模型** **时** **）**
#   **`RUNTIME_SSOT_EXTENDED=1`**  额外：**`cast code`** **非空** **于** **`GUIDE_STAKING_ADDRESS`** **/** **`STAKING_PROVIDER_ADDRESS`** **/** **`TREASURY_ADDRESS`** **（** **若** **已** **设** **）**
#
# **退出码**：**0** **全部** **通过** **|** **1** **缺** **依赖** **/** **缺** **必填** **变量** **|** **2** **RPC** **/** **`cast`** **失败** **|** **3** **链上** **值** **与** **`.env`** **不一致**
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

norm_addr() {
  local x="${1#0x}"
  printf '0x%s' "$(printf '%s' "$x" | tr '[:upper:]' '[:lower:]')"
}

die() { echo "runtime-chain-ssot-cast-verify: $*" >&2; exit 1; }

if [[ "${RUNTIME_SSOT_NO_AUTOLOAD_ENV:-0}" != "1" ]]; then
  ENV_FILE="${ENV_FILE:-${ROOT}/.env}"
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
  fi
fi

if ! command -v cast >/dev/null 2>&1; then
  die "cast (Foundry) not in PATH"
fi

RPC="${CHAIN_RPC_URL:-}"
CID_EXPECT="${CHAIN_ID:-}"
GOV="${GOVERNOR_ADDRESS:-}"
TL="${TIMELOCK_ADDRESS:-}"
TOK="${GOVERNANCE_TOKEN_ADDRESS:-${GOVERNANCE_VOTES_TOKEN_ADDRESS:-}}"
FR="${FEE_ROUTER_ADDRESS:-}"

[[ -n "$RPC" ]] || die "CHAIN_RPC_URL unset"
[[ -n "$GOV" ]] || die "GOVERNOR_ADDRESS unset"
[[ -n "$TL" ]] || die "TIMELOCK_ADDRESS unset"
[[ -n "$TOK" ]] || die "GOVERNANCE_TOKEN_ADDRESS unset (legacy alias: GOVERNANCE_VOTES_TOKEN_ADDRESS)"

GOV_N="$(norm_addr "$GOV")"
TL_N="$(norm_addr "$TL")"
TOK_N="$(norm_addr "$TOK")"

echo "=== runtime-chain-ssot-cast-verify (read-only) ==="
echo "rpc: ${RPC}"
echo "governor(env): ${GOV_N}"
echo "timelock(env): ${TL_N}"
echo "governance_token(env): ${TOK_N}"

# 1) chain id
GOT_CID=""
if ! GOT_CID="$(cast chain-id --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ')"; then
  die "cast chain-id failed (check CHAIN_RPC_URL / RPC reachable)"
fi
echo "cast chain-id → ${GOT_CID}"
if [[ -n "$CID_EXPECT" && "$GOT_CID" != "$CID_EXPECT" ]]; then
  echo "runtime-chain-ssot-cast-verify: FAIL chain-id: rpc=${GOT_CID} CHAIN_ID=${CID_EXPECT}" >&2
  exit 3
fi
if [[ -z "$CID_EXPECT" ]]; then
  echo "runtime-chain-ssot-cast-verify: WARN CHAIN_ID unset — skipped numeric compare (set CHAIN_ID to enforce)"
fi

eth_call_addr() {
  local target="$1"
  local sig="$2"
  local addr
  if ! addr="$(cast call "$target" "$sig" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ')"; then
    return 2
  fi
  norm_addr "$addr"
}

# 2) Governor wiring
TOK_CHAIN=""
TL_FROM_GOV=""
if ! TOK_CHAIN="$(eth_call_addr "$GOV" "token()(address)")"; then
  echo "runtime-chain-ssot-cast-verify: FAIL cast governor.token()" >&2
  exit 2
fi
if ! TL_FROM_GOV="$(eth_call_addr "$GOV" "timelock()(address)")"; then
  echo "runtime-chain-ssot-cast-verify: FAIL cast governor.timelock()" >&2
  exit 2
fi
echo "governor.token()     → ${TOK_CHAIN}"
echo "governor.timelock()  → ${TL_FROM_GOV}"

if [[ "$TOK_CHAIN" != "$TOK_N" ]]; then
  echo "runtime-chain-ssot-cast-verify: FAIL GOVERNANCE_TOKEN_ADDRESS != governor.token()" >&2
  exit 3
fi
if [[ "$TL_FROM_GOV" != "$TL_N" ]]; then
  echo "runtime-chain-ssot-cast-verify: FAIL TIMELOCK_ADDRESS != governor.timelock()" >&2
  exit 3
fi

# 3) Timelock governor pointer
GOV_FROM_TL=""
if ! GOV_FROM_TL="$(eth_call_addr "$TL" "governor()(address)")"; then
  echo "runtime-chain-ssot-cast-verify: FAIL cast timelock.governor()" >&2
  exit 2
fi
echo "timelock.governor()  → ${GOV_FROM_TL}"
if [[ "$GOV_FROM_TL" != "$GOV_N" ]]; then
  echo "runtime-chain-ssot-cast-verify: FAIL GOVERNOR_ADDRESS != timelock.governor()" >&2
  exit 3
fi

# 4) FeeRouter owner → Timelock（可跳过）
if [[ "${RUNTIME_SSOT_SKIP_FEE_ROUTER:-0}" == "1" ]]; then
  echo "runtime-chain-ssot-cast-verify: SKIP FeeRouter (RUNTIME_SSOT_SKIP_FEE_ROUTER=1)"
elif [[ -z "$FR" ]]; then
  echo "runtime-chain-ssot-cast-verify: WARN FEE_ROUTER_ADDRESS unset — skipped feeRouter.owner check"
else
  FR_N="$(norm_addr "$FR")"
  OWN=""
  if ! OWN="$(eth_call_addr "$FR" "owner()(address)")"; then
    echo "runtime-chain-ssot-cast-verify: FAIL cast feeRouter.owner()" >&2
    exit 2
  fi
  echo "feeRouter.owner()    → ${OWN}  (fee_router env → ${FR_N})"
  if [[ "$OWN" != "$TL_N" ]]; then
    echo "runtime-chain-ssot-cast-verify: FAIL TIMELOCK_ADDRESS != feeRouter.owner() (set RUNTIME_SSOT_SKIP_FEE_ROUTER=1 if intentional)" >&2
    exit 3
  fi
fi

# 5) Optional: bytecode presence for protocol seven-key surfaces
if [[ "${RUNTIME_SSOT_EXTENDED:-0}" == "1" ]]; then
  for label_var in "GUIDE_STAKING_ADDRESS:guide" "STAKING_PROVIDER_ADDRESS:provider" "TREASURY_ADDRESS:treasury"; do
    label="${label_var%%:*}"
    tag="${label_var##*:}"
    val="${!label:-}"
    if [[ -z "$val" ]]; then
      echo "runtime-chain-ssot-cast-verify: EXT skip ${label} (unset)"
      continue
    fi
    code_hex=""
    if ! code_hex="$(cast code "$val" --rpc-url "$RPC" 2>/dev/null)"; then
      echo "runtime-chain-ssot-cast-verify: FAIL cast code ${label}" >&2
      exit 2
    fi
    if [[ "$code_hex" == "0x" || "$code_hex" == "0x0" ]]; then
      echo "runtime-chain-ssot-cast-verify: FAIL ${label} has empty code at ${val}" >&2
      exit 3
    fi
    echo "runtime-chain-ssot-cast-verify: EXT ok ${tag} code len ${#code_hex}"
  done
fi

echo "runtime-chain-ssot-cast-verify: OK (env matches on-chain wiring for this RPC)"
exit 0
