#!/usr/bin/env bash
# 50-O-B2: 核验 crates/api 单文件行数符合 48 约定（≤500，可选严格 ≤400）
# 用法：从仓库根目录执行 scripts/check-48-line-count.sh
# 环境变量：STRICT=1 时采用严格上限 400 行（与 43 前端对标）
# Windows：.\scripts\check-48-line-count.ps1（委托本脚本）
set -euo pipefail

max=500
[[ "${STRICT:-0}" == "1" ]] && max=400

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

[[ -d crates/api/src ]] || { echo "missing crates/api/src" >&2; exit 1; }

violations=0
while read -r f; do
  [[ -f "$f" ]] || continue
  n=$(wc -l < "$f" 2>/dev/null || echo 0)
  if [[ -n "${n// /}" ]] && [[ "$n" -gt "$max" ]]; then
    echo "OVER ${max}: $f ($n lines)" >&2
    violations=$((violations+1))
  fi
done < <(find crates/api/src -name "*.rs")

if [[ "$violations" -gt 0 ]]; then
  echo "48 约定：单文件 ≤500 行（推荐 ≤400）；超标文件见上。见 docs/spec/48-后端模块化拆分与落地清单.md §1.1、§十四。" >&2
  exit 1
fi
echo "OK: all crates/api/src *.rs files <= ${max} lines (48 §1.1)"
