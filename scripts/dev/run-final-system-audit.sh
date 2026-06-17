#!/usr/bin/env bash
# Final System Audit · TGCA + CDIA 复验 + 汇总报告
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export P3_CHAIN_OFF=1
export SEED_TEST_ACCOUNTS=1

echo "== Final System Audit · Trust Gate + CDIA =="
# TGCA 已拉起 cargo API；CDIA 复用同一进程，避免 release 二进制缺 seed-trust-gate 路由
export CDIA_SKIP_API_RESTART=1
bash scripts/dev/run-trust-gate-chain-audit.sh
bash scripts/dev/run-cross-domain-integration-audit.sh
python scripts/dev/generate-final-system-audit-report.py
