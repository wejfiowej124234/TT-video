#!/usr/bin/env bash
# ① Site10 · 桶窄切片复跑公共契约（community 同源 · 非全矩阵 · 非 ②③ GO）
set -euo pipefail

site10_kill_listen_ports() {
  local port
  for port in "${@:-8080 3012}"; do
    if command -v powershell.exe >/dev/null 2>&1; then
      powershell.exe -NoProfile -Command \
        "\$p = @(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); foreach (\$x in \$p) { if (\$x -and \$x -ne 0) { Stop-Process -Id \$x -Force -ErrorAction SilentlyContinue } }" \
        >/dev/null 2>&1 || true
    else
      bash -lc "pids=\$(lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null || true); if [ -n \"\$pids\" ]; then kill -9 \$pids 2>/dev/null || true; fi" || true
    fi
  done
  sleep 2
}

site10_ensure_api_health() {
  local ROOT="$1"
  local API_BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
  local EVID="$ROOT/frontend/evidence/GO_local_phase1"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/health" 2>/dev/null || echo "000")"
  if [[ "$code" != "200" ]]; then
    echo "site10: starting API sidecar (health was ${code})…" >&2
    # shellcheck source=scripts/dev/export-database-url-from-root-env.sh
    source "$ROOT/scripts/dev/export-database-url-from-root-env.sh"
    export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}" SEED_TEST_ACCOUNTS=1
    export API_RATE_LIMIT_PER_MINUTE=0 CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE=0
    nohup bash "$ROOT/scripts/dev/start-api-for-playwright.sh" >>"$EVID/site10-api-sidecar.log" 2>&1 &
    for _ in $(seq 1 40); do
      code="$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/health" 2>/dev/null || echo "000")"
      [[ "$code" == "200" ]] && return 0
      sleep 2
    done
    echo "site10: FAIL API /health not 200 after wait" >&2
    return 1
  fi
}

site10_bucket_narrow_recheck_export_env() {
  local ROOT="$1"
  # shellcheck source=scripts/dev/export-database-url-from-root-env.sh
  source "$ROOT/scripts/dev/export-database-url-from-root-env.sh"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_E2E_STABILITY="${PLAYWRIGHT_E2E_STABILITY:-1}"
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_SKIP_NEXT_PURGE="${PLAYWRIGHT_SKIP_NEXT_PURGE:-1}"
  export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
  export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE="${TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE:-1}"
  export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE="${NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE:-1}"
}

# site10_run_bucket_narrow_recheck ROOT BUCKET_LABEL OUT_LOG TOKEN_OK SPECS...
site10_run_bucket_narrow_recheck() {
  local ROOT="$1"
  local BUCKET="$2"
  local OUT="$3"
  local TOKEN_OK="$4"
  shift 4
  local -a SPECS=("$@")

  local STAMP fail=0 pass=0 spec rc
  STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  {
    echo "# site10 ${BUCKET} bucket narrow recheck · $STAMP (UTC)"
    echo "# specs=${#SPECS[@]} · expansion phase · baseline rerun20"
    echo ""
  } >"$OUT"

  for spec in "${SPECS[@]}"; do
    echo "== recheck: $spec ==" | tee -a "$OUT"
    set +e
    (
      cd "$ROOT/frontend"
      env -u REQUIRE_IDEMPOTENCY_KEY node ./scripts/run-e2e-default.mjs "$spec" --project=chromium
    ) 2>&1 | tee -a "$OUT"
    rc=${PIPESTATUS[0]}
    set -e
    if [[ "$rc" -eq 0 ]]; then
      pass=$((pass + 1))
      echo "RECHECK_PASS: $spec (exit 0)" | tee -a "$OUT"
    else
      fail=$((fail + 1))
      echo "RECHECK_FAIL: $spec (exit $rc)" | tee -a "$OUT"
    fi
    echo "" | tee -a "$OUT"
  done

  {
    echo "# summary pass=$pass fail=$fail total=${#SPECS[@]} · $STAMP"
  } | tee -a "$OUT"

  if [[ "$fail" -ne 0 ]]; then
    echo "site10-${BUCKET}-bucket-narrow-recheck: FAIL ($fail/${#SPECS[@]}) → $OUT" >&2
    return 1
  fi

  echo "$TOKEN_OK" | tee -a "$OUT"
  echo "site10-${BUCKET}-bucket-narrow-recheck: OK ($pass/${#SPECS[@]}) → $OUT"
  return 0
}

site10_bucket_narrow_recheck_log_ok() {
  local LOG="$1"
  local TOKEN="$2"
  [[ -f "$LOG" ]] || return 1
  grep -q "$TOKEN" "$LOG" 2>/dev/null || return 1
  grep -qE "# summary pass=10 fail=0 total=10" "$LOG" 2>/dev/null
}
