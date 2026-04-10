#!/usr/bin/env bash
# Epic F-06：E2E 三项包 **结构** 校验（**bash**；**`jq`** 仅在 **`E2E_THREE_PACK_CHECK_MANIFEST=1`** 时必需）。
#
# 检查 **`evidence/GO_YYYYMMDD/`**（或等价目录）下 F-02 钉死的三份 **`artifacts/e2e-*.md`** 是否存在；**可选**检查 **`manifest.json`** 的 **`artifacts[]`** 是否**登记**三条 **`path`**（**仅键存在性**，**不**校验 **`sha256`** 真值、**不**读 **`.md`** 正文、**不**做对账或通过判断）。
#
# 环境变量：
#   EVIDENCE_GO_DIR              — GO 根目录（与 **`$1`** 二选一；**`$1`** 优先）
#   E2E_THREE_PACK_CHECK_SKIP=1  — 跳过全部检查，**exit 0**
#   E2E_THREE_PACK_CHECK_MANIFEST=1 — 额外要求 **`manifest.json`** 中 **`artifacts[]`** 含三条 **`path`**（文件仍须存在）
#
# 退出码：
#   0 — SKIP；或三 **`.md`** 存在且（若启用）**`manifest`** 登记检查通过
#   1 — 结构不满足（缺文件或 **`manifest`** 未登记某 **`path`**）
#   2 — 用法错误、未提供目录；或启用了 **`MANIFEST`** 检查但缺 **`jq`**
#
# 用法：
#   E2E_THREE_PACK_CHECK_SKIP=1 bash scripts/check-e2e-three-pack-evidence.sh
#   bash scripts/check-e2e-three-pack-evidence.sh evidence/GO_20260407
#   EVIDENCE_GO_DIR=evidence/GO_20260407 bash scripts/check-e2e-three-pack-evidence.sh
#   E2E_THREE_PACK_CHECK_MANIFEST=1 bash scripts/check-e2e-three-pack-evidence.sh evidence/GO_20260407
set -euo pipefail

if [[ "${E2E_THREE_PACK_CHECK_SKIP:-}" == "1" ]]; then
  echo "check-e2e-three-pack-evidence: E2E_THREE_PACK_CHECK_SKIP=1 — skipping." >&2
  exit 0
fi

GO_DIR="${1:-${EVIDENCE_GO_DIR:-}}"
if [[ -z "$GO_DIR" ]]; then
  echo "usage: EVIDENCE_GO_DIR=<dir> bash scripts/check-e2e-three-pack-evidence.sh" >&2
  echo "   or: bash scripts/check-e2e-three-pack-evidence.sh <evidence/GO_YYYYMMDD>" >&2
  exit 2
fi

if [[ ! -d "$GO_DIR" ]]; then
  echo "check-e2e-three-pack-evidence: not a directory: ${GO_DIR}" >&2
  exit 2
fi

# 解析为绝对路径，避免 cd 后相对路径错乱
GO_DIR="$(cd "$GO_DIR" && pwd)"

REQUIRED=(
  "artifacts/e2e-normal-release.md"
  "artifacts/e2e-dispute-three-terminals.md"
  "artifacts/e2e-three-timeouts.md"
)

for rel in "${REQUIRED[@]}"; do
  f="${GO_DIR}/${rel}"
  if [[ ! -f "$f" ]]; then
    echo "check-e2e-three-pack-evidence: missing file: ${rel} (under ${GO_DIR})" >&2
    exit 1
  fi
done

echo "check-e2e-three-pack-evidence: ok three e2e artifact files exist"

if [[ "${E2E_THREE_PACK_CHECK_MANIFEST:-}" == "1" ]]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "check-e2e-three-pack-evidence: jq is required when E2E_THREE_PACK_CHECK_MANIFEST=1" >&2
    exit 2
  fi
  mf="${GO_DIR}/manifest.json"
  if [[ ! -f "$mf" ]]; then
    echo "check-e2e-three-pack-evidence: E2E_THREE_PACK_CHECK_MANIFEST=1 but manifest.json missing: ${mf}" >&2
    exit 1
  fi
  for rel in "${REQUIRED[@]}"; do
    if ! jq -e --arg p "$rel" 'any((.artifacts // [])[]; .path == $p)' "$mf" >/dev/null 2>&1; then
      echo "check-e2e-three-pack-evidence: manifest.json artifacts[] missing path: ${rel}" >&2
      exit 1
    fi
  done
  echo "check-e2e-three-pack-evidence: ok manifest.json registers three e2e paths"
fi

exit 0
