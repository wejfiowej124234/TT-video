#!/usr/bin/env bash
# 供 start_dev.sh / stop_dev.sh source：解析与本仓库「API + Next」本地组合一致的监听端口。
# - 后端：优先环境变量 API_PORT；否则读仓库根 .env 的 PORT；再否则 8080。
# - 前端：FRONTEND_PORT，默认 3012（与 frontend/package.json dev 端口一致）。
# 须先设置 REPO_ROOT 为仓库根绝对路径。
: "${REPO_ROOT:?REPO_ROOT must be set before sourcing _dev_stack_ports.sh}"

_env_api_port=""
if [[ -f "$REPO_ROOT/.env" ]]; then
  _line=$(grep -E '^[[:space:]]*PORT=' "$REPO_ROOT/.env" | head -1 || true)
  if [[ -n "${_line}" ]]; then
    _env_api_port="${_line#*=}"
    _env_api_port="${_env_api_port%%$'\r'}"
    _env_api_port="${_env_api_port#\"}"
    _env_api_port="${_env_api_port%\"}"
    _env_api_port="${_env_api_port// /}"
  fi
fi

# 全栈：API 须与 Next（默认 3012）不同口。若根 .env 误把 PORT 写成 3012/3000（常见与 Next 混淆），未显式设 API_PORT 时强制 API 用 8080。
if [[ -z "${API_PORT:-}" ]] && { [[ "${_env_api_port}" == "3012" ]] || [[ "${_env_api_port}" == "3000" ]]; }; then
  echo ">>> WARN: root .env PORT=${_env_api_port} matches a common Next dev port; starting traveltrust-api on 8080. Set PORT=8080 in .env to silence." >&2
  BACKEND_PORT="8080"
else
  BACKEND_PORT="${API_PORT:-${_env_api_port:-8080}}"
fi
FRONTEND_PORT="${FRONTEND_PORT:-3012}"
