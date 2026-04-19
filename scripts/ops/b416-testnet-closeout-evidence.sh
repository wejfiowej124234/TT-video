#!/usr/bin/env bash
# B-416 · **收口** **编排** **占位** **：** **创建** **`run_<UTC>/`** **并** **写入** **最小** **`b416-closeout-record.json`** **（** **`verdict=STUB`** **）** **。**
#
# **真** **测试网** **`distribute`** **证据** **仍** **须** **按** **Runbook** **§0** **手工** **/** **`b407-exec-chain-release-distribute.sh`** **补跑** **。**
#
# 环境：**`B416_RECORD_DIR`** **可选** **（** **默认** **`evidence/b416_fee_router_write_path_testnet/run_<UTC>Z`** **）** **。**
#
# 用法（仓库根）：**`bash scripts/ops/b416-testnet-closeout-evidence.sh`**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

RUN="${B416_RECORD_DIR:-}"
if [[ -z "$RUN" ]]; then
  RUN="${ROOT}/evidence/b416_fee_router_write_path_testnet/run_$(date -u +%Y%m%dT%H%M%SZ)_stub"
fi
mkdir -p "$RUN"

jq -n \
  --arg sv "b416_fee_router_write_path_closeout_stub_v1" \
  --arg at "$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg verdict "STUB" \
  '{
    schema_version: $sv,
    generated_at_utc: $at,
    verdict: $verdict,
    note: "scripts/ops/b416-testnet-closeout-evidence.sh placeholder — replace with real closeout per TT-B416 §0"
  }' >"${RUN}/b416-closeout-record.json"

echo "b416-testnet-closeout-evidence: wrote ${RUN}/b416-closeout-record.json (verdict=STUB)" >&2
