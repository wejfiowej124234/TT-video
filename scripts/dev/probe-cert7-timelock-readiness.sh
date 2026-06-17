#!/usr/bin/env bash
# Cert #7 · Timelock readiness probe（② · 只读 · 兼容入口 → 双 Timelock 探测）
#
#   bash scripts/dev/probe-cert7-timelock-readiness.sh
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/probe-phase-b-timelock-countdown.sh" "$@"
