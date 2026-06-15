#!/usr/bin/env bash
# ① 本地 · 将 guide@test.com 后台 stake_amount 对齐为链上 stakeOf（链为准）
#
# 用法：bash scripts/dev/align-guide-stake-db-to-chain-local.sh
# 前置：Docker Postgres · Anvil FundStack 已部署 · guides.wallet_address 已填则按钱包读链
# 无 wallet 时：将陈旧 chain-off mock 质押清零（常见于 Anvil 重部署后）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/fundstack-anvil-common.sh
source "$ROOT/scripts/dev/lib/fundstack-anvil-common.sh"

fail() { echo "align-guide-stake-db: FAIL $*" >&2; exit 1; }
ok() { echo "align-guide-stake-db: OK $*"; }
warn() { echo "align-guide-stake-db: WARN $*" >&2; }

GUIDE_EMAIL="${GUIDE_STAKE_ALIGN_EMAIL:-guide@test.com}"
RPC="$FUNDSTACK_ANVIL_RPC"

if ! command -v docker >/dev/null 2>&1; then
  warn "docker missing — skip"
  exit 0
fi
if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'traveltrust-postgres'; then
  warn "traveltrust-postgres not running — skip"
  exit 0
fi

fundstack_anvil_load_dotenv GUIDE_STAKING_ADDRESS
POOL="${GUIDE_STAKING_ADDRESS:-}"
[[ -n "$POOL" && "$POOL" == 0x* ]] || warn "GUIDE_STAKING_ADDRESS missing — will zero stale DB stake only"

read_db_row() {
  docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -t -A -F $'\t' -c \
    "SELECT COALESCE(g.wallet_address,''), COALESCE(g.stake_amount,'0')
     FROM guides g JOIN users u ON g.user_id = u.id
     WHERE u.email = '${GUIDE_EMAIL}' LIMIT 1;" 2>/dev/null || true
}

ROW="$(read_db_row)"
[[ -n "$ROW" ]] || { warn "no guide row for $GUIDE_EMAIL — skip"; exit 0; }
WALLET="$(echo "$ROW" | cut -f1)"
DB_STAKE="$(echo "$ROW" | cut -f2)"

CHAIN_STAKE="0"
if [[ -n "$POOL" && -n "$WALLET" && "$WALLET" == 0x* ]]; then
  if cast chain-id --rpc-url "$RPC" >/dev/null 2>&1; then
    RAW="$(cast call "$POOL" "stakeOf(address)(uint256)" "$WALLET" --rpc-url "$RPC" 2>/dev/null | awk '{print $1}' || echo 0)"
    if [[ -n "$RAW" && "$RAW" =~ ^[0-9]+$ && "$RAW" != "0" ]]; then
      CHAIN_STAKE="$(python -c "print(int('$RAW')/10**6)" 2>/dev/null || echo 0)"
      # trim trailing .0
      CHAIN_STAKE="${CHAIN_STAKE%%.0}"
    fi
  fi
elif [[ -n "$DB_STAKE" && "$DB_STAKE" != "0" ]]; then
  warn "guide has DB stake=$DB_STAKE but no wallet_address — zeroing stale chain-off mock"
  CHAIN_STAKE="0"
fi

if [[ "$DB_STAKE" == "$CHAIN_STAKE" ]]; then
  ok "already aligned stake_amount=$DB_STAKE ($GUIDE_EMAIL)"
  exit 0
fi

docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -c \
  "UPDATE guides g SET stake_amount = '${CHAIN_STAKE}', updated_at = NOW()
   FROM users u WHERE g.user_id = u.id AND u.email = '${GUIDE_EMAIL}';" \
  >/dev/null || fail "psql update failed"

ok "aligned $GUIDE_EMAIL stake_amount: $DB_STAKE -> $CHAIN_STAKE (chain wins; restart API to reload memory)"
echo "TT_GUIDE_STAKE_DB_CHAIN_ALIGN: OK"
