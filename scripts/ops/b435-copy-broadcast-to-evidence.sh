#!/usr/bin/env bash
# 将 contracts/broadcast 下 Sepolia 部署产物拷入 evidence/run（TT-B435 §3.5）。
# 用法（仓库根）：B435_EVIDENCE_RUN=run_20260416T122500Z bash scripts/ops/b435-copy-broadcast-to-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RUN="${B435_EVIDENCE_RUN:-run_20260416T122500Z}"
DST="$ROOT/evidence/b435_fullstack_fund_testnet_closeout/${RUN}/broadcast"
CHAIN_DIR=11155111

mkdir -p "$DST"
copied=0
for name in DeployFundStackUnderTimelock.s.sol DeployGovernanceStack.s.sol; do
  SRC="$ROOT/contracts/broadcast/${name}/${CHAIN_DIR}"
  if [[ -d "$SRC" ]]; then
    mkdir -p "$DST/${name}"
    # SRC 为 .../<Script>/<chainId>/，得到 evidence/.../broadcast/<Script>/<chainId>/
    cp -a "$SRC" "$DST/${name}/"
    echo "OK: copied $SRC -> $DST/${name}/${CHAIN_DIR}/"
    copied=1
  else
    echo "SKIP: not found $SRC"
  fi
done

if [[ "$copied" -eq 0 ]]; then
  echo "b435-copy-broadcast-to-evidence: nothing copied; deploy first or sync contracts/broadcast from machine that ran forge"
  exit 1
fi
echo "Done: $DST"
