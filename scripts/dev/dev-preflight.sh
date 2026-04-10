#!/usr/bin/env bash
# 可选：单人提交 / push 前「三连」聚合（见 docs/spec/04-后端与API.md 零、 · 单人开发默认流程）
# 1) cargo test   2) run-check-04-routes   3) 单人开发元数据门禁（B-145，默认 stderr 提醒、exit 0；BASE/HEAD 解析见 B-146）
#    可选：CRATES_METADATA_GATE_REQUIRE_REFS=1 → main/HEAD 不可解析时 exit 2（不默认）
# 日后若有第四条（如 contracts/**，规划 B-147）可收进本脚本。
# 用法：仓库根执行 bash scripts/dev-preflight.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
cargo test -p traveltrust-api
bash scripts/run-check-04-routes.sh
bash scripts/check-pr-crates-needs-metadata.sh main HEAD
