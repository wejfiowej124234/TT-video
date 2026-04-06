#!/usr/bin/env bash
# 核对「00 索引主表登记的 90～550 阶段文」在 docs/spec 下是否均有对应 Markdown（防误删、防漏检）。
# 规划空号 280/290/300/310 允许无文件。其余缺失则 exit 1。
# 用法：项目根 bash scripts/check-wave-phase-files.sh
# Windows：.\scripts\check-wave-phase-files.ps1（委托本脚本）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

shopt -s nullglob

ALLOW_EMPTY="280 290 300 310"
REQUIRED=(
  90 100 110 120 130 140 150 160 170
  200 220 230 240 250 260 270
  280 290 300 310
  320 330 340 350 360 370 380 390 400
  410 420 421 430 440 450 460 470 480 490 500 510 520 530
  540 550
)

missing=()
for n in "${REQUIRED[@]}"; do
  files=(docs/spec/${n}-*.md)
  if ((${#files[@]} > 0)); then
    continue
  fi
  if echo " $ALLOW_EMPTY " | grep -q " $n "; then
    continue
  fi
  missing+=("$n")
done

if ((${#missing[@]} > 0)); then
  echo "ERROR: expected phase spec missing for: ${missing[*]}" >&2
  echo "       (pattern docs/spec/NNN-*.md ; empty slots allowed: $ALLOW_EMPTY)" >&2
  exit 1
fi

echo "OK: wave phase spec files present (empty slots skipped: $ALLOW_EMPTY)."
