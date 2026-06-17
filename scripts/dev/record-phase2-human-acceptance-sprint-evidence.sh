#!/usr/bin/env bash
# PHASE2-HUMAN-ACCEPTANCE-SPRINT — 四角色 ① 本地 + ② 测试网 真人视角验收
#
#   bash scripts/dev/record-phase2-human-acceptance-sprint-evidence.sh
#
# 角色：旅行者 · 向导 · 管理员 · 收购/运营
# 纪律：全部角色 ①+② PASS 后，才将 TT_PHASE3_PRODUCTION_READINESS_REVIEW 从 HOLD → REQUESTED
#
# 可选：
#   P2HA_SKIP_LOCAL=1          跳过 ①（仅调试）
#   P2HA_SKIP_STAGING=1        跳过 ②（禁止冒充全 sprint PASS）
#   P2HA_START_FE=1            本地 FE 未起时尝试 scripts/run-frontend.bat
#   P2HA_LOCAL_WEB=http://127.0.0.1:3012
#   P2HA_STAGING_WEB=https://tt-web-staging.fly.dev
#   P2HA_STAGING_API=https://tt-api-staging.fly.dev
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/evidence/phase2-human-acceptance-sprint"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/PHASE2-HUMAN-ACCEPTANCE-SPRINT-${STAMP}.log"
SPRINT_DIR="$EVID/${STAMP}"
LOCAL_DIR="$SPRINT_DIR/local"
STAGING_DIR="$SPRINT_DIR/staging"
PRA_EVID="$ROOT/evidence/PRODUCTION_READINESS_AUDIT"

mkdir -p "$LOCAL_DIR" "$STAGING_DIR" "$EVID"

LOCAL_WEB="${P2HA_LOCAL_WEB:-http://127.0.0.1:3012}"
LOCAL_API="${P2HA_LOCAL_API:-http://127.0.0.1:8080}"
STAGING_WEB="${P2HA_STAGING_WEB:-https://tt-web-staging.fly.dev}"
STAGING_API="${P2HA_STAGING_API:-https://tt-api-staging.fly.dev}"

curl_http_code() {
  local url="$1"
  local connect="${2:-3}"
  local max="${3:-8}"
  local proxy="${HTTPS_PROXY:-${https_proxy:-}}"
  local -a curl_args=(-sS -o /dev/null -w '%{http_code}' --connect-timeout "$connect" --max-time "$max")
  if [[ "$url" == http://127.0.0.1:* || "$url" == http://localhost:* ]]; then
    curl_args+=(--noproxy '*')
  elif [[ -n "$proxy" && "$url" == https://* ]]; then
    # Git Bash curl on Windows: HTTPS_PROXY env often times out; explicit -x works.
    curl_args+=(-x "$proxy")
  fi
  curl "${curl_args[@]}" "$url" 2>/dev/null || echo "000"
}

fe_up() {
  local code
  code="$(curl_http_code "${LOCAL_WEB}/")"
  [[ "$code" == "200" || "$code" == "307" || "$code" == "308" ]]
}

api_up() {
  local base="$1"
  local code
  code="$(curl_http_code "${base}/health")"
  [[ "$code" == "200" ]]
}

maybe_start_fe() {
  fe_up && return 0
  [[ "${P2HA_START_FE:-}" == "1" ]] || return 1
  echo "p2ha: starting frontend on 3012 (background via cmd)…"
  if [[ -n "${COMSPEC:-}" ]] && command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe //c "cd /d \"${ROOT//\//\\}\" && set FRONTEND_PORT=${FRONTEND_PORT:-3012} && set TRAVELTRUST_FRONTEND_PORT=${FRONTEND_PORT:-3012} && start \"TravelTrust-Frontend-P2HA\" cmd /k call scripts\\run-frontend.bat" >/dev/null 2>&1 || true
  else
    return 1
  fi
  local i
  for i in $(seq 1 90); do
    fe_up && return 0
    sleep 2
  done
  return 1
}

run_local_leg() {
  echo ""
  echo "== ① Local human acceptance probe =="
  if [[ "${P2HA_SKIP_LOCAL:-}" == "1" ]]; then
    echo "SKIP P2HA_SKIP_LOCAL=1"
    return 0
  fi
  if ! api_up "$LOCAL_API"; then
    echo "FAIL: local API not up at $LOCAL_API — run TRAVELTRUST_MANUAL_ACCEPTANCE=1 scripts/start-api-with-seed.bat" >&2
    return 1
  fi
  if ! fe_up; then
    maybe_start_fe || true
  fi
  if ! fe_up; then
    echo "FAIL: local Next required at $LOCAL_WEB — run scripts/start-api-with-seed.bat or npm run dev in frontend" >&2
    return 1
  fi
  powershell -NoProfile -ExecutionPolicy Bypass -File "$ROOT/scripts/dev/verify-seed-test-accounts-login.ps1" \
    -Port "${LOCAL_API##*:}" -WarnOnly 2>&1 | tee "$LOCAL_DIR/seed-login.log" || true
  export P2HA_PHASE=local
  export P2HA_WEB_BASE="$LOCAL_WEB"
  export P2HA_API_BASE="$LOCAL_API"
  export P2HA_OUT="$(cygpath -m "$LOCAL_DIR" 2>/dev/null || echo "$LOCAL_DIR")"
  export P2HA_ALLOW_SEED=1
  python "$ROOT/scripts/dev/phase2-human-acceptance-probe.py" 2>&1 | tee "$LOCAL_DIR/probe.log"
  local v
  v="$(grep -E '^P2HA_VERDICT_' "$LOCAL_DIR/probe.log" | tail -1 | awk -F': ' '{print $2}' | tr -d '\r')"
  if [[ -z "$v" ]]; then
    local findings_m
    findings_m="$(cygpath -m "$LOCAL_DIR/p2ha-findings.json" 2>/dev/null || echo "$LOCAL_DIR/p2ha-findings.json")"
    v="$(python -c "import json; print(json.load(open(r'''${findings_m}''', encoding='utf-8'))['verdict'])")"
  fi
  echo "P2HA_LOCAL_VERDICT: $v"
  [[ "$v" == "PASS" ]]
}

run_staging_leg() {
  echo ""
  echo "== ② Staging human acceptance probe =="
  if [[ "${P2HA_SKIP_STAGING:-}" == "1" ]]; then
    echo "SKIP P2HA_SKIP_STAGING=1 — sprint cannot reach overall PASS"
    return 0
  fi
  if ! api_up "$STAGING_API"; then
    echo "FAIL: staging API not reachable at $STAGING_API" >&2
    return 1
  fi
  export P2HA_PHASE=staging
  export P2HA_WEB_BASE="$STAGING_WEB"
  export P2HA_API_BASE="$STAGING_API"
  export P2HA_OUT="$(cygpath -m "$STAGING_DIR" 2>/dev/null || echo "$STAGING_DIR")"
  export P2HA_ALLOW_SEED=1
  python "$ROOT/scripts/dev/phase2-human-acceptance-probe.py" 2>&1 | tee "$STAGING_DIR/probe.log"
  local v
  v="$(grep -E '^P2HA_VERDICT_' "$STAGING_DIR/probe.log" | tail -1 | awk -F': ' '{print $2}' | tr -d '\r')"
  if [[ -z "$v" ]]; then
    local findings_m
    findings_m="$(cygpath -m "$STAGING_DIR/p2ha-findings.json" 2>/dev/null || echo "$STAGING_DIR/p2ha-findings.json")"
    v="$(python -c "import json; print(json.load(open(r'''${findings_m}''', encoding='utf-8'))['verdict'])")"
  fi
  echo "P2HA_STAGING_VERDICT: $v"
  [[ "$v" == "PASS" ]]
}

update_phase3_application() {
  local status="$1"
  mkdir -p "$PRA_EVID"
  local app="$PRA_EVID/PHASE3-PRODUCTION-READINESS-REVIEW-APPLICATION-${STAMP}.md"
  local manifest="$SPRINT_DIR/phase2-human-acceptance-manifest.v1.json"
  local pra_manifest=""
  if [[ -f "$PRA_EVID/PHASE3-PRODUCTION-READINESS-REVIEW-APPLICATION-latest.md" ]]; then
    pra_manifest="$(grep -o 'unified-[0-9T]*Z' "$PRA_EVID/PHASE3-PRODUCTION-READINESS-REVIEW-APPLICATION-latest.md" 2>/dev/null | head -1 || true)"
  fi
  cat >"$app" <<EOF
# Phase ③ · Production Readiness Review · Application（**${status}**）

**状态：** **${status}** — PHASE2-HUMAN-ACCEPTANCE-SPRINT \`${STAMP}\`  
**人工验收 manifest：** \`evidence/phase2-human-acceptance-sprint/${STAMP}/phase2-human-acceptance-manifest.v1.json\`  
**PRA unified（机读）：** ${pra_manifest:-见 PRODUCTION_READINESS_AUDIT/unified-*}

**阶段纪律：** ① → ② → **③**；PRA GO **≠** 人工 PASS **≠** Production GO

---

## 人工验收（四角色 · ①+②）

| 角色 | 要求 |
|------|------|
| 旅行者 | ①+② PASS |
| 向导 | ①+② PASS |
| 管理员 | ①+② PASS |
| 收购/运营 | ①+② PASS |

报告：[\`PHASE2-HUMAN-ACCEPTANCE-SPRINT-REPORT.md\`](../../docs/runbook/PHASE2-HUMAN-ACCEPTANCE-SPRINT-REPORT.md)

**机读：** \`TT_PHASE3_PRODUCTION_READINESS_REVIEW: ${status} ${STAMP}\`
EOF
  ln -sfn "$(basename "$app")" "$PRA_EVID/PHASE3-PRODUCTION-READINESS-REVIEW-APPLICATION-latest.md" 2>/dev/null || \
    cp "$app" "$PRA_EVID/PHASE3-PRODUCTION-READINESS-REVIEW-APPLICATION-latest.md"
  echo "phase3_application: $app"
}

{
  echo "TT_PHASE2_HUMAN_ACCEPTANCE_SPRINT: START ${STAMP}"
  echo "roles: 旅行者 · 向导 · 管理员 · 收购/运营"
  echo "discipline: all roles PASS on ①+② before Phase③ REQUESTED"

  LOCAL_OK=0
  STAGING_OK=0
  if run_local_leg; then LOCAL_OK=1; fi
  if run_staging_leg; then STAGING_OK=1; fi

  if [[ ! -f "$LOCAL_DIR/p2ha-findings.json" ]]; then
    [[ -f "$(cygpath -m "$LOCAL_DIR/p2ha-findings.json" 2>/dev/null)" ]] || {
      echo "FAIL: missing local findings" >&2
      exit 2
    }
  fi
  if [[ "${P2HA_SKIP_STAGING:-}" != "1" ]]; then
    if [[ ! -f "$STAGING_DIR/p2ha-findings.json" ]]; then
      [[ -f "$(cygpath -m "$STAGING_DIR/p2ha-findings.json" 2>/dev/null)" ]] || {
        echo "FAIL: missing staging findings" >&2
        exit 2
      }
    fi
  fi

  LOCAL_JSON="$(cygpath -m "$LOCAL_DIR/p2ha-findings.json" 2>/dev/null || echo "$LOCAL_DIR/p2ha-findings.json")"
  STAGING_JSON="$(cygpath -m "$STAGING_DIR/p2ha-findings.json" 2>/dev/null || echo "$STAGING_DIR/p2ha-findings.json")"

  echo ""
  echo "== Merge manifest + report =="
  python "$ROOT/scripts/dev/generate-phase2-human-acceptance-sprint-report.py" \
    --local "$LOCAL_JSON" \
    --staging "$STAGING_JSON" \
    --out-dir "$SPRINT_DIR" \
    --stamp "$STAMP" 2>&1 | tee "$SPRINT_DIR/merge.log"

  MANIFEST_JSON="$(cygpath -m "$SPRINT_DIR/phase2-human-acceptance-manifest.v1.json" 2>/dev/null || echo "$SPRINT_DIR/phase2-human-acceptance-manifest.v1.json")"
  OVERALL="$(python -c "import json; print(json.load(open(r'''${MANIFEST_JSON}''', encoding='utf-8'))['overall_verdict'])")"
  P3_STATUS="$(python -c "import json; print(json.load(open(r'''${MANIFEST_JSON}''', encoding='utf-8'))['phase3_review_status'])")"

  update_phase3_application "$P3_STATUS"

  ln -sfn "$STAMP" "$EVID/latest" 2>/dev/null || true

  echo ""
  if [[ "$OVERALL" != "PASS" ]]; then
    echo "TT_PHASE2_HUMAN_ACCEPTANCE_SPRINT: NO-GO ${STAMP}"
    echo "TT_PHASE3_PRODUCTION_READINESS_REVIEW: HOLD ${STAMP}"
    echo ""
    echo "Fix failures then re-run. Local OK=$LOCAL_OK Staging OK=$STAGING_OK"
    echo "Local FE hint: TRAVELTRUST_MANUAL_ACCEPTANCE=1 scripts/start-api-with-seed.bat"
    exit 1
  fi

  echo "TT_PHASE2_HUMAN_ACCEPTANCE_SPRINT: OK ${STAMP}"
  echo "TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED ${STAMP}"
  echo "manifest: $SPRINT_DIR/phase2-human-acceptance-manifest.v1.json"
  echo "report: docs/runbook/PHASE2-HUMAN-ACCEPTANCE-SPRINT-REPORT.md"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_PHASE2_HUMAN_ACCEPTANCE_SPRINT: OK" "$RUN_LOG" || exit 1
echo "Log: $RUN_LOG"
exit 0
