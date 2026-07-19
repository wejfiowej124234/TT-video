#!/usr/bin/env bash
# Mainnet Fund-Safety Cutover Hard Gate — NEVER SKIP · fail-closed
#
#   bash scripts/gates/check-mainnet-cutover-hard-gate.sh
#
# Paper GO forbidden. Env alone cannot unlock. Missing evidence → exit 1.
# Expected today: CUTOVER_REFUSED (that is correct until axes close).
#
# SSOT: registry/mainnet-cutover-hard-gate.v1.yaml
# Runbook: docs/runbook/TT-MAINNET-CUTOVER-HARD-GATE-LATEST.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID_DIR="$ROOT/evidence/GO_production_readiness/mainnet-cutover-hard-gate"
LATEST="$EVID_DIR/MAINNET-CUTOVER-HARD-GATE-LATEST.json"
mkdir -p "$EVID_DIR"

SSOT="$ROOT/registry/mainnet-cutover-hard-gate.v1.yaml"
RELEASE_FREEZE="$ROOT/registry/mainnet-release-freeze.v1.yaml"
ESCROW_FREEZE="$ROOT/registry/escrow-final-freeze-mainnet.v1.yaml"
READINESS_REG="$ROOT/registry/web3-mainnet-production-readiness-gate.v1.yaml"
AUDIT_LATEST="$ROOT/evidence/GO_production_readiness/web3-mainnet-audit/WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json"
FORK_LATEST="$ROOT/evidence/GO_production_readiness/mainnet-fork-rehearsal/MAINNET-FORK-REHEARSAL-LATEST.json"
SAFE_EVID="$EVID_DIR/SAFE-ROLES-VERIFIED-LATEST.json"
OPS_EVID="$EVID_DIR/OPS-SURFACE-VERIFIED-LATEST.json"
R01_EVID="$EVID_DIR/R01-THIRD-PARTY-AUDIT-PASS.json"
RESIDUAL_EVID="$EVID_DIR/OWNER-RESIDUAL-RISK-SIGNOFF.json"
OWNER_AUTH_EVID="$EVID_DIR/OWNER-CUTOVER-AUTH-LATEST.json"
G6_FILE="${MAINNET_G6_FILE:-$ROOT/evidence/mainnet_launch_gate/G6_no_rollback_ack.md}"
G6_TEMPLATE="$ROOT/evidence/mainnet_launch_gate/G6_no_rollback_ack.TEMPLATE.md"
PKG_GATE="$ROOT/scripts/gates/check-mainnet-deployment-package-gate.sh"
SHADOW_ROOT="$ROOT/evidence/mainnet_shadow_launch"

OPEN_AXES=()
AXIS_DETAIL=()

fail_axis() {
  local id="$1"
  local msg="$2"
  OPEN_AXES+=("$id")
  AXIS_DETAIL+=("$id: $msg")
  echo "mainnet-cutover-hard-gate: OPEN $id — $msg" >&2
}

yaml_field() {
  # yaml_field <file> <key> — first unindented or 2-space key match (simple SSOT reads)
  local file="$1"
  local key="$2"
  [[ -f "$file" ]] || { echo ""; return 0; }
  grep -E "^${key}:" "$file" 2>/dev/null | head -n1 | sed -E "s/^${key}:[[:space:]]*//" | tr -d '"' | tr -d "'" | awk '{print $1}'
}

yaml_nested_pg() {
  # pg_p0_esc under escrow_bilateral_mainnet_policy
  local file="$1"
  [[ -f "$file" ]] || { echo ""; return 0; }
  grep -E "^[[:space:]]+pg_p0_esc:" "$file" 2>/dev/null | head -n1 | sed -E 's/.*pg_p0_esc:[[:space:]]*//' | tr -d '"' | awk '{print $1}'
}

json_field() {
  local file="$1"
  local expr="$2"
  [[ -f "$file" ]] || { echo ""; return 0; }
  node -e "
    try {
      const j=require(process.argv[1]);
      const e=process.argv[2];
      const parts=e.split('.');
      let v=j;
      for (const p of parts) {
        if (v==null) { console.log(''); process.exit(0); }
        v=v[p];
      }
      if (v===undefined||v===null) console.log('');
      else if (typeof v==='object') console.log(JSON.stringify(v));
      else console.log(String(v));
    } catch { console.log(''); }
  " "$file" "$expr" 2>/dev/null || echo ""
}

# --- AXIS-01 Mainnet Release Freeze ---
RF_STATUS="$(yaml_field "$RELEASE_FREEZE" "status")"
RF_EVID="$EVID_DIR/RELEASE-FREEZE-EVIDENCE-LATEST.json"
if [[ "$RF_STATUS" != "FROZEN" ]]; then
  fail_axis "AXIS-01" "mainnet-release-freeze status=${RF_STATUS:-MISSING} (need FROZEN via evidence --apply)"
elif [[ ! -f "$RF_EVID" ]]; then
  fail_axis "AXIS-01" "status=FROZEN but missing RELEASE-FREEZE-EVIDENCE-LATEST.json (paper freeze refused)"
else
  RFV="$(json_field "$RF_EVID" "verdict")"
  if [[ "$RFV" != "FROZEN" ]]; then
    fail_axis "AXIS-01" "registry FROZEN but evidence verdict=$RFV (mismatch)"
  fi
fi

# --- AXIS-02 Escrow final freeze ---
EF_STATUS="$(yaml_field "$ESCROW_FREEZE" "status")"
EF_EVID="$EVID_DIR/ESCROW-FINAL-FREEZE-EVIDENCE-LATEST.json"
if [[ "$EF_STATUS" != "FROZEN" ]]; then
  fail_axis "AXIS-02" "escrow-final-freeze-mainnet status=${EF_STATUS:-MISSING} (need FROZEN; requires pg_p0_esc=CLOSED)"
elif [[ ! -f "$EF_EVID" ]]; then
  fail_axis "AXIS-02" "status=FROZEN but missing ESCROW-FINAL-FREEZE-EVIDENCE-LATEST.json (paper freeze refused)"
else
  EFV="$(json_field "$EF_EVID" "verdict")"
  if [[ "$EFV" != "FROZEN" ]]; then
    fail_axis "AXIS-02" "registry FROZEN but evidence verdict=$EFV (mismatch)"
  fi
fi

# --- AXIS-03 Fork rehearsal ---
if [[ ! -f "$FORK_LATEST" ]]; then
  fail_axis "AXIS-03" "missing MAINNET-FORK-REHEARSAL-LATEST.json (run rehearse-mainnet-cutover-fork.sh)"
else
  CF="$(json_field "$FORK_LATEST" "chain_forked")"
  BC="$(json_field "$FORK_LATEST" "bytecode_checks")"
  LIVE="$(json_field "$FORK_LATEST" "broadcast_to_live_mainnet")"
  VERD="$(json_field "$FORK_LATEST" "verdict")"
  if [[ "$CF" != "1" ]]; then
    fail_axis "AXIS-03" "fork evidence chain_forked=$CF (need 1)"
  elif [[ "$BC" != "PASS" ]]; then
    fail_axis "AXIS-03" "fork bytecode_checks=$BC (need PASS)"
  elif [[ "$LIVE" == "true" ]]; then
    fail_axis "AXIS-03" "fork evidence claims live mainnet broadcast — refuse"
  elif [[ "$VERD" != "PASS" && "$VERD" != "REHEARSAL_PASS" ]]; then
    fail_axis "AXIS-03" "fork verdict=$VERD (need PASS|REHEARSAL_PASS)"
  fi
fi

# --- AXIS-04 Bytecode/address/chain_id — satisfied only when fork PASS + readiness not blocked with chain targets ---
# Partial: without fork PASS we already failed AXIS-03; also require readiness audit exists
if [[ ! -f "$AUDIT_LATEST" ]]; then
  fail_axis "AXIS-04" "missing readiness audit LATEST (bytecode/address identity not evidenced)"
fi

# --- AXIS-05 Safe / roles ---
if [[ ! -f "$SAFE_EVID" ]]; then
  fail_axis "AXIS-05" "missing SAFE-ROLES-VERIFIED-LATEST.json"
else
  SA="$(json_field "$SAFE_EVID" "safe_address")"
  TH="$(json_field "$SAFE_EVID" "threshold")"
  RM="$(json_field "$SAFE_EVID" "roles_matrix_verified")"
  if [[ -z "$SA" || "$SA" == "TBD" || "$SA" == "null" ]]; then
    fail_axis "AXIS-05" "safe_address empty/TBD"
  elif [[ -z "$TH" ]]; then
    fail_axis "AXIS-05" "threshold missing"
  elif [[ "$RM" != "true" && "$RM" != "PASS" ]]; then
    fail_axis "AXIS-05" "roles_matrix_verified=$RM (need true|PASS)"
  fi
fi

# --- AXIS-06 Broadcast protection — structural (this gate + boundary wiring) ---
# Always "present" as code; mark OPEN only if boundary file missing hard-gate call
if ! grep -q "check-mainnet-cutover-hard-gate" "$ROOT/scripts/dev/lib/web3-phase-boundary.sh" 2>/dev/null; then
  fail_axis "AXIS-06" "web3-phase-boundary.sh not wired to hard gate"
fi

# --- AXIS-07 Ops surface ---
if [[ ! -f "$OPS_EVID" ]]; then
  fail_axis "AXIS-07" "missing OPS-SURFACE-VERIFIED-LATEST.json"
else
  for k in secrets_verified infra_verified dns_verified monitoring_verified rollback_verified; do
    v="$(json_field "$OPS_EVID" "$k")"
    if [[ "$v" != "true" && "$v" != "PASS" ]]; then
      fail_axis "AXIS-07" "$k=$v (need true|PASS)"
      break
    fi
  done
fi

# --- AXIS-08 R-01 or residual ---
R01_OK=0
if [[ -f "$R01_EVID" ]]; then
  RV="$(json_field "$R01_EVID" "verdict")"
  if [[ "$RV" == "PASS" || "$RV" == "R01_PASS" ]]; then
    R01_OK=1
  fi
fi
if [[ "$R01_OK" -eq 0 && -f "$RESIDUAL_EVID" ]]; then
  SV="$(json_field "$RESIDUAL_EVID" "verdict")"
  SIG="$(json_field "$RESIDUAL_EVID" "owner_signed")"
  if [[ ( "$SV" == "PASS" || "$SV" == "OWNER_RESIDUAL_ACCEPTED" ) && ( "$SIG" == "true" || "$SIG" == "1" ) ]]; then
    R01_OK=1
  fi
fi
if [[ "$R01_OK" -eq 0 ]]; then
  fail_axis "AXIS-08" "need R01-THIRD-PARTY-AUDIT-PASS.json OR OWNER-RESIDUAL-RISK-SIGNOFF.json (signed)"
fi

# --- AXIS-09 Readiness P0=0 ---
if [[ ! -f "$AUDIT_LATEST" ]]; then
  fail_axis "AXIS-09" "missing WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json"
else
  P0="$(json_field "$AUDIT_LATEST" "p0")"
  AV="$(json_field "$AUDIT_LATEST" "verdict")"
  if [[ -z "$P0" ]]; then
    # try nested
    P0="$(json_field "$AUDIT_LATEST" "blockers.p0")"
  fi
  # Also accept top-level from audit summary shape
  if [[ -z "$P0" || "$P0" == "null" ]]; then
    P0="$(node -e "
      const j=require(process.argv[1]);
      if (typeof j.p0==='number') console.log(j.p0);
      else if (j.summary&&typeof j.summary.p0==='number') console.log(j.summary.p0);
      else if (Array.isArray(j.blockers)) console.log(j.blockers.filter(b=>b.priority==='P0'||b.priority==='p0').length);
      else console.log('unknown');
    " "$AUDIT_LATEST" 2>/dev/null || echo "unknown")"
  fi
  if [[ "$P0" != "0" || "$AV" == "WEB3_MAINNET_PRODUCTION_BLOCKED" ]]; then
    fail_axis "AXIS-09" "readiness p0=$P0 verdict=$AV (need p0=0 and not BLOCKED)"
  fi
fi

# --- AXIS-10 PG-P0-ESC ---
PG="$(yaml_nested_pg "$READINESS_REG")"
if [[ "$PG" != "CLOSED" ]]; then
  fail_axis "AXIS-10" "pg_p0_esc=$PG (need CLOSED)"
fi

# --- AXIS-11 Deployment package ---
if [[ -f "$PKG_GATE" ]]; then
  if ! bash "$PKG_GATE" >/dev/null 2>&1; then
    fail_axis "AXIS-11" "mainnet deployment package gate FAIL (RULE-DEPLOY-001)"
  fi
else
  fail_axis "AXIS-11" "package gate script missing"
fi

# --- AXIS-12 Shadow Launch GO ---
SHADOW_OK=0
SHADOW_RUN=""
if [[ -d "$SHADOW_ROOT" ]]; then
  # Prefer newest run_* that is not TEMPLATE
  while IFS= read -r -d '' d; do
    base="$(basename "$d")"
    [[ "$base" == *TEMPLATE* ]] && continue
    sj="$d/shadow_go_no_go.json"
    [[ -f "$sj" ]] || continue
    verd="$(json_field "$sj" "shadow_launch_verdict")"
    cid="$(json_field "$sj" "chain_id")"
    [[ -z "$cid" ]] && cid="$(json_field "$sj" "deployment_chain_id")"
    if [[ "$verd" == "GO" && ( "$cid" == "1" || "$cid" == "\"1\"" ) ]]; then
      miss=0
      for f in indexer_tick.json indexer_replay.json indexer_reconcile.json overview.json; do
        [[ -f "$d/$f" ]] || miss=1
      done
      if [[ "$miss" -eq 0 ]]; then
        SHADOW_OK=1
        SHADOW_RUN="$d"
        break
      fi
    fi
  done < <(find "$SHADOW_ROOT" -maxdepth 1 -type d -name 'run_*' -print0 2>/dev/null | sort -z -r)
fi
if [[ "$SHADOW_OK" -eq 0 ]]; then
  fail_axis "AXIS-12" "no Shadow run with GO + chain_id=1 + four JSON (reject TEMPLATE/NO_GO)"
fi

# --- AXIS-13 G6 ack ---
if [[ ! -f "$G6_FILE" ]]; then
  fail_axis "AXIS-13" "missing G6_no_rollback_ack.md"
elif [[ -f "$G6_TEMPLATE" ]] && cmp -s "$G6_FILE" "$G6_TEMPLATE" 2>/dev/null; then
  fail_axis "AXIS-13" "G6 ack is still the template"
else
  if ! grep -qiE 'ack|acknowledge|no.?rollback|不可回滚|signed|签收' "$G6_FILE" 2>/dev/null; then
    fail_axis "AXIS-13" "G6 file present but no ack language found"
  fi
  if grep -qiE 'TODO|TEMPLATE|replace.me|TBD_OWNER' "$G6_FILE" 2>/dev/null; then
    fail_axis "AXIS-13" "G6 ack still contains TODO/TEMPLATE markers"
  fi
fi

# --- AXIS-14 Owner auth ---
AUTH_REG="$(yaml_field "$READINESS_REG" "mainnet_cutover_authorized")"
AUTH_MSG=""
if [[ "$AUTH_REG" != "true" ]]; then
  AUTH_MSG="registry mainnet_cutover_authorized=$AUTH_REG"
fi
if [[ ! -f "$OWNER_AUTH_EVID" ]]; then
  AUTH_MSG="${AUTH_MSG:+$AUTH_MSG; }missing OWNER-CUTOVER-AUTH-LATEST.json"
else
  OA="$(json_field "$OWNER_AUTH_EVID" "authorized")"
  if [[ "$OA" != "true" && "$OA" != "1" ]]; then
    AUTH_MSG="${AUTH_MSG:+$AUTH_MSG; }OWNER-CUTOVER-AUTH authorized=$OA"
  fi
fi
if [[ -n "$AUTH_MSG" ]]; then
  fail_axis "AXIS-14" "$AUTH_MSG (need registry true + signed auth JSON)"
fi

# --- Verdict ---
OPEN_COUNT="${#OPEN_AXES[@]}"
VERDICT="REFUSED"
EXIT_CODE=1
MSG="CUTOVER_REFUSED"

if [[ "$OPEN_COUNT" -eq 0 ]]; then
  VERDICT="AUTHORIZED_FOR_WAVE"
  # Full GO requires explicit flag in owner auth
  FG="$(json_field "$OWNER_AUTH_EVID" "full_go")"
  if [[ "$FG" == "true" || "$FG" == "1" ]]; then
    VERDICT="FULL_GO"
  fi
  EXIT_CODE=0
  MSG="CUTOVER_HARD_GATE_PASS"
elif [[ "$OPEN_COUNT" -lt 14 ]]; then
  # Some prep artifacts may exist
  if [[ -f "$RELEASE_FREEZE" && -f "$ESCROW_FREEZE" ]]; then
    VERDICT="EVIDENCE_INCOMPLETE"
  fi
fi

# Registry SSOT current_verdict for display (do not auto-mutate registry here)
SSOT_VERDICT="$(yaml_field "$SSOT" "current_verdict")"

# Write LATEST JSON
OPEN_JSON="$(node -e "
  const axes=process.argv[1].split('\\n').filter(Boolean);
  const detail=process.argv[2].split('\\n').filter(Boolean);
  console.log(JSON.stringify({open_axes:axes, details:detail}));
" "$(printf '%s\n' "${OPEN_AXES[@]:-}")" "$(printf '%s\n' "${AXIS_DETAIL[@]:-}")")"

node -e "
const fs=require('fs');
const path=process.argv[1];
const verdict=process.argv[2];
const msg=process.argv[3];
const openCount=Number(process.argv[4]);
const shadowRun=process.argv[5]||null;
const ssotVerdict=process.argv[6];
const openBlob=JSON.parse(process.argv[7]);
const out={
  schema:'traveltrust.mainnet_cutover_hard_gate_evidence.v1',
  machine_key:'TT_MAINNET_CUTOVER_HARD_GATE',
  fund_safety_standard:'REAL_ETH_MAINNET',
  paper_go_forbidden:true,
  never_skip:true,
  generated_utc:new Date().toISOString(),
  verdict,
  message:msg,
  open_axis_count:openCount,
  open_axes:openBlob.open_axes,
  axis_details:openBlob.details,
  registry_ssot_verdict:ssotVerdict,
  shadow_run:shadowRun,
  note:'exit 1 REFUSED is correct until all axes close — do not treat as broken gate',
  broadcast_authorized:false,
  user_funds_enabled:false
};
if (verdict==='AUTHORIZED_FOR_WAVE'||verdict==='FULL_GO') {
  out.broadcast_authorized=(verdict==='FULL_GO'||verdict==='AUTHORIZED_FOR_WAVE');
}
fs.writeFileSync(path, JSON.stringify(out,null,2)+'\\n');
" "$LATEST" "$VERDICT" "$MSG" "$OPEN_COUNT" "${SHADOW_RUN:-}" "$SSOT_VERDICT" "$OPEN_JSON"

echo "mainnet-cutover-hard-gate: $MSG verdict=$VERDICT open_axes=$OPEN_COUNT" >&2
echo "mainnet-cutover-hard-gate: evidence $LATEST" >&2

if [[ "$EXIT_CODE" -ne 0 ]]; then
  echo "mainnet-cutover-hard-gate: CUTOVER_REFUSED — real ETH fund safety bar not met" >&2
  exit 1
fi

echo "mainnet-cutover-hard-gate: PASS ($VERDICT)"
exit 0
