#!/usr/bin/env bash
# 预检：STRICT_SSOT=1 或 CHECK_SSOT=1 时，根 .env 是否满足 API 启动硬条件（与 crates/api/src/startup/mod.rs 同源）。
# 用法：仓库根  bash scripts/dev/check-strict-ssot-local-prereqs.sh
# 未启用 strict / 无 .env → exit 0。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/.env"
cd "$ROOT"

get_val() {
  local k="$1"
  local line
  line=$(grep -E "^[[:space:]]*${k}=" "$ENV_FILE" 2>/dev/null | head -1) || true
  [[ -z "$line" ]] && echo -n "" && return 0
  echo "$line" | sed "s/^[[:space:]]*${k}=//" | sed 's/\r$//' | sed 's/^"\(.*\)"$/\1/'
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "check-strict-ssot: skip (no root .env)"
  exit 0
fi

strict="$(get_val STRICT_SSOT)"
check="$(get_val CHECK_SSOT)"
if [[ "$strict" != "1" && "$check" != "1" ]]; then
  echo "check-strict-ssot: STRICT_SSOT/CHECK_SSOT not 1, skip"
  exit 0
fi

fail=0
ssot_ver="$(get_val SSOT_VERSION)"
if [[ -z "${ssot_ver// }" || "$ssot_ver" == "unset" ]]; then
  echo "check-strict-ssot: FAIL — SSOT_VERSION 须非空且不得为字面 unset（与 startup 一致）" >&2
  fail=1
fi

cors="$(get_val CORS_ORIGINS)"
if [[ -z "${cors// }" ]]; then
  echo "check-strict-ssot: FAIL — CORS_ORIGINS 必填（strict 下禁止空）" >&2
  fail=1
else
  lc="${cors,,}"
  if [[ "$lc" != *"localhost:3012"* && "$lc" != *"127.0.0.1:3012"* ]]; then
    echo "check-strict-ssot: WARN — 本地全栈 Next 默认 3012；CORS_ORIGINS 未含 localhost:3012 或 127.0.0.1:3012，浏览器可能跨域失败" >&2
  fi
fi

sha="$(get_val SSOT_SHA256)"
if [[ -z "${sha// }" ]]; then
  echo "check-strict-ssot: FAIL — SSOT_SHA256 必填（与 docs/spec/08-3-参数与门禁表.md 一致）" >&2
  fail=1
elif [[ -f "docs/spec/08-3-参数与门禁表.md" ]]; then
  if command -v sha256sum >/dev/null 2>&1; then
    computed="$(sha256sum "docs/spec/08-3-参数与门禁表.md" | awk '{print $1}')"
    if [[ "${sha,,}" != "${computed,,}" ]]; then
      echo "check-strict-ssot: FAIL — SSOT_SHA256 与当前 08-3 文件不一致 expected_in_env=${sha} computed=${computed}" >&2
      fail=1
    fi
  else
    echo "check-strict-ssot: WARN — 未找到 sha256sum，跳过 SSOT_SHA256 与文件逐字比对" >&2
  fi
else
  echo "check-strict-ssot: WARN — 缺少 docs/spec/08-3-参数与门禁表.md，无法校验 sha" >&2
fi

cb="$(get_val CHARGEBACK_POLICY)"
if [[ -z "${cb// }" || "$cb" == "unset" ]]; then
  echo "check-strict-ssot: FAIL — CHARGEBACK_POLICY 须显式设置（strict 下不可等价 unset）" >&2
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "check-strict-ssot: 见 .env.example「STRICT_SSOT 本地最小清单」与 docs/dev-local-smoke-baseline.md" >&2
  exit 1
fi

echo "check-strict-ssot: OK (STRICT_SSOT/CHECK_SSOT 预检通过)"
exit 0
