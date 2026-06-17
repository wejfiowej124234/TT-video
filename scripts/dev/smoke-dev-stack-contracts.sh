#!/usr/bin/env bash
# Minimal contract smoke: resolve-dev-stack-ports.ps1, e2e-verify.bat (NO_PAUSE + ports), run-dev.mjs (bundle + port).
# No extra test framework; bash + node + PowerShell only.
# Usage (repo root): bash scripts/dev/smoke-dev-stack-contracts.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

die() { echo "smoke-dev-stack-contracts FAIL: $*" >&2; exit 1; }
ok() { echo "smoke-dev-stack-contracts OK: $*"; }

have_powershell() {
  command -v powershell.exe >/dev/null 2>&1 || command -v pwsh >/dev/null 2>&1
}

ps_run() {
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe "$@"
  elif command -v pwsh >/dev/null 2>&1; then
    pwsh "$@"
  else
    return 127
  fi
}

resolve1() {
  local rr="$1"
  ps_run -NoProfile -ExecutionPolicy Bypass -File "$ROOT/scripts/dev/resolve-dev-stack-ports.ps1" -RepoRoot "$rr" 2>/dev/null | tr -d '\r' | head -1
}

# Native cmd.exe must cd into this path; use cygpath -w + env (not cd /d "..." with / or \ from bash — MSYS/cmd edge cases).
run_e2e_verify_in_fake_root() {
  local fake_root="$1"
  local log_out="$2"
  local use_fwd_call="${3:-0}"
  local inject_fe_port="${4:-}"
  local ec
  export SMOKE_E2E_ROOT
  SMOKE_E2E_ROOT="$(cygpath -w "$fake_root")"
  if [[ -n "$inject_fe_port" ]]; then
    if [[ "$use_fwd_call" == 1 ]]; then
      env FRONTEND_PORT="$inject_fe_port" NO_PAUSE=1 cmd.exe //c 'cd /d %SMOKE_E2E_ROOT% && call scripts/dev/e2e-verify.bat' >"$log_out" 2>&1
    else
      env FRONTEND_PORT="$inject_fe_port" NO_PAUSE=1 cmd.exe //c 'cd /d %SMOKE_E2E_ROOT% && call scripts\dev\e2e-verify.bat' >"$log_out" 2>&1
    fi
  else
    if [[ "$use_fwd_call" == 1 ]]; then
      env NO_PAUSE=1 cmd.exe //c 'cd /d %SMOKE_E2E_ROOT% && call scripts/dev/e2e-verify.bat' >"$log_out" 2>&1
    else
      env NO_PAUSE=1 cmd.exe //c 'cd /d %SMOKE_E2E_ROOT% && call scripts\dev\e2e-verify.bat' >"$log_out" 2>&1
    fi
  fi
  ec=$?
  return "$ec"
}

TMP_BASE="$(mktemp -d "$ROOT/tmp.contract_smoke.XXXXXX")"
MOCK_PID=""
trap 'rm -rf "$TMP_BASE"; if [[ -n "${MOCK_PID:-}" ]]; then kill "$MOCK_PID" 2>/dev/null || true; fi' EXIT

# --- 1) resolve-dev-stack-ports.ps1 ---
if have_powershell; then
# default: empty .env -> 8080 3012
mkdir -p "$TMP_BASE/d1"
: >"$TMP_BASE/d1/.env"
out="$(resolve1 "$TMP_BASE/d1")"
[[ "$out" == "8080 3012" ]] || die "default ports expected 8080 3012, got '$out'"
ok "resolve default empty .env -> 8080 3012"

# .env PORT=8765
mkdir -p "$TMP_BASE/d2"
echo "PORT=8765" >"$TMP_BASE/d2/.env"
out="$(resolve1 "$TMP_BASE/d2")"
[[ "$out" == "8765 3012" ]] || die "PORT=8765 expected 8765 3012, got '$out'"
ok "resolve .env PORT=8765"

# .env PORT=3012 -> API forced 8080 (same as B-445)
mkdir -p "$TMP_BASE/d3"
echo "PORT=3012" >"$TMP_BASE/d3/.env"
out="$(resolve1 "$TMP_BASE/d3")"
[[ "$out" == "8080 3012" ]] || die "PORT=3012 expected 8080 3012, got '$out'"
ok "resolve .env PORT=3012 -> backend 8080"

# API_PORT env override wins over .env
mkdir -p "$TMP_BASE/d4"
echo "PORT=9999" >"$TMP_BASE/d4/.env"
out="$(API_PORT=7733 resolve1 "$TMP_BASE/d4")"
[[ "$out" == "7733 3012" ]] || die "API_PORT override expected 7733 3012, got '$out'"
ok "resolve API_PORT env override"

# FRONTEND_PORT env
mkdir -p "$TMP_BASE/d5"
: >"$TMP_BASE/d5/.env"
out="$(FRONTEND_PORT=4001 resolve1 "$TMP_BASE/d5")"
[[ "$out" == "8080 4001" ]] || die "FRONTEND_PORT expected 8080 4001, got '$out'"
ok "resolve FRONTEND_PORT env override"

# illegal non-numeric API_PORT
mkdir -p "$TMP_BASE/d6"
: >"$TMP_BASE/d6/.env"
if API_PORT=abc ps_run -NoProfile -ExecutionPolicy Bypass -File "$ROOT/scripts/dev/resolve-dev-stack-ports.ps1" -RepoRoot "$TMP_BASE/d6" >/dev/null 2>&1; then
  die "resolve should fail for API_PORT=abc"
fi
ok "resolve rejects non-numeric API_PORT"

# out of range
mkdir -p "$TMP_BASE/d7"
: >"$TMP_BASE/d7/.env"
if API_PORT=999999 ps_run -NoProfile -ExecutionPolicy Bypass -File "$ROOT/scripts/dev/resolve-dev-stack-ports.ps1" -RepoRoot "$TMP_BASE/d7" >/dev/null 2>&1; then
  die "resolve should fail for API_PORT=999999"
fi
ok "resolve rejects API port out of range"

# equal API and FE ports
mkdir -p "$TMP_BASE/d8"
echo "PORT=9000" >"$TMP_BASE/d8/.env"
if FRONTEND_PORT=9000 ps_run -NoProfile -ExecutionPolicy Bypass -File "$ROOT/scripts/dev/resolve-dev-stack-ports.ps1" -RepoRoot "$TMP_BASE/d8" >/dev/null 2>&1; then
  die "resolve should fail when API and frontend ports equal"
fi
ok "resolve rejects equal backend and frontend ports"

else
  echo "smoke-dev-stack-contracts SKIP resolve-dev-stack-ports.ps1: no powershell.exe or pwsh"
fi

# --- 2) run-dev.mjs (RUN_DEV_CONTRACT_ONLY) ---
run_dev_contract() {
  env RUN_DEV_CONTRACT_ONLY=1 "$@"
}

json="$(FRONTEND_PORT=4005 run_dev_contract node "$ROOT/frontend/scripts/run-dev.mjs")"
node -e "
const o = JSON.parse(process.argv[1]);
if (String(o.devPort) !== '4005') process.exit(1);
if (o.isWin) {
  if (o.forceTurbo && o.bundle !== 'turbopack') process.exit(2);
  if (!o.forceTurbo && o.bundle !== 'webpack') process.exit(3);
} else {
  if (o.bundle !== 'turbopack') process.exit(4);
}
" "$json" || die "run-dev RUN_DEV_CONTRACT_ONLY bundle or devPort mismatch"
ok "run-dev RUN_DEV_CONTRACT_ONLY respects FRONTEND_PORT and platform bundle rule"

json="$(TRAVELTRUST_FRONTEND_PORT=8888 FRONTEND_PORT=1111 run_dev_contract node "$ROOT/frontend/scripts/run-dev.mjs")"
node -e "const o=JSON.parse(process.argv[1]); if(String(o.devPort)!=='8888') process.exit(1);" "$json" || die "TRAVELTRUST_FRONTEND_PORT should win over FRONTEND_PORT"
ok "run-dev TRAVELTRUST_FRONTEND_PORT precedence over FRONTEND_PORT"

if [[ "${OSTYPE:-}" == msys ]] || [[ "${OSTYPE:-}" == cygwin ]]; then
  json="$(run_dev_contract node "$ROOT/frontend/scripts/run-dev.mjs")"
  node -e "const o=JSON.parse(process.argv[1]); if(!o.isWin) process.exit(1); if(o.forceTurbo) process.exit(1); if(o.bundle!=='webpack') process.exit(1);" "$json" || die "run-dev Windows default should be webpack"
  ok "run-dev Windows default bundle=webpack"

  json="$(TRAVELTRUST_DEV_TURBO=1 run_dev_contract node "$ROOT/frontend/scripts/run-dev.mjs")"
  node -e "const o=JSON.parse(process.argv[1]); if(o.bundle!=='turbopack') process.exit(1); if(!o.forceTurbo) process.exit(1);" "$json" || die "run-dev TRAVELTRUST_DEV_TURBO=1 should be turbopack"
  ok "run-dev TRAVELTRUST_DEV_TURBO=1 -> turbopack"
fi

# --- 3) e2e-verify.bat ---
if have_powershell && command -v cmd.exe >/dev/null 2>&1; then
FAKE="$TMP_BASE/fake_repo"
mkdir -p "$FAKE/scripts/dev"
cp "$ROOT/scripts/dev/e2e-verify.bat" "$FAKE/scripts/dev/"
cp "$ROOT/scripts/dev/resolve-dev-stack-ports.ps1" "$FAKE/scripts/dev/"
printf "PORT=55555\nFRONTEND_PORT=55556\n" >"$FAKE/.env"

# NO_PAUSE=1: expect failure (nothing listening) and no "Press any key"
log="$TMP_BASE/e2e_fail.log"
set +e
run_e2e_verify_in_fake_root "$FAKE" "$log"
ec=$?
set -e
[[ "$ec" -ne 0 ]] || die "e2e-verify with no listeners should exit non-zero, got $ec"
grep -a -q "TravelTrust" "$log" || die "e2e-verify.bat banner missing from log (cd/call likely failed)"
if grep -a -q "Press any key" "$log"; then
  die "e2e-verify NO_PAUSE=1 should not prompt Press any key"
fi
ok "e2e-verify NO_PAUSE=1 fail path exit!=0 and no pause prompt"

# Git Bash friendly: same fake root, log to second file
log2="$TMP_BASE/e2e_fail2.log"
set +e
run_e2e_verify_in_fake_root "$FAKE" "$log2" 1
ec2=$?
set -e
[[ "$ec2" -ne 0 ]] || die "e2e-verify forward-slash call expected non-zero"
grep -a -q "TravelTrust" "$log2" || die "e2e-verify.bat banner missing from log2"
ok "e2e-verify call scripts/dev/e2e-verify.bat (forward slashes)"

# Success path: mock HTTP + docker postgres (optional)
FAKE2="$TMP_BASE/fake_ok"
mkdir -p "$FAKE2/scripts/dev"
cp "$ROOT/scripts/dev/e2e-verify.bat" "$FAKE2/scripts/dev/"
cp "$ROOT/scripts/dev/resolve-dev-stack-ports.ps1" "$FAKE2/scripts/dev/"
# resolve-dev-stack-ports.ps1 reads PORT from .env only; FRONTEND_PORT comes from process env (same as _dev_stack_ports.sh).
MOCK_PID=""
P1=""
P2=""
for _try in 1 2 3 4 5 6 7 8; do
  P1=$((40000 + RANDOM % 20000))
  P2=$((P1 + 1))
  [[ "$P2" -le 65535 ]] || continue
  printf "PORT=%s\n" "$P1" >"$FAKE2/.env"
  CONTRACT_API_PORT="$P1" CONTRACT_FE_PORT="$P2" node "$ROOT/scripts/dev/_contract_mock_stack_listen.mjs" &
  MOCK_PID=$!
  sleep 0.85
  if kill -0 "$MOCK_PID" 2>/dev/null; then
    break
  fi
  kill "$MOCK_PID" 2>/dev/null || true
  MOCK_PID=""
done
[[ -n "$MOCK_PID" ]] || die "contract mock HTTP server failed to start (retry exhausted)"

if docker ps -q -f name=traveltrust-postgres 2>/dev/null | grep -q .; then
  log3="$TMP_BASE/e2e_ok.log"
  set +e
  run_e2e_verify_in_fake_root "$FAKE2" "$log3" 0 "$P2"
  ec3=$?
  set -e
  [[ "$ec3" -eq 0 ]] || die "e2e-verify success path expected exit 0, got $ec3 (log: $log3)"
  if grep -a -q "Press any key" "$log3"; then
    die "e2e-verify NO_PAUSE=1 success should not pause"
  fi
  ok "e2e-verify success exit 0 with mock HTTP + docker postgres"
else
  echo "smoke-dev-stack-contracts SKIP e2e-verify success path: traveltrust-postgres not running"
fi

kill "$MOCK_PID" 2>/dev/null || true
MOCK_PID=""
else
  echo "smoke-dev-stack-contracts SKIP e2e-verify.bat: requires powershell.exe or pwsh, and cmd.exe"
fi

echo "smoke-dev-stack-contracts: all executed checks passed."
