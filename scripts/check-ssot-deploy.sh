#!/usr/bin/env bash
# 部署前 SSOT 校验（08-5 §4、Runbook §10）
# 用法：部署/升级前在仓库根或 CI 中执行 scripts/check-ssot-deploy.sh
# 若环境变量 STRICT_SSOT=1 或 CHECK_SSOT=1，则要求 SSOT_VERSION 已设置且非空；可选与 08-4 文末版本行一致。
# 与 Backend 启动时校验（crates/api 读 SSOT_VERSION）配套；部署脚本中调用本脚本可阻断「文档与运行不一致」的部署。

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STRICT="${STRICT_SSOT:-${CHECK_SSOT:-0}}"
SSOT_VERSION="${SSOT_VERSION:-}"
SSOT_SHA256="${SSOT_SHA256:-}"

ssot_file_sha256() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
    return 0
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file" | awk '{print $1}'
    return 0
  fi
  echo ""
  return 1
}

if [ "$STRICT" = "1" ]; then
  if [ -z "$SSOT_VERSION" ] || [ "$SSOT_VERSION" = "unset" ]; then
    echo "FAIL: STRICT_SSOT=1 或 CHECK_SSOT=1 时，SSOT_VERSION 必须已设置且非 unset。部署前请设置 SSOT_VERSION（如与 08-4 文档版本一致）。"
    exit 1
  fi
  echo "OK: SSOT_VERSION=${SSOT_VERSION}（部署前校验通过）"

  # 强制：校验 08-3 文件 hash（enforce SSOT hash at deploy time）
  SSOT_FILE="docs/spec/08-3-参数与门禁表.md"
  if [ -f "$SSOT_FILE" ]; then
    SSOT_FILE_HASH="$(ssot_file_sha256 "$SSOT_FILE" || true)"
    if [ -z "$SSOT_FILE_HASH" ]; then
      echo "FAIL: 无法计算 ${SSOT_FILE} 的 sha256（缺少 sha256sum 或 shasum）。"
      exit 1
    fi
    if [ -z "$SSOT_SHA256" ]; then
      echo "FAIL: STRICT_SSOT=1 或 CHECK_SSOT=1 时，必须设置 SSOT_SHA256，并与 ${SSOT_FILE} 的 sha256 一致。"
      echo "      computed_SSOT_SHA256=${SSOT_FILE_HASH}"
      exit 1
    fi
    if [ "$SSOT_SHA256" != "$SSOT_FILE_HASH" ]; then
      echo "FAIL: SSOT_SHA256 与 ${SSOT_FILE} sha256 不一致。"
      echo "      env_SSOT_SHA256=${SSOT_SHA256}"
      echo "      computed_SSOT_SHA256=${SSOT_FILE_HASH}"
      exit 1
    fi
    echo "OK: SSOT_SHA256=${SSOT_SHA256}（匹配 ${SSOT_FILE}）"
  else
    echo "FAIL: 缺少 ${SSOT_FILE}，无法做部署前 SSOT hash 校验。"
    exit 1
  fi

  # 可选：与 08-4 中的「文档版本（CI 校验用）」行比对，不一致时告警（不阻断）
  # 注意：08-4 内可能包含其他 v* 字样（如示例/历史版本），因此这里只从该“CI 校验用”行提取。
  if [ -f "docs/spec/08-4-对外口径包.md" ]; then
    DOC_VER="$(grep -E "文档版本（CI 校验用）" "docs/spec/08-4-对外口径包.md" 2>/dev/null | head -1 | sed -n 's/.*\(v[0-9][0-9a-z.]*\).*/\1/p')"
    if [ -n "$DOC_VER" ] && [ "$SSOT_VERSION" != "$DOC_VER" ]; then
      echo "WARN: SSOT_VERSION 与 08-4 的 CI 校验版本（${DOC_VER}）不一致，请确认是否故意；一致时建议设为相同值。"
    fi
  fi
else
  if [ -n "$SSOT_VERSION" ] && [ "$SSOT_VERSION" != "unset" ]; then
    echo "OK: SSOT_VERSION=${SSOT_VERSION}"
  else
    echo "SKIP: 未设置 STRICT_SSOT/CHECK_SSOT，SSOT_VERSION 未设置，跳过部署前 SSOT 校验。建议生产部署时设置 STRICT_SSOT=1 与 SSOT_VERSION。"
  fi
fi
exit 0
