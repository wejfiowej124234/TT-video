#!/usr/bin/env bash
# TTG_V8_25T_SEPOLIA_FUSION_REHEARSAL
#
# ② Sepolia fusion proof only · chain_id 11155111 · candidate TTG-25T-BPS-SEAT-FIXED-SUPPLY-CANDIDATE-V8
# Owner session auth is this rehearsal entry. Does not broadcast Ethereum Mainnet.
# Does not mutate FTB, Official www, Money Path, CI-02, or live Timelock/Governor.
# Does not deploy Migrator / does not migrate live 10M TTG.
# Does not deploy O1 SeatGate / O4 floor / vote-escrow. Do not resume the historical O1/O4 stack.
#
# Any invariant fail → STOP.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REHEARSAL_ENV="${TTG_V8_SEPOLIA_REHEARSAL_ENV:-$ROOT/scripts/dev/.env.ttg-v8-sepolia-rehearsal.local}"
EVIDENCE="$ROOT/evidence/GO_ttg_v8_sepolia_rehearsal"
JSON="$EVIDENCE/v8-sepolia-rehearsal.json"
CONTRACTS_JSON="$ROOT/contracts/out-ttg-v8/v8-sepolia-rehearsal.json"
SEPOLIA_CHAIN_ID=11155111
SCRIPT="src/ttg-meme-denom/TtgV8SepoliaGenesisRehearsal.s.sol:TtgV8SepoliaGenesisRehearsal"

fail() { echo "TTG_V8_25T_SEPOLIA_FUSION_REHEARSAL: STOP $*" >&2; exit 2; }
ok() { echo "TTG_V8_25T_SEPOLIA_FUSION_REHEARSAL: OK $*"; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    [[ -z "$val" ]] && continue
    export "$key=$val"
  done < "$f"
}

# Phase2 supplies Sepolia RPC + fallback deployer. Owner fill-in file wins
# for PRIVATE_KEY / ETHERSCAN_API_KEY / rehearsal auth. Empty values are skipped.
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
load_env_file "$ENV_FILE"
load_env_file "$REHEARSAL_ENV"

# This user query is Owner ② Sepolia rehearsal auth. Refuse unless the wrapper is used
# or the session already exported the Sepolia flag. Do not accept mainnet flags.
if ! is_truthy "${TRAVELTRUST_TTG_V8_SEPOLIA_REHEARSAL_OK:-${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}}"; then
  fail "set TRAVELTRUST_TTG_V8_SEPOLIA_REHEARSAL_OK=1 (Owner ② Sepolia rehearsal only)"
fi
if is_truthy "${TRAVELTRUST_MAINNET_BROADCAST_OK:-}"; then
  fail "refusing: TRAVELTRUST_MAINNET_BROADCAST_OK is set"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset"
if [[ "$PRIVATE_KEY" != 0x* && "$PRIVATE_KEY" != 0X* ]]; then
  export PRIVATE_KEY="0x${PRIVATE_KEY}"
fi
command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

SOLC="${SOLC_0_8_26:-}"
if [[ -z "${SOLC}" ]]; then
  if [[ -x "${HOME}/.solcx/solc-v0.8.26/solc.exe" ]]; then
    SOLC="${HOME}/.solcx/solc-v0.8.26/solc.exe"
  elif [[ -x "${HOME}/.solcx/solc-v0.8.26/solc" ]]; then
    SOLC="${HOME}/.solcx/solc-v0.8.26/solc"
  else
    fail "solc 0.8.26 not found"
  fi
fi

ok "① local TtgMemeDenom tests"
bash "$ROOT/scripts/dev/run-ttg-v8-forge.sh" || fail "local V8 tests failed"

if [[ -z "${ETHERSCAN_API_KEY:-${ETHERSCAN_KEY:-}}" ]]; then
  fail "ETHERSCAN_API_KEY unset — Exact Match required; STOP before Sepolia broadcast"
fi
export ETHERSCAN_API_KEY="${ETHERSCAN_API_KEY:-${ETHERSCAN_KEY}}"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || true)"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "refusing broadcast: chain_id=${CHAIN_ID:-unset} (required Sepolia $SEPOLIA_CHAIN_ID)"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 0)"
MIN_WEI="200000000000000000"
if [[ "$(python -c "print(int('${BAL_WEI}') < int('${MIN_WEI}'))")" == "True" ]]; then
  fail "deployer Sepolia ETH below 0.20 (have ${BAL_WEI} wei)"
fi
ok "Sepolia deployer funded"

mkdir -p "$EVIDENCE" "$ROOT/contracts/out-ttg-v8"

run_script_key() {
  local key="$1"
  local sig="$2"
  local sender
  shift 2
  sender="$(cast wallet address --private-key "$key")"
  (
    cd "$ROOT/contracts"
    FOUNDRY_PROFILE=ttg_v8_broadcast forge script "$SCRIPT" \
      --sig "$sig" \
      --rpc-url "$CHAIN_RPC_URL" \
      --private-key "$key" \
      --sender "$sender" \
      --use "$SOLC" \
      --chain-id "$SEPOLIA_CHAIN_ID" \
      "$@"
  )
}

# Multi-key steps (FR + retail, or team + retail). Do not pin --sender.
run_script_any_sender() {
  local sig="$1"
  shift
  (
    cd "$ROOT/contracts"
    FOUNDRY_PROFILE=ttg_v8_broadcast forge script "$SCRIPT" \
      --sig "$sig" \
      --rpc-url "$CHAIN_RPC_URL" \
      --private-key "$PRIVATE_KEY" \
      --use "$SOLC" \
      --chain-id "$SEPOLIA_CHAIN_ID" \
      "$@"
  )
}

run_script() {
  local sig="$1"
  shift
  run_script_key "$PRIVATE_KEY" "$sig" "$@"
}

# Throwaway rehearsal buyers (keccak of public labels — not Owner keys).
FR_PK="$(cast keccak "TTG_V8_SEPOLIA_FR_BUYER_V1")"
RETAIL_PK="$(cast keccak "TTG_V8_SEPOLIA_RETAIL_BUYER_V1")"
pin_live_json() {
  python - "$JSON" "$CONTRACTS_JSON" "$ROOT/contracts/broadcast" <<'PY'
import json, os, sys, glob
evidence, contracts_json, broadcast_root = sys.argv[1], sys.argv[2], sys.argv[3]
addr = json.load(open(evidence))
want = [
    ("TtgMemeDenomOpsWallet", "teamWallet"),
    ("TtgMemeDenomOpsWallet", "daoWallet"),
    ("TtgMemeDenomRehearsalUsdc", "usdc"),
    ("TtgMemeDenomGovernanceToken", "token"),
    ("TtgMemeDenomPrimaryMarket", "primaryMarket"),
    ("TtgMemeDenomTimelock", "timelock"),
    ("TtgMemeDenomGovernor", "governor"),
]
candidates = []
for path in glob.glob(os.path.join(broadcast_root, "**", "run-latest.json"), recursive=True):
    if "TtgV8SepoliaGenesisRehearsal" not in path.replace("\\", "/"):
        continue
    candidates.append((os.path.getmtime(path), path))
if candidates:
    path = sorted(candidates)[-1][1]
    data = json.load(open(path, encoding="utf-8"))
    creates = []
    for tx in data.get("transactions", []):
        t = str(tx.get("transactionType") or tx.get("transaction_type") or "").upper()
        if t in ("CREATE", "CREATE2"):
            creates.append(tx)
    idx = {}
    for tx in creates:
        name = tx.get("contractName") or tx.get("contract_name")
        a = tx.get("contractAddress") or tx.get("contract_address")
        if not name or not a:
            continue
        idx.setdefault(name, []).append(a)
    for name, key in want:
        pile = idx.get(name, [])
        if not pile:
            continue
        addr[key] = pile.pop(0)
    json.dump(addr, open(evidence, "w", encoding="utf-8"), indent=2)
    open(evidence, "a", encoding="utf-8").write("\n")
os.makedirs(os.path.dirname(contracts_json), exist_ok=True)
json.dump(addr, open(contracts_json, "w", encoding="utf-8"), indent=2)
open(contracts_json, "a", encoding="utf-8").write("\n")
print(addr["token"])
PY
}

wait_block() {
  local target="$1"
  local cur
  while true; do
    cur="$(cast block-number --rpc-url "$CHAIN_RPC_URL")"
    if [[ "$cur" -ge "$target" ]]; then
      return 0
    fi
    sleep 8
  done
}

json_get() {
  python -c "import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])" "$JSON" "$1"
}

json_set() {
  python - "$JSON" "$CONTRACTS_JSON" "$1" "$2" <<'PY'
import json, sys
evidence, contracts_json, key, value = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
if value.split()[0].isdigit():
    parsed = int(value.split()[0])
else:
    parsed = value
for path in (evidence, contracts_json):
    data = json.load(open(path, encoding="utf-8"))
    data[key] = parsed
    json.dump(data, open(path, "w", encoding="utf-8"), indent=2)
    open(path, "a", encoding="utf-8").write("\n")
PY
}

# Foundry writeJson during simulation stamps voteStart from the fork block, not
# the mined propose tx. Always re-read proposals(id) from Sepolia after broadcast.
sync_live_proposal_window() {
  local id_key="$1"
  local start_key="$2"
  local end_key="$3"
  local gov pid start end
  gov="$(json_get governor)"
  pid="$(json_get "$id_key")"
  read -r start end < <(
    python - "$CHAIN_RPC_URL" "$gov" "$pid" <<'PY'
import json, subprocess, sys
rpc, gov, pid = sys.argv[1], sys.argv[2], sys.argv[3]
out = subprocess.check_output(
    [
        "cast", "call", gov,
        "proposals(uint256)(address,uint256,uint256,uint256,bool,bool,bytes32,uint256,uint256,uint256)",
        pid, "--rpc-url", rpc,
    ],
    text=True,
)
nums = []
for line in out.splitlines():
    line = line.strip()
    if not line:
        continue
    token = line.split()[0]
    if token.isdigit():
        nums.append(int(token))
if len(nums) < 3:
    raise SystemExit(f"could not parse proposals({pid}): {out!r}")
# snapshot, voteStart, voteEnd
print(nums[1], nums[2])
PY
  )
  json_set "$start_key" "$start"
  json_set "$end_key" "$end"
  echo "$start"
}

wait_proposal_active() {
  local pid="$1"
  local gov st
  gov="$(json_get governor)"
  while true; do
    st="$(cast call "$gov" "state(uint256)(uint8)" "$pid" --rpc-url "$CHAIN_RPC_URL")"
    case "$st" in
      1) return 0 ;;
      0) sleep 6 ;;
      *) fail "proposal $pid state=$st (need Active=1 before vote)" ;;
    esac
  done
}

RESUME="${TTG_V8_RESUME:-}"
if [[ "$RESUME" == "assert" || "$RESUME" == "admit" || "$RESUME" == "propose" || "$RESUME" == "verify" ]]; then
  [[ -f "$JSON" ]] || fail "resume $RESUME requires $JSON"
  [[ -f "$CONTRACTS_JSON" ]] || cp "$JSON" "$CONTRACTS_JSON"
  TOKEN="$(json_get token)"
  TEAM="$(json_get teamWallet)"
  DAO="$(json_get daoWallet)"
  TOKEN_SIZE="$(cast codesize "$TOKEN" --rpc-url "$CHAIN_RPC_URL")"
  [[ "$TOKEN_SIZE" != "0" && -n "$TOKEN_SIZE" ]] || fail "resume: token has no code ($TOKEN)"
  ok "resume from $RESUME token $TOKEN"
else
  rm -f "$JSON" "$CONTRACTS_JSON"
  ok "broadcast deployCore"
  run_script "deployCore()" --broadcast --slow || fail "deployCore failed"
  [[ -f "$JSON" ]] || { [[ -f "$CONTRACTS_JSON" ]] && cp "$CONTRACTS_JSON" "$JSON"; }
  [[ -f "$JSON" ]] || fail "missing rehearsal address json"
  pin_live_json >/dev/null
  TOKEN="$(json_get token)"
  TEAM="$(json_get teamWallet)"
  DAO="$(json_get daoWallet)"
  TOKEN_SIZE="$(cast codesize "$TOKEN" --rpc-url "$CHAIN_RPC_URL")"
  [[ "$TOKEN_SIZE" != "0" && -n "$TOKEN_SIZE" ]] || fail "token has no code on Sepolia after deployCore ($TOKEN)"
  ok "token $TOKEN"

  ok "broadcast buyFrance"
  run_script_key "$FR_PK" "buyFrance()" --broadcast --slow || fail "buyFrance failed"
  ok "broadcast buyRetail (1 USDC)"
  run_script_key "$RETAIL_PK" "buyRetail()" --broadcast --slow || fail "buyRetail failed"
fi

if [[ "$RESUME" != "propose" && "$RESUME" != "verify" ]]; then
  ok "assertFusion (1 USDC min · 100,000 TTG · FR 4.5% ledger)"
  run_script "assertFusion()" --slow || fail "assertFusion failed"
  CUR="$(cast block-number --rpc-url "$CHAIN_RPC_URL")"
  wait_block "$((CUR + 2))"
fi

if [[ "$RESUME" != "verify" ]]; then
ok "proposeLive"
run_script "proposeLive()" --broadcast --slow || fail "proposeLive failed"
json_set liveProposalId "$(cast call "$(json_get governor)" "proposalCount()(uint256)" --rpc-url "$CHAIN_RPC_URL")"
sync_live_proposal_window liveProposalId liveVoteStart liveVoteEnd >/dev/null
ok "live id=$(json_get liveProposalId) voteStart=$(json_get liveVoteStart) voteEnd=$(json_get liveVoteEnd)"
wait_proposal_active "$(json_get liveProposalId)"
ok "voteFranceSequence (France 4.5% must quorum alone)"
run_script_any_sender "voteFranceSequence()" --broadcast --slow || fail "voteFranceSequence failed"

sync_live_proposal_window liveProposalId liveVoteStart liveVoteEnd >/dev/null
wait_block "$(($(json_get liveVoteEnd) + 1))"
ok "queueLive"
run_script "queueLive()" --broadcast --slow || fail "queueLive failed"
ok "waiting timelock 90s"
sleep 95
ok "executeLive"
run_script "executeLive()" --broadcast --slow || fail "executeLive failed"
fi

CTOR_ARGS="$(cast abi-encode "constructor(address,address,address)" "$TEAM" "$DAO" "$DEPLOYER")"
verify_token() {
  local verifier="$1"
  shift
  (
    cd "$ROOT/contracts"
    FOUNDRY_PROFILE=ttg_v8_broadcast forge verify-contract \
      "$TOKEN" \
      src/ttg-meme-denom/TtgMemeDenomGovernanceToken.sol:TtgMemeDenomGovernanceToken \
      --chain-id "$SEPOLIA_CHAIN_ID" \
      --compiler-version 0.8.26 \
      --optimizer-runs 200 \
      --via-ir \
      --evm-version paris \
      --constructor-args "$CTOR_ARGS" \
      --use "$SOLC" \
      --watch \
      --verifier "$verifier" \
      "$@"
  )
}

ok "Etherscan Exact Match"
verify_token etherscan || fail "Etherscan verify failed"
ok "Sourcify v2 Exact Match"
# Foundry 1.5 still talks Sourcify API v1 (brownout). Import from Etherscan via v2.
python - "$TOKEN" "$SEPOLIA_CHAIN_ID" "${ETHERSCAN_API_KEY:-${ETHERSCAN_KEY:-}}" <<'PY' || fail "Sourcify v2 Exact Match failed"
import json, sys, time, urllib.request, urllib.error
token, chain, api_key = sys.argv[1], sys.argv[2], sys.argv[3]
if not api_key:
    raise SystemExit("ETHERSCAN_API_KEY missing")

def http(method, url, body=None, timeout=60):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"} if body is not None else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

lc0, lraw0 = http("GET", f"https://sourcify.dev/server/v2/contract/{chain}/{token}")
look0 = json.loads(lraw0) if lraw0.strip().startswith("{") else {}
if look0.get("match") == "exact_match":
    print("sourcify_lookup_http", lc0)
    print("sourcify_match", "exact_match")
    raise SystemExit(0)
code, raw = http("POST", f"https://sourcify.dev/server/v2/verify/etherscan/{chain}/{token}", {"apiKey": api_key})
submit = json.loads(raw) if raw.strip().startswith("{") else {}
vid = submit.get("verificationId")
if code not in (200, 202) or not vid:
    raise SystemExit(f"sourcify submit http={code}")
print("sourcify_verificationId", vid)
st = None
for _ in range(20):
    time.sleep(3)
    sc, sraw = http("GET", f"https://sourcify.dev/server/v2/verify/{vid}")
    try:
        st = json.loads(sraw)
    except Exception:
        continue
    if st.get("isJobCompleted") is True:
        break
else:
    raise SystemExit("sourcify poll timeout")
lc, lraw = http("GET", f"https://sourcify.dev/server/v2/contract/{chain}/{token}")
look = json.loads(lraw) if lraw.strip().startswith("{") else {}
match = look.get("match") or ((st or {}).get("contract") or {}).get("match")
print("sourcify_lookup_http", lc)
print("sourcify_match", match)
if match != "exact_match":
    raise SystemExit(f"sourcify match={match}")
PY

python - "$EVIDENCE" "$TOKEN" "$DEPLOYER" <<'PY'
import json, os, sys, datetime, urllib.request, urllib.error
evidence, token, deployer = sys.argv[1], sys.argv[2], sys.argv[3]
addr = json.load(open(os.path.join(evidence, "v8-sepolia-rehearsal.json")))
look = {}
try:
    with urllib.request.urlopen(
        f"https://sourcify.dev/server/v2/contract/11155111/{token}", timeout=30
    ) as resp:
        look = json.loads(resp.read().decode())
except urllib.error.HTTPError as e:
    look = {"http": e.code, "body": e.read().decode()[:400]}
stamp = {
  "stamp": "TTG_V8_FUSION_SEPOLIA_REHEARSAL_PASS_STOP",
  "issued_at_utc": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
  "phase": "② Sepolia fusion rehearsal",
  "chain_id": 11155111,
  "candidate_id": "TTG-25T-BPS-SEAT-FIXED-SUPPLY-CANDIDATE-V8",
  "compiler_target": "0.8.26",
  "fusion_aligned": True,
  "min_purchase_usdc": "1e6",
  "quote": "1 USDC = 100000 TTG",
  "migrator_deployed": False,
  "live_10m_migrated": False,
  "official_www_baked": False,
  "ftb_mutated": False,
  "money_path_touched": False,
  "mainnet_broadcast": False,
  "tt_production_go": "NO_GO",
  "o1_genesis_seat": "NOT_IN_CUTOVER",
  "o2_kyc_bind": "NOT_IN_CUTOVER",
  "o3_in_office_lock": "NOT_IN_CUTOVER",
  "o4_quorum_non_seat_floor": "NOT_IN_CUTOVER",
  "o5_team_dao_unlock": "NOT_IN_CUTOVER",
  "screenshot_closure": {
    "wallet_unverified": "CLOSED_ON_NEW_TOKEN",
    "wallet_mint_scanner": "CLOSED_ON_NEW_TOKEN",
    "etherscan_0819_cve_banner": "CLOSED_ON_NEW_TOKEN"
  },
  "etherscan": {
    "status": "Pass - Verified",
    "url": f"https://sepolia.etherscan.io/address/{token}#code"
  },
  "sourcify": {
    "api": "v2",
    "match": look.get("match"),
    "creationMatch": look.get("creationMatch"),
    "runtimeMatch": look.get("runtimeMatch"),
    "matchId": look.get("matchId"),
    "verifiedAt": look.get("verifiedAt"),
    "url": f"https://repo.sourcify.dev/11155111/{token}"
  },
  "deployer": deployer,
  "token": token,
  "addresses": addr,
}
if stamp["sourcify"]["match"] != "exact_match":
    raise SystemExit("refusing PASS_STOP without Sourcify exact_match")
path = os.path.join(evidence, "TTG_V8_FUSION_SEPOLIA_REHEARSAL_PASS_STOP.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(stamp, f, indent=2)
    f.write("\n")
print(path)
PY

ok "TTG_V8_FUSION_SEPOLIA_REHEARSAL_PASS_STOP issued; O1/O4 NOT_IN_CUTOVER; TT_PRODUCTION_GO=NO_GO"
