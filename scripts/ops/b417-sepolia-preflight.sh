#!/usr/bin/env bash
# B-417 · **Sepolia** **预检** **：** **RPC** **+** **Governor** **+** **`state(proposalId)`** **（** **默认** **须** **Succeeded=4** **；** **`B417_ALLOW_QUEUED_PREFLIGHT=1`** **时** **允许** **Queued=5** **）** **。**
#
# 环境：与 **`b417-env-gap-check.sh`** **一致** **（** **`.env`** **可** **自动** **加载** **）** **。**
#
# 退出码：**0** **PASS** **|** **1** **缺** **变量** **|** **12** **链** **读** **失败** **/** **状态** **不符**
#
# 用法（仓库根）：**`bash scripts/ops/b417-sepolia-preflight.sh`**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ "${B417_NO_AUTOLOAD_ENV:-0}" != "1" && -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${ROOT}/.env"
  set +a
fi

RPC="${B417_RPC_URL:-${CHAIN_RPC_URL:-${RPC_URL:-}}}"
GOV="${B417_GOVERNOR_ADDRESS:-${GOVERNOR_ADDRESS:-}}"
PID="${B417_PROPOSAL_ID:-}"

if ! command -v cast >/dev/null 2>&1; then
  echo "b417-sepolia-preflight: cast is required" >&2
  exit 12
fi
if [[ -z "$RPC" || -z "$GOV" || -z "$PID" ]]; then
  echo "b417-sepolia-preflight: need CHAIN_RPC_URL, GOVERNOR_ADDRESS, B417_PROPOSAL_ID" >&2
  exit 1
fi

ST="$(cast call "$GOV" "state(uint256)(uint8)" "$PID" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ' || true)"
if [[ -z "$ST" ]]; then
  echo "b417-sepolia-preflight: could not read proposal state" >&2
  exit 12
fi

if [[ "$ST" == "4" ]]; then
  echo "b417-sepolia-preflight: proposal ${PID} state=4 (Succeeded) OK" >&2
  exit 0
fi
if [[ "$ST" == "5" && "${B417_ALLOW_QUEUED_PREFLIGHT:-}" == "1" ]]; then
  echo "b417-sepolia-preflight: proposal ${PID} state=5 (Queued) OK (B417_ALLOW_QUEUED_PREFLIGHT=1)" >&2
  exit 0
fi

echo "b417-sepolia-preflight: proposal ${PID} state=${ST} (need 4=Succeeded, or 5=Queued with B417_ALLOW_QUEUED_PREFLIGHT=1)" >&2
exit 12
