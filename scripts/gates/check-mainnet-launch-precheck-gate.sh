#!/usr/bin/env bash
# TT-MAINNET · G0～G6 + SL 机读门禁（[`docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md`](../../docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md) §0）
#
# 启用（任一）：
#   **`MAINNET_LAUNCH_PRECHECK=1`** **且** **`CHAIN_ID=1`**（本地 / 运维显式），**或**
#   **`TT_MAINNET_GATE_ENFORCE=1`** **且** **`CHAIN_ID=1`**（CI / 主网部署流水线：不依赖 MAINNET_LAUNCH_PRECHECK）
# 跳过：以上均未满足 → **exit 0**（非主网流水线不挡普通 PR）
#
# 依赖：**`cast`**、**`forge`**（G1 bytecode）、**`jq`**（G5、SL）；**`CHAIN_RPC_URL`** 与七键地址（`.env` 或环境）
#
# 环境（常用）：
#   TT_MAINNET_GATE_ENFORCE    设为 **1** 且 **CHAIN_ID=1** 时执行门禁（**CI** **默认**；**与** **MAINNET_LAUNCH_PRECHECK** **二选一或并列**）
#   MAINNET_EVIDENCE_RUN_DIR   G0/G5/SL 证据目录（须含 README.md、*.json、**`shadow_go_no_go.json`** **`shadow_launch_verdict":"GO"`**）
#   MAINNET_G2_EVIDENCE_JSON   G2 人工/脱敏环境 **`indexer` 全路径** 通过之 JSON（**`jq -e '.g2_gate=="GO"'`**）
#   MAINNET_G6_FILE            G6 签收文件（默认 `evidence/mainnet_launch_gate/G6_no_rollback_ack.md`）
#   MAINNET_MIN_TIMELOCK_DELAY_SECONDS  G3 下限（默认 **86400**）
#   MAINNET_SKIP_G1_BYTECODE   设为 `1` 时仅跑 **runtime-chain-ssot**（**不推荐生产**）

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

die() { echo "mainnet-launch-precheck: FAIL — $*" >&2; exit 1; }
ok() { echo "mainnet-launch-precheck: OK — $*"; }

RUN_GATE=0
if [[ "${MAINNET_LAUNCH_PRECHECK:-0}" == "1" ]]; then RUN_GATE=1; fi
if [[ "${CHAIN_ID:-}" == "1" && "${TT_MAINNET_GATE_ENFORCE:-0}" == "1" ]]; then RUN_GATE=1; fi

if [[ "$RUN_GATE" != "1" ]]; then
  echo "mainnet-launch-precheck: SKIP (set CHAIN_ID=1 and TT_MAINNET_GATE_ENFORCE=1 for CI, or MAINNET_LAUNCH_PRECHECK=1 for local)"
  exit 0
fi

if [[ "${CHAIN_ID:-}" != "1" ]]; then
  die "TT-MAINNET gate requires CHAIN_ID=1 (got CHAIN_ID=${CHAIN_ID:-empty})"
fi

if [[ -f "${ROOT}/.env" ]] && [[ "${MAINNET_GATE_NO_AUTOLOAD_ENV:-0}" != "1" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

RPC="${CHAIN_RPC_URL:-}"
TL="${TIMELOCK_ADDRESS:-}"
GOV="${GOVERNOR_ADDRESS:-}"
FR="${FEE_ROUTER_ADDRESS:-}"
EF="${ESCROW_FACTORY_ADDRESS:-}"

[[ -n "$RPC" ]] || die "CHAIN_RPC_URL required for mainnet gate"
[[ -n "$TL" ]] || die "TIMELOCK_ADDRESS required"
[[ -n "$GOV" ]] || die "GOVERNOR_ADDRESS required"
[[ -n "$FR" ]] || die "FEE_ROUTER_ADDRESS required"
[[ -n "$EF" ]] || die "ESCROW_FACTORY_ADDRESS required"

# --- G1a: runtime chain SSOT ---
ok "G1a: runtime-chain-ssot-cast-verify"
export RUNTIME_SSOT_EXTENDED=1
if ! bash "${ROOT}/scripts/ops/runtime-chain-ssot-cast-verify.sh"; then
  die "G1a: runtime-chain-ssot-cast-verify failed"
fi

# --- G1b: bytecode keccak vs forge artifact (deployedBytecode) ---
if [[ "${MAINNET_SKIP_G1_BYTECODE:-0}" == "1" ]]; then
  echo "mainnet-launch-precheck: WARN G1b skipped (MAINNET_SKIP_G1_BYTECODE=1) — not for production deploy"
else
  if ! command -v forge >/dev/null 2>&1; then
    die "G1b: forge not in PATH (install Foundry)"
  fi
  (cd "${ROOT}/contracts" && forge build -q) || die "G1b: forge build failed"

  keccak_hex() {
    local x="$1"
    x="${x#0x}"
    x=$(echo "$x" | tr -d '\n\r \t' | tr '[:upper:]' '[:lower:]')
    cast keccak "0x${x#0x}"
  }

  check_bytecode_pair() {
    local label="$1"
    local addr="$2"
    local inspect_path="$3"
    local onchain
    if ! onchain="$(cast code "$addr" --rpc-url "$RPC" 2>/dev/null)"; then
      die "G1b: cast code failed for $label ($addr)"
    fi
    local local_hex
    if ! local_hex="$(cd "${ROOT}/contracts" && forge inspect "$inspect_path" deployedBytecode 2>/dev/null)"; then
      local_hex="$(cd "${ROOT}/contracts" && forge inspect "$inspect_path" bytecode 2>/dev/null)" || die "G1b: forge inspect failed for $label ($inspect_path)"
    fi
    local h1 h2
    h1=$(keccak_hex "$onchain")
    h2=$(keccak_hex "$local_hex")
    if [[ "$h1" != "$h2" ]]; then
      echo "G1b: bytecode keccak mismatch $label" >&2
      echo "  on_chain_keccak=$h1" >&2
      echo "  local_artifact_keccak=$h2" >&2
      die "G1b: $label bytecode identity failed (see TT-MAINNET §1.3)"
    fi
    ok "G1b: $label bytecode keccak matches forge artifact"
  }

  check_bytecode_pair "GovernanceTimelock" "$TL" "src/GovernanceTimelock.sol:GovernanceTimelock"
  check_bytecode_pair "TravelTrustGovernor" "$GOV" "src/TravelTrustGovernor.sol:TravelTrustGovernor"
  check_bytecode_pair "FeeRouter" "$FR" "src/FeeRouter.sol:FeeRouter"
  check_bytecode_pair "EscrowFactory" "$EF" "src/EscrowFactory.sol:EscrowFactory"
fi

# --- G3: Timelock delay >= MIN (GovernanceTimelock: public immutable delay → delay()) ---
MIN_D="${MAINNET_MIN_TIMELOCK_DELAY_SECONDS:-86400}"
DELAY_RAW=""
if ! DELAY_RAW="$(cast call "$TL" "delay()(uint256)" --rpc-url "$RPC" 2>/dev/null | head -1)"; then
  die "G3: cast timelock.delay() failed"
fi
# cast may return decimal or hex
if [[ "$DELAY_RAW" =~ ^0x ]]; then
  DELAY_DEC=$((16#${DELAY_RAW#0x}))
else
  DELAY_DEC="${DELAY_RAW//[^0-9]/}"
fi
if [[ -z "${DELAY_DEC:-}" ]] || [[ ! "$DELAY_DEC" =~ ^[0-9]+$ ]]; then
  die "G3: could not parse delay (got $DELAY_RAW)"
fi
if (( DELAY_DEC < MIN_D )); then
  die "G3: timelock delay $DELAY_DEC < MIN $MIN_D seconds (TT-MAINNET §3.2)"
fi
ok "G3: timelock delay=$DELAY_DEC >= $MIN_D"

# --- G4: Trigger Matrix doc ---
TM="${ROOT}/ops/mainnet-trigger-matrix.v1.md"
[[ -f "$TM" ]] || die "G4: missing ops/mainnet-trigger-matrix.v1.md (TT-MAINNET §4.2)"
[[ -s "$TM" ]] || die "G4: trigger matrix file empty"
ok "G4: ops/mainnet-trigger-matrix.v1.md present"

# --- G0 + G5: evidence dir + chain_id in JSON ---
EV="${MAINNET_EVIDENCE_RUN_DIR:-}"
if [[ -z "$EV" ]]; then
  die "G0/G5: set MAINNET_EVIDENCE_RUN_DIR to mainnet evidence run_<UTC>/ (TT-MAINNET §5)"
fi
EV="${EV//\\//}"
[[ -d "$EV" ]] || die "G0: MAINNET_EVIDENCE_RUN_DIR not a directory: $EV"
[[ -f "${EV}/README.md" ]] || die "G0: missing ${EV}/README.md"
if ! grep -qE 'deployment_chain_id:\s*1|chain_id["'\'']?\s*:\s*1|"chain_id"\s*:\s*1' "${EV}/README.md"; then
  die "G0: README must state deployment_chain_id / chain_id 1 (TT-MAINNET §5.2)"
fi
ok "G0: evidence README + chain_id hint present"

if ! command -v jq >/dev/null 2>&1; then
  die "G5: jq required for JSON checks"
fi

# 根级 chain_id / deployment_chain_id，或 overview 嵌套（admin overview 落盘）
extract_evidence_chain_id() {
  jq -r '
    def num: if type == "string" then (try tonumber catch .) else . end;
    (
      .chain_id // .deployment_chain_id // .overview.chain_id // empty
    ) | if . == null or . == "" then empty else num end | tostring
  ' "$1"
}

for jf in tx_hashes.json indexer_tick.json reconcile.json overview.json; do
  p="${EV}/${jf}"
  [[ -f "$p" ]] || die "G5: missing $p"
  cid="$(extract_evidence_chain_id "$p" || true)"
  if [[ "$cid" != "1" ]]; then
    die "G5: $jf must expose chain_id / deployment_chain_id / overview.chain_id == 1 (got '${cid:-empty}')"
  fi
done
ok "G5: evidence JSON chain_id==1"

# --- SL: §0 Shadow Launch — shadow_go_no_go.json in same evidence run dir (TT-MAINNET §0 SL) ---
SLJ="${EV}/shadow_go_no_go.json"
[[ -f "$SLJ" ]] || die "SL: missing ${SLJ} — add Shadow Launch package under MAINNET_EVIDENCE_RUN_DIR (TT-MAINNET §0 SL)"
if ! jq -e '((.deployment_chain_id // .chain_id) == 1)' "$SLJ" >/dev/null 2>&1; then
  die "SL: ${SLJ} must have deployment_chain_id or chain_id == 1"
fi
if ! jq -e '.shadow_launch_verdict == "GO"' "$SLJ" >/dev/null 2>&1; then
  die "SL: ${SLJ} must have .shadow_launch_verdict == \"GO\" (got $(jq -r '.shadow_launch_verdict // empty' "$SLJ"))"
fi
ok "SL: shadow_launch_verdict==GO in $SLJ"

# --- G2: indexer path attestation (offline smoke JSON) ---
G2J="${MAINNET_G2_EVIDENCE_JSON:-}"
if [[ -z "$G2J" ]]; then
  die "G2: set MAINNET_G2_EVIDENCE_JSON to JSON with {\"g2_gate\":\"GO\",...} from staging/mainnet smoke (TT-MAINNET §2.2)"
fi
[[ -f "$G2J" ]] || die "G2: MAINNET_G2_EVIDENCE_JSON not a file: $G2J"
if ! jq -e '.g2_gate == "GO"' "$G2J" >/dev/null 2>&1; then
  die "G2: $G2J must contain .g2_gate == \"GO\""
fi
ok "G2: g2_gate==GO in $G2J"

# --- G6: signoff file ---
G6F="${MAINNET_G6_FILE:-${ROOT}/evidence/mainnet_launch_gate/G6_no_rollback_ack.md}"
[[ -f "$G6F" ]] || die "G6: missing signoff file $G6F (copy from G6_no_rollback_ack.template.md and fill)"
case "$G6F" in
  *template*) die "G6: use real G6_no_rollback_ack.md — template path not accepted" ;;
esac
if grep -q '模板' "$G6F" 2>/dev/null; then
  die "G6: replace template boilerplate with signed ack (TT-MAINNET §6.2)"
fi
if ! grep -qiE 'pause|暂停' "$G6F" || ! grep -qiE '治理|governance|补偿|compensation' "$G6F"; then
  die "G6: signoff file must acknowledge pause + governance/compensation (TT-MAINNET §6.2)"
fi
ok "G6: no-rollback signoff present"

echo "mainnet-launch-precheck: ALL GATES GO (G0–G6 + SL)"
exit 0
