#!/usr/bin/env bash
# Environment GO：**Phase A** **（** **W-GATE** **发版前** **+** **Runbook/Go-Live** **文档** **锚** **+** **B-427** **订单** **机读** **）** **→** **Phase B** **（** **B-424** **/** **B-425** **/** **B-426** **，** **须** **已** **启动** **API** **且** **`GET …/meta` = 200** **）** **。**
#
# **Phase B** **环境** **：** **`ADMIN_BEARER_TOKEN`** **、** **`INTERNAL_API_SECRET`** **（** **B-425** **）** **、** **`jq`** **、** **`curl`** **；** **`API_BASE_URL`** **默认** **`http://127.0.0.1:8080`** **。**
#
# **`ENV_GO_SKIP_API_GATES=1`** **：** **仅** **跑** **Phase A** **（** **与** **`scripts/README.md`** **「** **Environment GO** **」** **行** **一致** **）** **。**
#
# 用法（仓库根）：**`bash scripts/run-environment-go.sh`** **[** **`--json`** **]**
#
# **`--json`** **：** **stdout** **单行** **`traveltrust.environment_go.v1`** **（** **须** **`jq`** **）** **；** **子** **gate** **默认** **不** **带** **`--json`** **，** **避免** **多** **行** **机读** **混** **stdout** **。**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then
    JSON=true
  else
    echo "run-environment-go: unknown option: $a" >&2
    exit 1
  fi
done

if $JSON && ! command -v jq >/dev/null 2>&1; then
  echo "run-environment-go: jq is required for --json" >&2
  exit 1
fi

phase_b_status="skipped"

run_phase_a() {
  echo "=== run-environment-go: Phase A · W-GATE prerelease (B-420) ===" >&2
  bash scripts/check-w-gate-prerelease.sh
  echo "=== run-environment-go: Phase A · Runbook go-live doclink (B-421) ===" >&2
  bash scripts/check-runbook-golive-doclink-gate.sh
  echo "=== run-environment-go: Phase A · Order E2E 01353 gate (B-427) ===" >&2
  bash scripts/check-order-e2e-01353-gate.sh
}

run_phase_b() {
  local base="${API_BASE_URL:-http://127.0.0.1:8080}"
  base="${base%/}"

  if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
    echo "run-environment-go: Phase B requires ADMIN_BEARER_TOKEN" >&2
    exit 10
  fi
  if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
    echo "run-environment-go: Phase B requires INTERNAL_API_SECRET (B-425)" >&2
    exit 11
  fi

  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "${base}/meta" || true)"
  if [[ "$code" != "200" ]]; then
    echo "run-environment-go: Phase B requires GET ${base}/meta HTTP 200 (got ${code})" >&2
    exit 12
  fi

  echo "=== run-environment-go: Phase B · meta/overview deepeq (B-424) ===" >&2
  bash scripts/check-meta-overview-deepeq-gate.sh

  echo "=== run-environment-go: Phase B · indexer lag locate (B-425) ===" >&2
  bash scripts/check-indexer-lag-locate-gate.sh

  echo "=== run-environment-go: Phase B · revenue suspect runbook (B-426) ===" >&2
  bash scripts/check-revenue-suspect-runbook-gate.sh
}

run_phase_a

if [[ "${ENV_GO_SKIP_API_GATES:-}" == "1" ]]; then
  echo "run-environment-go: skip Phase B (ENV_GO_SKIP_API_GATES=1)" >&2
else
  run_phase_b
  phase_b_status="ran"
fi

if $JSON; then
  jq -n \
    --arg schema "traveltrust.environment_go.v1" \
    --arg verdict "GO" \
    --arg phase_b "$phase_b_status" \
    '{schema_version: $schema, verdict: $verdict, phase_a: "ok", phase_b: $phase_b}'
else
  echo "run-environment-go: ok" >&2
fi
