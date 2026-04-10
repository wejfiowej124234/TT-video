#!/usr/bin/env bash
# 08-3 的 26 key 每行 evidence_pointer 列须有有效引用（非空、指向文档或路径）。
# 当前为最小实现：检查 08-3 存在且含 evidence_pointer 列；完整 26 key 逐项校验可后续补充。
# Windows：.\scripts\check-08-evidence-pointer.ps1（委托本脚本）
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
F="docs/spec/08-3-参数与门禁表.md"
if [ ! -f "$F" ]; then
  echo "ERROR: $F not found"
  exit 1
fi
# 要求存在 evidence_pointer 列描述或表头
if ! grep -q 'evidence_pointer\|evidence pointer' "$F" 2>/dev/null; then
  echo "ERROR: 08-3 must have evidence_pointer column or reference"
  exit 1
fi
exit 0
