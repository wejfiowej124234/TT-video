#!/usr/bin/env bash
# Phase B · 维护窗每日唯一入口（② · TL#1 前 / Wave 1 后 / TL#2 倒计时 · 不触链）
#
#   bash scripts/dev/run-phase-b-daily-maintenance.sh
#
# TL#1 到期后：另开一次性 Wave 1（run-phase-b-post-timelock-wave1.sh），完成后回到本脚本。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "== Phase B daily · countdown probe =="
bash "$ROOT/scripts/dev/probe-phase-b-timelock-countdown.sh"

echo "== Phase B daily · post-change gate =="
bash "$ROOT/scripts/dev/run-ttg-governance-cert-post-change-gate.sh"

echo "TT_PHASE_B_DAILY: OK probe+post-change phase=② no_chain"
