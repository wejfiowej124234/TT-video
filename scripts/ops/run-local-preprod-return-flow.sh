#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

RUN_ID="${RUN_ID:-GO_20260425}"
OUT_DIR="${OUT_DIR:-evidence/${RUN_ID}/local_preprod_96_15}"
TIER_A1_README="${TIER_A1_README:-evidence/${RUN_ID}/RELEASE_SUMMARY_GO_${RUN_ID#GO_}.md}"
TIER_A2_MARKDOWN="${TIER_A2_MARKDOWN:-evidence/${RUN_ID}/RELEASE_SUMMARY_GO_${RUN_ID#GO_}.md}"
SKIP_START=0
P0_ONLY=0
NO_CHAIN=0

usage() {
  cat <<'EOF'
Usage:
  bash scripts/ops/run-local-preprod-return-flow.sh [--skip-start] [--p0-only] [--no-chain]

Options:
  --skip-start   Skip scripts/start-api-with-seed.bat
  --p0-only      Only run P0 hard gates (steps 1-6), then exit
  --no-chain     Skip chain-related checks (steps 9-12)
  -h, --help     Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-start)
      SKIP_START=1
      ;;
    --p0-only)
      P0_ONLY=1
      ;;
    --no-chain)
      NO_CHAIN=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 2
  }
}

need_cmd bash
need_cmd python
need_cmd curl

env_val() {
  local key="$1"
  python - "$key" <<'PY'
import sys
from pathlib import Path
key=sys.argv[1]
p=Path(".env")
if not p.exists():
    print("")
    raise SystemExit(0)
val=""
for line in p.read_text(encoding="utf-8",errors="ignore").splitlines():
    s=line.strip()
    if not s or s.startswith("#") or "=" not in s:
        continue
    k,v=s.split("=",1)
    if k.strip()==key:
        val=v.strip().strip('"').strip("'")
print(val)
PY
}

is_placeholder() {
  local v="${1:-}"
  [[ -z "$v" ]] && return 0
  [[ "$v" == *replace* ]] && return 0
  [[ "$v" == *example.com* ]] && return 0
  [[ "$v" == "smtp.example.com" ]] && return 0
  return 1
}

require_env_non_placeholder() {
  local k="$1"
  local v
  v="$(env_val "$k")"
  if is_placeholder "$v"; then
    echo "precheck fail: $k is empty or placeholder in .env" >&2
    exit 4
  fi
}

rpc_chainid_probe() {
  local rpc="$1"
  local cid
  cid="$(curl -sS -m 12 -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    "$rpc" | python -c 'import sys,json;print((json.load(sys.stdin).get("result","") or "").strip())' 2>/dev/null || true)"
  [[ "$cid" =~ ^0x[0-9a-fA-F]+$ ]]
}

preprod_hard_precheck() {
  echo ""
  echo "[precheck] production-grade env gates"
  require_env_non_placeholder "TRAVELTRUST_DEPLOYMENT_PROFILE"
  require_env_non_placeholder "TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS"
  require_env_non_placeholder "STRICT_SESSION_GATE"
  require_env_non_placeholder "INTERNAL_API_SECRET"
  require_env_non_placeholder "CORS_ORIGINS"
  require_env_non_placeholder "DATABASE_URL"
  require_env_non_placeholder "CHAIN_RPC_URL"
  require_env_non_placeholder "CHAIN_ID"

  local dep prof strict
  dep="$(env_val TRAVELTRUST_DEPLOYMENT_PROFILE)"
  prof="$(env_val TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS)"
  strict="$(env_val STRICT_SESSION_GATE)"
  if [[ "${dep,,}" != "production" && "${dep,,}" != "prod" ]]; then
    echo "precheck fail: TRAVELTRUST_DEPLOYMENT_PROFILE must be production/prod" >&2
    exit 4
  fi
  if [[ "$prof" != "1" ]]; then
    echo "precheck fail: TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS must be 1" >&2
    exit 4
  fi
  if [[ "$strict" != "1" ]]; then
    echo "precheck fail: STRICT_SESSION_GATE must be 1" >&2
    exit 4
  fi

  local mt
  mt="$(env_val TRAVELTRUST_EMAIL_TRANSPORT)"
  if [[ "${mt,,}" == "log" || "${mt,,}" == "off" || -z "$mt" ]]; then
    echo "precheck fail: TRAVELTRUST_EMAIL_TRANSPORT must be real provider (not log/off)" >&2
    exit 4
  fi
  if [[ "${mt,,}" != "resend" ]]; then
    echo "precheck fail: TRAVELTRUST_EMAIL_TRANSPORT must be resend for traveltrust-api (got '${mt}'); SMTP is not implemented in crates/api" >&2
    exit 4
  fi
  require_env_non_placeholder "TRAVELTRUST_AUTH_TOKEN_PEPPER"
  require_env_non_placeholder "TRAVELTRUST_RESEND_API_KEY"
  require_env_non_placeholder "TRAVELTRUST_RESEND_FROM"

  if [[ "$NO_CHAIN" != "1" ]]; then
    require_env_non_placeholder "PRIVATE_KEY"
    local pk rpc
    pk="$(env_val PRIVATE_KEY)"
    rpc="$(env_val CHAIN_RPC_URL)"
    if ! [[ "$pk" =~ ^0x[0-9a-fA-F]{64}$ || "$pk" =~ ^[0-9a-fA-F]{64}$ ]]; then
      echo "precheck fail: PRIVATE_KEY must be 0x+64hex or 64hex" >&2
      exit 4
    fi
    if ! rpc_chainid_probe "$rpc"; then
      echo "precheck fail: CHAIN_RPC_URL eth_chainId probe failed" >&2
      exit 4
    fi
  fi
  echo "[precheck] OK"
}

echo "== local preprod return flow =="
echo "repo: $ROOT"
echo "run_id: $RUN_ID"
echo "out_dir: $OUT_DIR"
echo "flags: skip_start=$SKIP_START p0_only=$P0_ONLY no_chain=$NO_CHAIN"

preprod_hard_precheck

echo ""
echo "[1/12] local ci"
bash scripts/ci/run_local_ci.sh

echo ""
echo "[2/12] sqlx migration prefix gate"
bash scripts/check-sqlx-migration-prefixes.sh

echo ""
echo "[3/12] ABI gate 55-S13"
bash scripts/check-55-s13.sh

echo ""
echo "[4/12] 04 routes gate"
bash scripts/run-check-04-routes.sh

echo ""
echo "[5/12] start local stack (Windows batch)"
if [[ "$SKIP_START" == "1" ]]; then
  echo "skip: --skip-start enabled"
else
  if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe //c scripts\\start-api-with-seed.bat
  else
    echo "cmd.exe not found; run scripts/start-api-with-seed.bat manually on Windows" >&2
    exit 3
  fi
fi

echo ""
echo "[6/12] regression report require-go"
python scripts/validate-regression-report.py "evidence/${RUN_ID}/report.json" --require-go

if [[ "$P0_ONLY" == "1" ]]; then
  echo ""
  echo "P0-only mode completed (steps 1-6)."
  exit 0
fi

echo ""
echo "[7/12] 96-15 orchestration"
python scripts/release/run_96_15_orchestration.py \
  --out-dir "$OUT_DIR" \
  --executor local-preprod \
  --tier-a1-readme "$TIER_A1_README" \
  --tier-a2-markdown "$TIER_A2_MARKDOWN" \
  --require-tier-a-semiauto

echo ""
echo "[8/12] go state machine (tri_state_v2)"
python scripts/release/go_state_machine.py \
  --orchestration "$OUT_DIR/release_orchestration.json" \
  --regression "evidence/${RUN_ID}/report.json" \
  --policy tri_state_v2

if [[ "$NO_CHAIN" == "1" ]]; then
  echo ""
  echo "No-chain mode completed (steps 1-8)."
  exit 0
fi

echo ""
echo "[9/12] indexer lag gate"
bash scripts/check-indexer-lag-locate-gate.sh

echo ""
echo "[10/12] data reconcile / projection / governance gate"
bash scripts/check-data-reconcile-projection-gov-gate.sh

echo ""
echo "[11/12] fee-router B383 smoke"
bash scripts/ops/b383-fee-router-platform-fee-routed-log-count-reconcile-admin-overview-smoke.sh

echo ""
echo "[12/12] B435 preflight"
bash scripts/ops/b435-preflight-check.sh

echo ""
echo "local preprod return flow completed."
