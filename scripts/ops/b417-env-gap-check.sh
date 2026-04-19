#!/usr/bin/env bash
# B-417 · 企业级 **配置缺口扫描**（**不**广播交易、**不**打印私钥）
#
# 检查：根目录 **`.env`**、必填变量、**cast** / **jq**、可选 **Python**（与主流程一致）、
# 可选只读链上探针（**`B417_GAP_CHAIN_PROBE=1`**：**chain-id** 与 **`state(proposalId)`**）。
#
# 退出码：**0** 无 **[FAIL]** | **1** 存在 **[FAIL]**（须修补后再跑预检/自动化）
#
# Env：**`B417_NO_AUTOLOAD_ENV=1`** 跳过加载 **`.env`**；**`B417_GAP_CHAIN_PROBE=1`** 启用 RPC 只读探针（须 RPC+Governor+proposal id）。
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

FAILS=0
pass() { printf '[PASS] %s\n' "$*"; }
fail() { printf '[FAIL] %s\n' "$*"; FAILS=$((FAILS + 1)); }
warn() { printf '[WARN] %s\n' "$*"; }

echo "=== B-417 env gap check (enterprise) ==="

if [[ ! -f "${ROOT}/.env" ]]; then
  fail "missing ${ROOT}/.env (copy from .env.example and fill)"
else
  pass "repo root .env file exists"
fi

if [[ "${B417_NO_AUTOLOAD_ENV:-0}" != "1" && -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${ROOT}/.env"
  set +a
  pass "sourced .env (set B417_NO_AUTOLOAD_ENV=1 to skip)"
elif [[ "${B417_NO_AUTOLOAD_ENV:-0}" == "1" ]]; then
  warn "B417_NO_AUTOLOAD_ENV=1 — using current shell env only"
fi

RPC="${B417_RPC_URL:-${CHAIN_RPC_URL:-${RPC_URL:-}}}"
GOV="${B417_GOVERNOR_ADDRESS:-${GOVERNOR_ADDRESS:-}}"
PID="${B417_PROPOSAL_ID:-}"
PK_SET=0
if [[ -n "${B417_PRIVATE_KEY:-${B417_GOV_EXEC_PK:-${B417_GOV_EXECUTOR_PK:-}}}" ]]; then
  PK_SET=1
fi

[[ -n "$RPC" ]] || fail "CHAIN_RPC_URL (or B417_RPC_URL|RPC_URL) unset"
[[ -n "$GOV" ]] || fail "GOVERNOR_ADDRESS unset"
[[ -n "$PID" ]] || fail "B417_PROPOSAL_ID unset"
[[ "$PK_SET" -eq 1 ]] || fail "B417_PRIVATE_KEY or B417_GOV_EXEC_PK unset"
[[ -n "${CHAIN_ID:-}" ]] || warn "CHAIN_ID unset (recommend 11155111 for Sepolia; preflight chain-id check skipped)"
if [[ -n "$RPC" && -n "$GOV" && -n "$PID" && "$PK_SET" -eq 1 ]]; then
  pass "required governance variables present (private key not echoed)"
fi

TOK="${GOVERNANCE_TOKEN_ADDRESS:-${GOVERNANCE_VOTES_TOKEN_ADDRESS:-}}"
if [[ -z "$TOK" ]]; then
  warn "GOVERNANCE_TOKEN_ADDRESS unset (TTG / GovernanceVotesToken; needed for voting-power / wallet import — not Governor)"
else
  pass "GOVERNANCE_TOKEN_ADDRESS set (TTG contract)"
fi

if ! command -v cast >/dev/null 2>&1; then
  fail "cast (Foundry) not in PATH"
else
  pass "cast available"
fi

if ! command -v jq >/dev/null 2>&1; then
  fail "jq not in PATH (sidecars/report tooling)"
else
  pass "jq available"
fi

if command -v py >/dev/null 2>&1 && py -3 -c "pass" >/dev/null 2>&1; then
  pass "python launcher (py -3) works"
elif command -v python3 >/dev/null 2>&1 && python3 -c "pass" >/dev/null 2>&1; then
  pass "python3 works"
else
  warn "no working py -3 / python3 (report/validate may fail)"
fi

if [[ "${B417_GAP_CHAIN_PROBE:-0}" == "1" ]]; then
  echo "=== chain probe (read-only) ==="
  if ! command -v cast >/dev/null 2>&1 || [[ -z "$RPC" || -z "$GOV" || -z "$PID" ]]; then
    fail "chain probe skipped: need cast + CHAIN_RPC_URL + GOVERNOR_ADDRESS + B417_PROPOSAL_ID"
  else
    GOT="$(cast chain-id --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ' || true)"
    if [[ -n "${CHAIN_ID:-}" && -n "$GOT" && "$GOT" != "${CHAIN_ID}" ]]; then
      fail "chain-id mismatch: rpc=${GOT} CHAIN_ID=${CHAIN_ID}"
    elif [[ -n "$GOT" ]]; then
      pass "cast chain-id → ${GOT}"
    fi
    ST="$(cast call "$GOV" "state(uint256)(uint8)" "$PID" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ' || true)"
    if [[ -z "$ST" ]]; then
      fail "could not read state(proposalId) via cast call"
    else
      pass "state(${PID}) → ${ST} (4=Succeeded required before queue)"
      if [[ "$ST" != "4" ]]; then
        fail "proposal not Succeeded (4); fix proposal id or wait governance"
      fi
    fi
  fi
fi

echo "=== summary: ${FAILS} failure(s) ==="
if [[ "$FAILS" -gt 0 ]]; then
  echo "b417-env-gap-check: remediate [FAIL] items, then: bash scripts/ops/b417-sepolia-preflight.sh" >&2
  exit 1
fi
echo "b417-env-gap-check: OK"
exit 0
