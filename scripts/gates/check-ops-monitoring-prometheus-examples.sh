#!/usr/bin/env bash
# 校验 **ops/monitoring** 下 Prometheus **`rule_files`** 示例 YAML（**PromQL + 规则结构**）。
# 依赖：**`promtool`**（Prometheus 发行版自带；须已在 **PATH**）。
#
# 用法（仓库根）：
#   bash scripts/gates/check-ops-monitoring-prometheus-examples.sh
#
# 未安装 **promtool** 时：默认 **exit 0** 并 **stderr** 提示（本地/CI 未装 Prometheus 工具链时不挡提交）。
# 强制要求：**`PROMTOOL_REQUIRED=1`** — 无 **promtool** 时 **exit 2**。
#
# 互链：**[TT-9618 §3.6.1](../../docs/runbook/TT-9618-onboarding-local-testnet.md)**、**`ops/monitoring/README.md`**；**`#9618-*`** 入口：**[docs 总索引](../../docs/00-文档索引.md)**、**[手册入口](../../docs/handbook/README.md)**（**96-18** 法定壳从 **00 文档索引** 再入 spec；本头注释不重复 **96-18** 文件路径字面）。
#
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

RULE_FILES=(
  "ops/monitoring/prometheus-alerts-indexer.example.yml"
  "ops/monitoring/prometheus-alerts-onboarding-webhook-queue.example.yml"
)

if ! command -v promtool >/dev/null 2>&1; then
  echo "check-ops-monitoring-prometheus-examples: promtool not found in PATH; skipping rule syntax check." >&2
  echo "  Install Prometheus toolkit (promtool) or set PROMTOOL_REQUIRED=1 to fail closed in CI." >&2
  if [[ "${PROMTOOL_REQUIRED:-}" == "1" ]]; then
    exit 2
  fi
  exit 0
fi

for f in "${RULE_FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "check-ops-monitoring-prometheus-examples: missing file: $f" >&2
    exit 1
  fi
  echo "==> promtool check rules $f"
  promtool check rules "$f"
done

echo "check-ops-monitoring-prometheus-examples: OK"
