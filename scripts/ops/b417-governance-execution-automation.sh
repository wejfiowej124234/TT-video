#!/usr/bin/env bash
# B-417 · **L3** **编排** **：** **（** **可选** **）** **gap-check** **→** **preflight** **→** **`queue`** **→** **`execute`** **→** **`b417-governance-execution-report.json`** **。**
#
# 环境：**`B417_CHAIN_MODE=1`** **走** **真** **链** **；** **否则** **仅** **写** **`dry_run`** **报告** **（** **`execution_verdict=NO_GO`** **）** **。** **`B417_SKIP_GAP_CHECK=1`** **/** **`B417_SKIP_PREFLIGHT=1`** **可** **跳过** **前两步** **。**
#
# 用法（仓库根）：**`B417_CHAIN_MODE=1 bash scripts/ops/b417-governance-execution-automation.sh`**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ "${B417_NO_AUTOLOAD_ENV:-0}" != "1" && -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${ROOT}/.env"
  set +a
fi

export B417_CHAIN_MODE="${B417_CHAIN_MODE:-0}"
export B417_RECORD_DIR="${B417_RECORD_DIR:-${ROOT}/evidence/b417_governance_execution_runs/run_$(date -u +%Y%m%dT%H%M%SZ)_local}"
mkdir -p "${B417_RECORD_DIR}"

REPORT="${B417_RECORD_DIR}/b417-governance-execution-report.json"
GEN_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [[ "${B417_CHAIN_MODE}" != "1" ]]; then
  jq -n \
    --arg at "$GEN_AT" \
    '{
      schema_version: "b417_governance_execution_report_v1",
      generated_at_utc: $at,
      dry_run: true,
      execution_verdict: "NO_GO",
      note: "set B417_CHAIN_MODE=1 for on-chain queue/execute (see docs/runbook/TT-B417-GOVERNANCE-EXECUTION-AUTOMATION-L3-001.md)"
    }' >"$REPORT"
  echo "b417-governance-execution-automation: wrote dry-run report → ${REPORT}" >&2
  exit 0
fi

if [[ "${B417_SKIP_GAP_CHECK:-}" != "1" ]]; then
  bash "${ROOT}/scripts/ops/b417-env-gap-check.sh"
fi
if [[ "${B417_SKIP_PREFLIGHT:-}" != "1" ]]; then
  bash "${ROOT}/scripts/ops/b417-sepolia-preflight.sh"
fi

bash "${ROOT}/scripts/ops/b417-governor-queue-testnet.sh"
bash "${ROOT}/scripts/ops/b417-governor-execute-testnet.sh"

if [[ ! -f "${B417_RECORD_DIR}/b417-chain-step-queue.json" || ! -f "${B417_RECORD_DIR}/b417-chain-step-execute.json" ]]; then
  echo "b417-governance-execution-automation: missing sidecar json after queue/execute" >&2
  exit 12
fi

jq -n \
  --arg at "$GEN_AT" \
  --slurpfile q "${B417_RECORD_DIR}/b417-chain-step-queue.json" \
  --slurpfile e "${B417_RECORD_DIR}/b417-chain-step-execute.json" \
  '{
    schema_version: "b417_governance_execution_report_v1",
    generated_at_utc: $at,
    dry_run: false,
    execution_verdict: "GO",
    execution_steps: {queue: $q[0], execute: $e[0]}
  }' >"$REPORT"

echo "b417-governance-execution-automation: wrote ${REPORT}" >&2
