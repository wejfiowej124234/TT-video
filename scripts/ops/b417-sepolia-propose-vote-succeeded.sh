#!/usr/bin/env bash
# Sepolia 首个提案闭环（与 B-417 衔接）：
#
# 1) **自委托**：**`DeployGovernanceStack` 部署的 `GovernanceVotesToken`（链上符号 TTG）无 `delegate()`**，投票权来自余额 **checkpoint**（持币即有 **`getPastVotes`**），**无需** 自委托。
#    若你改用标准 **ERC20Votes**（外链），须先 **`delegate(自己)`**：
#      **`B417_DELEGATE_CAST=1`** **`bash scripts/ops/b417-sepolia-propose-vote-succeeded.sh`**
#    或单独：`forge script script/SepoliaDelegateSelf.s.sol:SepoliaDelegateSelf --rpc-url … --broadcast`（**勿**对无 `delegate` 的本仓库代币调用）。
# 2) **propose** → 3) **castVote(For)** → 4) 等待投票期结束 → 5) **`state==4`**。
#
# 须 **`.env`**：**CHAIN_RPC_URL**、**GOVERNOR_ADDRESS**、**GOVERNANCE_TOKEN_ADDRESS**、**B417_PRIVATE_KEY**（或 **PRIVATE_KEY**）。
# 可选：**PROPOSAL_ID** — 投票脚本用，默认 **1**（首个提案）。
# 可选：**B417_VOTE_SLEEP_SEC**（默认 25）、**B417_STATE_SLEEP_SEC**（默认 120）— Sepolia 出块约 12s，若 **state** 仍非 4 可加大再查。
#
# 提案落地后：从 **`bash scripts/ops/b417-list-proposal-states.sh`** 选 **state=4** 一行填 **`B417_PROPOSAL_ID`**，再跑 gap-check → preflight → onchain-evidence → evidence-pack-verify。
#
# 用法：仓库根 **`bash scripts/ops/b417-sepolia-propose-vote-succeeded.sh`**
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
  "") echo "b417-sepolia-propose-vote-succeeded: need PRIVATE_KEY or B417_PRIVATE_KEY" >&2; exit 1 ;;
  *) PK="0x${PK}" ;;
esac
export PRIVATE_KEY="$PK"

GOV="${GOVERNOR_ADDRESS:-}"
TOK="${GOVERNANCE_TOKEN_ADDRESS:-${GOVERNANCE_VOTES_TOKEN_ADDRESS:-}}"
RPC="${B417_RPC_URL:-${CHAIN_RPC_URL:-${RPC_URL:-}}}"
if [[ -z "$GOV" || -z "$TOK" || -z "$RPC" ]]; then
  echo "b417-sepolia-propose-vote-succeeded: need GOVERNOR_ADDRESS, GOVERNANCE_TOKEN_ADDRESS (or legacy GOVERNANCE_VOTES_TOKEN_ADDRESS), CHAIN_RPC_URL" >&2
  exit 1
fi

# Forge 子脚本：`SepoliaProposeMinimal` / `SepoliaDelegateSelf` 已支持 **`GOVERNANCE_TOKEN_ADDRESS`** **优先**；以下为旧文档 **`GOVERNANCE_VOTES_TOKEN_ADDRESS`** **别名** **（** **与** **API** **`.env.example`** **七键** **一致** **时** **可** **只设** **前者** **）** **。
export GOVERNANCE_VOTES_TOKEN_ADDRESS="${GOVERNANCE_VOTES_TOKEN_ADDRESS:-$TOK}"

VOTE_SLEEP="${B417_VOTE_SLEEP_SEC:-25}"
STATE_SLEEP="${B417_STATE_SLEEP_SEC:-120}"
PID="${PROPOSAL_ID:-1}"

SELF_ADDR="$(cast wallet address --private-key "$PK")"

if [[ "${B417_DELEGATE_CAST:-0}" == "1" ]]; then
  echo "b417-sepolia-propose-vote-succeeded: [1/4] delegate(self) via cast send (ERC20Votes-style token) …" >&2
  cast send "$TOK" "delegate(address)" "$SELF_ADDR" --rpc-url "$RPC" --private-key "$PK"
else
  echo "b417-sepolia-propose-vote-succeeded: [1/4] skip delegate — GovernanceVotesToken uses balance checkpoints, no delegate(); B417_DELEGATE_CAST=1 for OZ ERC20Votes" >&2
fi

# 最小提案 calldata 为 **token.transfer(deployer,1)**；**queue→execute** 时 **`msg.sender`=Timelock**，须 Timelock 持有 ≥1 wei 代币，否则 Timelock **`CallFailed`**。
TL_RAW="$(cast call "$GOV" "timelock()(address)" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n' || true)"
TL="$(printf '%s' "$TL_RAW" | awk '{print $NF}')"
if [[ -n "$TL" && "$TL" != "0x0000000000000000000000000000000000000000" ]]; then
  echo "b417-sepolia-propose-vote-succeeded: fund timelock ${TL} with 1e16 wei gov token (for execute path) …" >&2
  cast send "$TOK" "transfer(address,uint256)" "$TL" 10000000000000000 --rpc-url "$RPC" --private-key "$PK" || {
    echo "b417-sepolia-propose-vote-succeeded: WARN timelock fund tx failed (already funded?)" >&2
  }
else
  echo "b417-sepolia-propose-vote-succeeded: WARN could not read timelock(); propose may execute-revert later" >&2
fi

cd "${ROOT}/contracts"

echo "b417-sepolia-propose-vote-succeeded: [2/4] propose …" >&2
forge script script/SepoliaProposeMinimal.s.sol:SepoliaProposeMinimal --rpc-url "$RPC" --broadcast -vvv

echo "b417-sepolia-propose-vote-succeeded: sleep ${VOTE_SLEEP}s (wait voteStart) …" >&2
sleep "$VOTE_SLEEP"

export PROPOSAL_ID="$PID"
echo "b417-sepolia-propose-vote-succeeded: [3/4] castVote proposalId=${PROPOSAL_ID} …" >&2
forge script script/SepoliaCastVote.s.sol:SepoliaCastVote --rpc-url "$RPC" --broadcast -vvv

echo "b417-sepolia-propose-vote-succeeded: sleep ${STATE_SLEEP}s (wait voteEnd / Succeeded) …" >&2
sleep "$STATE_SLEEP"

echo "b417-sepolia-propose-vote-succeeded: [4/4] state(${PROPOSAL_ID}):" >&2
cast call "$GOV" "state(uint256)(uint8)" "$PROPOSAL_ID" --rpc-url "$RPC"

ST="$(cast call "$GOV" "state(uint256)(uint8)" "$PROPOSAL_ID" --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ' || true)"
if [[ "$ST" == "4" ]]; then
  echo "b417-sepolia-propose-vote-succeeded: OK state=4 (Succeeded). Set B417_PROPOSAL_ID=${PROPOSAL_ID} in .env" >&2
else
  echo "b417-sepolia-propose-vote-succeeded: WARN state=${ST} (want 4). Increase B417_STATE_SLEEP_SEC or wait and re-check cast call." >&2
fi
