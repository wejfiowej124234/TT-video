#!/usr/bin/env bash
# TT-B407：校验 **`.env`** 里链与合约变量非空，并检查 **`B407_RELAYER_PK` / `B407_OWNER_PK`** 格式（**不**打印私钥内容）。
# 自动去掉 Windows **`\\r`** 后再做 **`cast wallet address`** 试解码。
#
# 用法（仓库根）：
#   bash scripts/ops/b407-env-preflight.example.sh
# 可选：仅检查 release 段或 distribute 段所需变量
#   B407_PREFLIGHT_MODE=release   # 不要求精通 B407_OWNER_PK
#   B407_PREFLIGHT_MODE=distribute # 不要求精通 B407_RELAYER_PK
#   B407_PREFLIGHT_MODE=all      # 默认：两根密钥都须可解码
#
# 退出码：0 就绪；1 缺变量或 cast 不可用；2 私钥格式/解码失败。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

_strip_cr() { printf '%s' "${1//$'\r'/}"; }

MODE="${B407_PREFLIGHT_MODE:-all}"
MODE="${MODE//$'\r'/}"

RPC="$(_strip_cr "${B407_RPC_URL:-${CHAIN_RPC_URL:-${RPC_URL:-}}}")"
ESC="$(_strip_cr "${B407_ESCROW:-${B407_ESCROW_ADDRESS:-}}")"
FR="$(_strip_cr "${B407_FEE_ROUTER:-${FEE_ROUTER_ADDRESS:-}}")"
REL="$(_strip_cr "${B407_RELAYER_PK:-}")"
OWN="$(_strip_cr "${B407_OWNER_PK:-}")"

fail=0

if [[ -z "$RPC" ]]; then
  echo "b407-env-preflight: set CHAIN_RPC_URL or B407_RPC_URL or RPC_URL" >&2
  fail=1
fi
if [[ -z "$ESC" ]]; then
  echo "b407-env-preflight: set B407_ESCROW or B407_ESCROW_ADDRESS (Funded Escrow proxy)" >&2
  fail=1
fi
if [[ -z "$FR" ]]; then
  echo "b407-env-preflight: set FEE_ROUTER_ADDRESS or B407_FEE_ROUTER" >&2
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

if ! command -v cast >/dev/null 2>&1; then
  echo "b407-env-preflight: cast (Foundry) not in PATH" >&2
  exit 1
fi

_check_pk() {
  local label="$1"
  local raw="$2"
  local required="$3"
  local k="$(_strip_cr "$raw")"
  if [[ "$k" =~ ^[0-9a-fA-F]{64}$ ]]; then
    k="0x${k}"
  fi
  local len="${#k}"
  if [[ -z "$k" ]]; then
    if [[ "$required" == "1" ]]; then
      echo "b407-env-preflight: ${label} is empty (required for this mode)" >&2
      return 2
    fi
    echo "b407-env-preflight: ${label} unset (optional for this mode)"
    return 0
  fi
  if [[ ! "$k" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
    echo "b407-env-preflight: ${label} bad format (len=${len}; want 0x + 64 hex, or 64 hex without 0x). Strip quotes/BOM/CRLF." >&2
    return 2
  fi
  if ! out="$(cast wallet address --private-key "$k" 2>/dev/null)"; then
    echo "b407-env-preflight: ${label}: cast could not decode (check for hidden chars; use one line in .env)" >&2
    return 2
  fi
  out="$(_strip_cr "$out")"
  echo "b407-env-preflight: ${label} → address ${out}"
  return 0
}

rc=0
if [[ "$MODE" == "release" || "$MODE" == "all" ]]; then
  _check_pk "B407_RELAYER_PK" "$REL" "1" || rc=2
fi
if [[ "$MODE" == "distribute" || "$MODE" == "all" ]]; then
  _check_pk "B407_OWNER_PK" "$OWN" "1" || rc=2
fi

if [[ "$rc" -ne 0 ]]; then
  exit 2
fi

echo "b407-env-preflight: chain RPC + B407_ESCROW + FeeRouter present; keys ok for mode=${MODE}"
echo "  RPC=${RPC}"
echo "  B407_ESCROW=${ESC}"
echo "  FEE_ROUTER=${FR}"
exit 0
