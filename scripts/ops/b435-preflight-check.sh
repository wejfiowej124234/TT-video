#!/usr/bin/env bash
# TT-B435：清单式预检（不打印私钥内容）。仓库根：bash scripts/ops/b435-preflight-check.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== b435-preflight-check (repo root: $ROOT) ==="

echo ""
echo "[1] .env ignored by git?"
if git check-ignore -q .env 2>/dev/null; then echo "OK: .env is gitignored"; else echo "WARN: .env may not be ignored — check .gitignore"; fi

echo ""
echo "[2] PRIVATE_KEY line (length only, no value)"
if [[ ! -f .env ]]; then echo "FAIL: missing .env"; exit 1; fi
# shellcheck disable=SC1091
set -a
source .env
set +a
PK="${PRIVATE_KEY:-}"
PK="${PK//$'\r'/}"
echo "PRIVATE_KEY length after strip CR: ${#PK}"
if [[ -z "$PK" ]]; then
  echo "FAIL: PRIVATE_KEY empty — add PRIVATE_KEY= to .env (see .env.example TT-B435 block)"
  exit 1
fi
if [[ "$PK" =~ ^0x[0-9a-fA-F]{64}$ ]] || [[ "$PK" =~ ^[0-9a-fA-F]{64}$ ]]; then
  echo "OK: hex length looks like 32-byte key"
else
  echo "FAIL: expected 0x+64 hex OR 64 hex chars"
  exit 1
fi

echo ""
echo "[3] P3_CHAIN_OFF"
if grep -qE '^P3_CHAIN_OFF=1[[:space:]]*$' .env 2>/dev/null; then
  echo "WARN: P3_CHAIN_OFF=1 — not for real-chain TT-B435 closeout"
else
  echo "OK: not forcing chain-off mock (or unset)"
fi

echo ""
echo "[4] API /health + /meta (127.0.0.1:\${PORT:-8080}, 15s timeout)"
PORT="${PORT:-8080}"
H="$(curl -sS -o /tmp/b435-health.txt -w "%{http_code}" --connect-timeout 5 --max-time 15 "http://127.0.0.1:${PORT}/health" 2>/dev/null || echo "000")"
echo "GET /health HTTP $H"
M="$(curl -sS -o /tmp/b435-meta.txt -w "%{http_code}" --connect-timeout 5 --max-time 15 "http://127.0.0.1:${PORT}/meta" 2>/dev/null || echo "000")"
echo "GET /meta HTTP $M"
if [[ "$M" == "200" ]] && [[ -s /tmp/b435-meta.txt ]]; then
  node -e "const m=JSON.parse(require('fs').readFileSync('/tmp/b435-meta.txt','utf8')); console.log('chain_id:', m.chain?.chain_id);" 2>/dev/null || true
fi
if [[ "$H" != "200" ]] || [[ "$M" != "200" ]]; then
  echo "WARN: start API (cargo run -p traveltrust-api or your script) and retry"
fi

echo ""
echo "[5] Foundry broadcast artifacts (Sepolia 11155111)"
for name in DeployFundStackUnderTimelock.s.sol DeployGovernanceStack.s.sol; do
  P="contracts/broadcast/${name}/11155111/run-latest.json"
  if [[ -f "$P" ]]; then echo "OK: $P"; else echo "MISSING: $P (local forge may not be synced here)"; fi
done

echo ""
echo "[6] evidence run folder (default run id)"
RUN="${B435_EVIDENCE_RUN:-run_20260416T122500Z}"
ED="evidence/b435_fullstack_fund_testnet_closeout/${RUN}"
if [[ -d "$ED" ]]; then echo "OK: $ED"; ls -la "$ED" 2>/dev/null | head -12; else echo "MISSING: $ED"; fi

echo ""
echo "=== preflight done ==="
