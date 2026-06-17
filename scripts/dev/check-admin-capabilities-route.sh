#!/usr/bin/env bash
# ① 本地：探测 GET /api/v1/admin/capabilities 是否由 traveltrust-api 暴露（非 404）。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE="${TRAVELTRUST_API_BASE:-${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8080}}"
BASE="${BASE%/}"
CODE="$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/api/v1/admin/capabilities" || true)"
echo "GET ${BASE}/api/v1/admin/capabilities -> HTTP ${CODE}"
if [[ "$CODE" == "404" ]]; then
  echo "FAIL: 路由未注册。请在仓库根目录执行: cargo run -p traveltrust-api" >&2
  exit 1
fi
if [[ "$CODE" == "401" || "$CODE" == "403" ]]; then
  echo "OK: 路由存在（未带 Bearer 时为 ${CODE}，属预期）"
  exit 0
fi
if [[ "$CODE" == "200" ]]; then
  echo "OK: 路由存在且已鉴权通过"
  exit 0
fi
echo "WARN: 非预期状态 ${CODE}（若 API 未起请先启动）" >&2
exit 0
