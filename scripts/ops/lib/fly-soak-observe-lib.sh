#!/usr/bin/env bash
# Fly Soak 只读观测 · 跨平台 SSH/Proxy 辅助（Windows Git Bash「handle is invalid」容错）
#
#   source scripts/ops/lib/fly-soak-observe-lib.sh
#   fly_soak_observe_env
#   fly_ssh_cat "$APP" "/data/soak/status.json" "$out" "$err"
#
# 不 deploy · 不 fix · 只读云端 /data/soak/*
set -euo pipefail

fly_soak_observe_env() {
  export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:15715}"
  export HTTP_PROXY="${HTTP_PROXY:-$HTTPS_PROXY}"
  export NO_PROXY="${NO_PROXY:-localhost,127.0.0.1,.fly.dev,tt-api-staging.fly.dev,tt-web-staging.fly.dev}"
}

# fly ssh cat：stdout 落盘；Windows 上 fly 常 exit 1 但 JSON 已写入；瞬态 EOF 重试
fly_ssh_cat() {
  local app="$1" remote="$2" out="$3" err="${4:-/dev/null}"
  local tmp_err rc attempt max_attempts=3
  max_attempts="${FLY_SOAK_SSH_RETRIES:-3}"

  for attempt in $(seq 1 "$max_attempts"); do
    tmp_err="$(mktemp)"
    : >"$out"
    set +e
    fly ssh console -a "$app" -C "cat ${remote}" >"$out" 2>"$tmp_err"
    rc=$?
    set -e
    if [[ -s "$tmp_err" ]]; then
      echo "attempt=$attempt rc=$rc" >>"$err"
      cat "$tmp_err" >>"$err" 2>/dev/null || true
    fi
    rm -f "$tmp_err"

    if [[ ! -s "$out" ]]; then
      sleep $((attempt * 2))
      continue
    fi
    if grep -qE '^(Error:|Connecting to fdaa:)' "$out" 2>/dev/null; then
      : >"$out"
      sleep $((attempt * 2))
      continue
    fi
    if grep -q "No such file or directory" "$out" 2>/dev/null; then
      : >"$out"
      return 1
    fi
    if node -e "
      const fs=require('fs');
      const t=fs.readFileSync(process.argv[1],'utf8').trim();
      if(!t) process.exit(1);
      JSON.parse(t);
    " "$out" 2>/dev/null; then
      echo "channel=fly_ssh attempt=$attempt rc=$rc" >>"$err"
      return 0
    fi
    if [[ "$rc" -eq 0 ]] || [[ -s "$out" ]]; then
      echo "channel=fly_ssh_text attempt=$attempt rc=$rc" >>"$err"
      return 0
    fi
    sleep $((attempt * 2))
  done

  return 1
}

# 可选 JSON：不存在则 out 空且 return 1（非 fatal）
fly_ssh_cat_json_optional() {
  local app="$1" remote="$2" out="$3" err="${4:-/dev/null}"
  fly_ssh_cat "$app" "$remote" "$out" "$err" || return 1
  node -e "
    const fs=require('fs');
    const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
    if(!j.schema) process.exit(1);
  " "$out" 2>/dev/null
}

# fly proxy + GET /health（SSH 不可用时的回退；需本地已有 proxy 进程）
fly_proxy_health_json() {
  local port="${1:-18080}" out="$2" timeout_sec="${3:-20}"
  curl -sS --max-time "$timeout_sec" "http://127.0.0.1:${port}/health" >"$out" 2>/dev/null || return 1
  node -e "
    const fs=require('fs');
    const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
    if(j.ok!==true && j.service!=='tt-soak-watcher-staging') process.exit(1);
    if(typeof j.ok_polls!=='number') process.exit(1);
  " "$out" 2>/dev/null
}

# 读 status.json：SSH 优先，proxy /health 回退
fly_read_soak_status() {
  local app="$1" out="$2" err="$3"
  local proxy_port="${FLY_SOAK_PROXY_PORT:-18080}"

  if fly_ssh_cat "$app" "/data/soak/status.json" "$out" "$err"; then
    echo "channel=fly_ssh" >>"$err"
    return 0
  fi

  if fly_proxy_health_json "$proxy_port" "$out"; then
    echo "channel=fly_proxy_health port=$proxy_port" >>"$err"
    return 0
  fi

  return 1
}
