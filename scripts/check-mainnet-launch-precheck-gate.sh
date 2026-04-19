#!/usr/bin/env bash
# 薄转发（B-184）：[`scripts/gates/check-mainnet-launch-precheck-gate.sh`](gates/check-mainnet-launch-precheck-gate.sh)
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/gates/check-mainnet-launch-precheck-gate.sh" "$@"
