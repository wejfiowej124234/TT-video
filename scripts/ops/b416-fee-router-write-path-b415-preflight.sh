#!/usr/bin/env bash
# B-416 · **L0** **预检** **：** **合约** **/** **B-415** **代码** **锚** **存在** **（** **不** **广播** **tx** **、** **不** **读** **私钥** **）** **。**
#
# 用法（仓库根）：**`bash scripts/ops/b416-fee-router-write-path-b415-preflight.sh`**
#
# 互证：**[`docs/runbook/TT-B416-FEE-ROUTER-WRITE-PATH-TESTNET-ADMIN-001.md`](../../docs/runbook/TT-B416-FEE-ROUTER-WRITE-PATH-TESTNET-ADMIN-001.md)**。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

need() { [[ -f "$1" ]] || { echo "b416-fee-router-write-path-b415-preflight: missing $1" >&2; exit 1; }; }

need "${ROOT}/contracts/src/FeeRouter.sol"
need "${ROOT}/crates/api/src/routes/governance/mod.rs"

echo "b416-fee-router-write-path-b415-preflight: ok" >&2
