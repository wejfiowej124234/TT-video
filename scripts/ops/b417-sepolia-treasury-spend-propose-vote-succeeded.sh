#!/usr/bin/env bash
# Sepolia：**GovernanceTreasury.spend / spendETH** 治理提案 → **castVote(For)** → 等待 **state=4（Succeeded）**
#
# 与 **`SepoliaProposeTreasurySpend.s.sol`**、**TT-TREASURY-SPEND-MINI-EVIDENCE-001**、**B-417** 证据包配套。
#
# 须根目录 **`.env`**（或 export）：
#   **CHAIN_RPC_URL**、**GOVERNOR_ADDRESS**、**PRIVATE_KEY**（或 **B417_PRIVATE_KEY**）、
#   **TREASURY_ADDRESS**、**TREASURY_SPEND_TO**、**TREASURY_SPEND_AMOUNT**
# **ERC20**（默认 **TREASURY_SPEND_MODE=ERC20** 或未设）：**GOVERNANCE_TOKEN_ADDRESS**（= `spend(token,…)` 的 token）
# **ETH**（**TREASURY_SPEND_MODE=ETH**）：不要求 **GOVERNANCE_TOKEN_ADDRESS**；金库须已有 ≥ **TREASURY_SPEND_AMOUNT** wei **ETH**
#
# 可选：**B417_VOTE_SLEEP_SEC**（默认 25）、**B417_STATE_SLEEP_SEC**（默认 120）
# 可选：**TREASURY_SPEND_SKIP_PREFUND=1** — 跳过「从 proposer 钱包向金库转入 token」预充（默认 **ERC20** 下会尝试预充 **TREASURY_SPEND_AMOUNT**，以便 **execute** 时 **`spend`** 不 revert）
#
# 用法：仓库根 **`bash scripts/ops/b417-sepolia-treasury-spend-propose-vote-succeeded.sh`**
#
# 成功后：将输出的 **`B417_PROPOSAL_ID`** 写入 **`.env`**，再按线 B 跑 **gap-check → preflight → b417-run-onchain-evidence.sh → b417-evidence-pack-verify.sh**。
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ "${B417_NO_AUTOLOAD_ENV:-0}" != "1" && -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${ROOT}/.env"
  set +a
fi

PK="${PRIVATE_KEY:-${B417_PRIVATE_KEY:-}}"
case "${PK}" in
  0x*) ;;
  "") echo "b417-sepolia-treasury-spend-propose-vote-succeeded: need PRIVATE_KEY or B417_PRIVATE_KEY" >&2; exit 1 ;;
  *) PK="0x${PK}" ;;
esac
export PRIVATE_KEY="$PK"

GOV="${GOVERNOR_ADDRESS:-}"
RPC="${B417_RPC_URL:-${CHAIN_RPC_URL:-${RPC_URL:-}}}"
TREASURY="${TREASURY_ADDRESS:-}"
SPEND_TO="${TREASURY_SPEND_TO:-}"
SPEND_AMT="${TREASURY_SPEND_AMOUNT:-}"
MODE="${TREASURY_SPEND_MODE:-ERC20}"
TOK="${GOVERNANCE_TOKEN_ADDRESS:-${GOVERNANCE_VOTES_TOKEN_ADDRESS:-}}"

if [[ -z "$GOV" || -z "$RPC" || -z "$TREASURY" || -z "$SPEND_TO" || -z "$SPEND_AMT" ]]; then
  echo "b417-sepolia-treasury-spend-propose-vote-succeeded: need GOVERNOR_ADDRESS, CHAIN_RPC_URL, TREASURY_ADDRESS, TREASURY_SPEND_TO, TREASURY_SPEND_AMOUNT" >&2
  exit 1
fi

if [[ "$MODE" == "ETH" || "$MODE" == "eth" ]]; then
  export TREASURY_SPEND_MODE="ETH"
else
  export TREASURY_SPEND_MODE="ERC20"
  if [[ -z "$TOK" ]]; then
    echo "b417-sepolia-treasury-spend-propose-vote-succeeded: ERC20 mode needs GOVERNANCE_TOKEN_ADDRESS (token for spend)" >&2
    exit 1
  fi
  export GOVERNANCE_TOKEN_ADDRESS="$TOK"
fi

export GOVERNOR_ADDRESS="$GOV"
export TREASURY_ADDRESS="$TREASURY"
export TREASURY_SPEND_TO="$SPEND_TO"
export TREASURY_SPEND_AMOUNT="$SPEND_AMT"

VOTE_SLEEP="${B417_VOTE_SLEEP_SEC:-25}"
STATE_SLEEP="${B417_STATE_SLEEP_SEC:-120}"

if [[ "${B417_DELEGATE_CAST:-0}" == "1" ]]; then
  if [[ -z "${TOK:-}" ]]; then
    echo "b417-sepolia-treasury-spend-propose-vote-succeeded: B417_DELEGATE_CAST=1 requires GOVERNANCE_TOKEN_ADDRESS" >&2
    exit 1
  fi
  SELF_ADDR="$(cast wallet address --private-key "$PK")"
  echo "b417-sepolia-treasury-spend-propose-vote-succeeded: [0] delegate(self) (ERC20Votes-style) …" >&2
  cast send "$TOK" "delegate(address)" "$SELF_ADDR" --rpc-url "$RPC" --private-key "$PK"
else
  echo "b417-sepolia-treasury-spend-propose-vote-succeeded: [0] skip delegate — GovernanceVotesToken uses checkpoints unless B417_DELEGATE_CAST=1" >&2
fi

if [[ "${TREASURY_SPEND_SKIP_PREFUND:-0}" != "1" && "${TREASURY_SPEND_MODE}" == "ERC20" ]]; then
  echo "b417-sepolia-treasury-spend-propose-vote-succeeded: [prefund] transfer token → Treasury (amount=${SPEND_AMT}) so execute spend succeeds …" >&2
  cast send "$TOK" "transfer(address,uint256)" "$TREASURY" "$SPEND_AMT" --rpc-url "$RPC" --private-key "$PK" || {
    echo "b417-sepolia-treasury-spend-propose-vote-succeeded: WARN prefund transfer failed (insufficient balance or already funded?). Fix wallet balance or set TREASURY_SPEND_SKIP_PREFUND=1" >&2
  }
elif [[ "${TREASURY_SPEND_MODE}" == "ETH" ]]; then
  TBAL="$(cast balance "$TREASURY" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n' || echo "0")"
  echo "b417-sepolia-treasury-spend-propose-vote-succeeded: [prefund] Treasury ETH balance (wei): ${TBAL} (need >= spend amount)" >&2
fi

cd "${ROOT}/contracts"

echo "b417-sepolia-treasury-spend-propose-vote-succeeded: [1/4] propose (SepoliaProposeTreasurySpend) …" >&2
forge script script/SepoliaProposeTreasurySpend.s.sol:SepoliaProposeTreasurySpend --rpc-url "$RPC" --broadcast -vvv

PID_RAW="$(cast call "$GOV" "proposalCount()(uint256)" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n' || true)"
PID="$(cast to-dec "$PID_RAW" 2>/dev/null || echo "")"
if [[ -z "$PID" || "$PID" == "0" ]]; then
  echo "b417-sepolia-treasury-spend-propose-vote-succeeded: ERROR could not read proposalCount" >&2
  exit 1
fi
export PROPOSAL_ID="$PID"
echo "b417-sepolia-treasury-spend-propose-vote-succeeded: new PROPOSAL_ID=${PROPOSAL_ID}" >&2

echo "b417-sepolia-treasury-spend-propose-vote-succeeded: sleep ${VOTE_SLEEP}s (wait voteStart) …" >&2
sleep "$VOTE_SLEEP"

echo "b417-sepolia-treasury-spend-propose-vote-succeeded: [2/4] castVote proposalId=${PROPOSAL_ID} …" >&2
forge script script/SepoliaCastVote.s.sol:SepoliaCastVote --rpc-url "$RPC" --broadcast -vvv

echo "b417-sepolia-treasury-spend-propose-vote-succeeded: sleep ${STATE_SLEEP}s (wait voteEnd / Succeeded) …" >&2
sleep "$STATE_SLEEP"

echo "b417-sepolia-treasury-spend-propose-vote-succeeded: [3/4] state(${PROPOSAL_ID}):" >&2
cast call "$GOV" "state(uint256)(uint8)" "$PROPOSAL_ID" --rpc-url "$RPC"

ST="$(cast call "$GOV" "state(uint256)(uint8)" "$PROPOSAL_ID" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ' || true)"
if [[ "$ST" == "4" ]]; then
  echo "b417-sepolia-treasury-spend-propose-vote-succeeded: OK state=4 (Succeeded). Export for B-417: B417_PROPOSAL_ID=${PROPOSAL_ID}" >&2
else
  echo "b417-sepolia-treasury-spend-propose-vote-succeeded: WARN state=${ST} (want 4). Increase B417_STATE_SLEEP_SEC or wait and re-check." >&2
fi
