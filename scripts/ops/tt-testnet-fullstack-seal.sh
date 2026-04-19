#!/usr/bin/env bash
# TT-TESTNET / TT-B435：在已有 run_<UTC>/ 与 tx_hashes.json 基础上，落盘观测 JSON + SSOT + 可选 broadcast 归档。
#
# 前置：仓库根 .env 已配置链上变量；API 进程可读同一 .env；INTERNAL_API_SECRET、ADMIN_BEARER_TOKEN（或 testnet mint 条件）。
#
# 用法（仓库根）：
#   set -a && source .env && set +a
#   export B435_EVIDENCE_RUN_DIR=evidence/b435_fullstack_fund_testnet_closeout/run_<UTC>
#   export B435_FIRST_PAYMENT_TX=0x…
#   bash scripts/ops/tt-testnet-fullstack-seal.sh
#
# 可选：仅归档 broadcast、不写 first_payment（不推荐封口）：
#   TT_TESTNET_SKIP_FIRST_PAYMENT_MERGE=1 bash scripts/ops/tt-testnet-fullstack-seal.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

RUN_DIR="${B435_EVIDENCE_RUN_DIR:-}"
RUN_DIR="${RUN_DIR//$'\r'/}"
if [[ -z "$RUN_DIR" ]]; then
  echo "Set B435_EVIDENCE_RUN_DIR=evidence/b435_fullstack_fund_testnet_closeout/run_<UTC>" >&2
  exit 1
fi
if [[ ! -d "$ROOT/$RUN_DIR" ]]; then
  echo "Directory not found: $ROOT/$RUN_DIR" >&2
  exit 1
fi
export B435_EVIDENCE_RUN_DIR="$RUN_DIR"

TX_JSON="$ROOT/$RUN_DIR/tx_hashes.json"
if [[ ! -f "$TX_JSON" ]]; then
  echo "Missing $TX_JSON — run tt-testnet-fullstack-new-run-dir.sh first" >&2
  exit 1
fi

if [[ "${TT_TESTNET_SKIP_FIRST_PAYMENT_MERGE:-0}" != "1" ]]; then
  if [[ -z "${B435_FIRST_PAYMENT_TX:-}" ]]; then
    echo "Set B435_FIRST_PAYMENT_TX=0x… (Sepolia real tx) or TT_TESTNET_SKIP_FIRST_PAYMENT_MERGE=1" >&2
    exit 1
  fi
  export B435_TX_HASHES_JSON="$TX_JSON"
  bash "$ROOT/scripts/ops/b435-merge-first-payment-tx.example.sh"
else
  echo "=== skip b435-merge-first-payment-tx (TT_TESTNET_SKIP_FIRST_PAYMENT_MERGE=1) ===" >&2
fi

echo "=== runtime-chain-ssot-cast-verify → ssot.txt ==="
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi
bash "$ROOT/scripts/ops/runtime-chain-ssot-cast-verify.sh" >"$ROOT/$RUN_DIR/ssot.txt" 2>&1 || {
  echo "runtime-chain-ssot-cast-verify failed; ssot.txt captured with non-zero exit" >&2
}

echo "=== indexer-tick / indexer-reconcile / overview ==="
bash "$ROOT/scripts/ops/b435-evidence-internal-curls.example.sh"

if [[ -d "$ROOT/contracts/broadcast/DeployFundStackUnderTimelock.s.sol/11155111" ]]; then
  echo "=== copy broadcast artifacts (Sepolia 11155111) ==="
  mkdir -p "$ROOT/$RUN_DIR/broadcast"
  cp -R "$ROOT/contracts/broadcast/DeployFundStackUnderTimelock.s.sol/11155111/." "$ROOT/$RUN_DIR/broadcast/" || true
else
  echo "No contracts/broadcast/DeployFundStackUnderTimelock.s.sol/11155111 — skip broadcast copy" >&2
fi

echo "=== GET /api/v1/meta → meta.json (91 §六.1 chain SSOT) ==="
if [[ "${TT_TESTNET_SKIP_META_SNAPSHOT:-0}" != "1" ]]; then
  _API_BASE="${API_BASE_URL:-http://127.0.0.1:${PORT:-8080}}"
  _API_BASE="${_API_BASE//$'\r'/}"
  if curl -fsS --max-time 60 "${_API_BASE%/}/api/v1/meta" -o "$ROOT/$RUN_DIR/meta.json"; then
    echo "Wrote $RUN_DIR/meta.json"
  else
    echo "tt-testnet-fullstack-seal: WARN meta snapshot failed (set TT_TESTNET_SKIP_META_SNAPSHOT=1 to skip)" >&2
  fi
else
  echo "skip meta.json (TT_TESTNET_SKIP_META_SNAPSHOT=1)" >&2
fi

echo "=== FeeRouter ops snapshot (optional, 91 §八) ==="
if [[ "${TT_TESTNET_SKIP_FEE_ROUTER_OPS_SNAPSHOT:-0}" != "1" && -n "${FEE_ROUTER_ADDRESS:-}" ]]; then
  export FEE_ROUTER_OPS_OUT="$ROOT/$RUN_DIR/fee_router_ops_snapshot.json"
  bash "$ROOT/scripts/ops/fee-router-ops-snapshot.sh" || echo "tt-testnet-fullstack-seal: WARN fee_router_ops_snapshot failed" >&2
else
  echo "skip fee_router_ops_snapshot (set FEE_ROUTER_ADDRESS or TT_TESTNET_SKIP_FEE_ROUTER_OPS_SNAPSHOT=1)" >&2
fi

echo "=== evidence SHA256 manifest (91 §8.2) ==="
if [[ "${TT_TESTNET_SKIP_SHA256_MANIFEST:-0}" != "1" ]]; then
  if command -v python3 >/dev/null 2>&1 && python3 -c "import hashlib,json" 2>/dev/null; then
    python3 "$ROOT/scripts/ops/evidence_run_sha256_manifest.py" generate "$ROOT/$RUN_DIR" || {
      echo "tt-testnet-fullstack-seal: WARN manifest generation failed" >&2
    }
  else
    echo "tt-testnet-fullstack-seal: WARN python3 unavailable — skip evidence_sha256_manifest (install Python 3)" >&2
  fi
else
  echo "skip SHA256 manifest (TT_TESTNET_SKIP_SHA256_MANIFEST=1)" >&2
fi

echo "Done: $ROOT/$RUN_DIR (tx_hashes.json, indexer_tick.json, reconcile.json, overview.json, ssot.txt, meta.json?, fee_router_ops_snapshot.json?, evidence_sha256_manifest.json?)"
