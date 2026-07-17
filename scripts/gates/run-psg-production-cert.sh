#!/usr/bin/env bash
# PSG Phase B · Final gate TT_PSG_PRODUCTION_CERT
# Default: structural + readonly domain probes → cannot claim PASS.
# Owner destructive full suite:
#   PSG_ALLOW_DESTRUCTIVE_CERT=1 PSG_ALLOW_BOOTSTRAP_WRITE=1 \
#     STAGING_API_BASE=https://tt-api-staging.fly.dev \
#     STAGING_WEB_BASE=https://tt-web-staging.fly.dev \
#     bash scripts/gates/run-psg-production-cert.sh
#
# Fail-fast. Never claims Production GO. Never unfreezes PF Step 5.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
WEB="${WEB%/}"
EVID="$ROOT/evidence/GO_psg_foundation/production_cert"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ALLOW_DEST="${PSG_ALLOW_DESTRUCTIVE_CERT:-0}"
REG="$ROOT/registry/psg-phase-b-production-cert.v1.yaml"
DOC="$ROOT/docs/runbook/TT-PSG-PHASE-B-PUBLIC-SURFACE-CERTIFICATION.md"

fail() { echo "TT_PSG_PRODUCTION_CERT: FAIL $*" >&2; exit 2; }
ok() { echo "TT_PSG_PRODUCTION_CERT: OK $*"; }
note() { echo "TT_PSG_PRODUCTION_CERT: NOTE $*"; }

[[ -f "$REG" ]] || fail "missing registry/psg-phase-b-production-cert.v1.yaml"
[[ -f "$DOC" ]] || fail "missing TT-PSG-PHASE-B-PUBLIC-SURFACE-CERTIFICATION.md"
for k in "B1 Public Data" "B2 CMS Governance" "B3 COS Governance" "B4 Runtime Governance" "B5 Public Surface" "TT_PSG_PRODUCTION_CERT" "TT_PSG_SSOT_DRIFT" "TT_PSG_REPRODUCIBLE_BUILD" "TT_PSG_ENVIRONMENT_ALIGNMENT" "Machine Replacement" "Double Bootstrap" "Clean Deploy" "Cache Flush" "Runtime Restart"; do
  grep -q "$k" "$DOC" || fail "Phase B SSOT missing: $k"
done
ok "Phase B five-domain + admission trio + destructive + final-gate SSOT present"

export STAGING_API_BASE="$API" API_BASE="$API" API="$API" STAGING_WEB_BASE="$WEB"

# --- Admission trio (must PASS for PRODUCTION_CERT PASS) ---
echo "=== SSOT Drift ==="
node "$ROOT/scripts/gates/check-psg-ssot-drift.cjs" || fail "TT_PSG_SSOT_DRIFT"
SSOT_STATUS=PASS
ok "SSOT Drift"

echo "=== Reproducible Build ==="
set +e
node "$ROOT/scripts/gates/check-psg-reproducible-build.cjs"
REPRO_EC=$?
set -e
REPRO_STATUS="$(node -e "const j=require('./evidence/GO_psg_foundation/production_cert/PSG-REPRODUCIBLE-BUILD-LATEST.json');process.stdout.write(j.status||'UNKNOWN')")"
[[ "$REPRO_STATUS" == "PASS" ]] || note "Reproducible Build status=$REPRO_STATUS (need ×3 deploy evidence for PASS)"
[[ "$REPRO_STATUS" == "PASS" || "$REPRO_STATUS" == "WAITING_OWNER" ]] || fail "TT_PSG_REPRODUCIBLE_BUILD hard fail"

echo "=== Environment Alignment ==="
set +e
node "$ROOT/scripts/gates/check-psg-environment-alignment.cjs"
ENV_EC=$?
set -e
ENV_STATUS="$(node -e "const j=require('./evidence/GO_psg_foundation/production_cert/PSG-ENVIRONMENT-ALIGNMENT-LATEST.json');process.stdout.write(j.status||'UNKNOWN')")"
[[ "$ENV_STATUS" == "PASS" ]] || note "Environment Alignment status=$ENV_STATUS (set PRODUCTION_CANDIDATE_API_BASE for PASS)"
[[ "$ENV_STATUS" == "PASS" || "$ENV_STATUS" == "WAITING_PROD_CANDIDATE" ]] || fail "TT_PSG_ENVIRONMENT_ALIGNMENT hard fail"

# --- B1 Public Data ---
echo "=== B1 Public Data ==="
node "$ROOT/scripts/gates/check-psg-public-data-isolation.cjs" || fail "B1 public data"
ok "B1"

# --- B2 CMS ---
echo "=== B2 CMS Governance ==="
node "$ROOT/scripts/gates/check-psg-cms-lifecycle.cjs" || fail "B2 cms"
ok "B2"

# --- B3 COS ---
echo "=== B3 COS Governance ==="
TT_PSG_P0_4_STRICT_MIN_PROBE="${TT_PSG_P0_4_STRICT_MIN_PROBE:-1}" \
  node "$ROOT/scripts/gates/check-psg-cos-reference-integrity.cjs" || fail "B3 cos"
ok "B3"

# --- B5 Public Surface Matrix (force staging) ---
echo "=== B5 Public Surface Matrix ==="
PSG_FORCE_STAGING_MATRIX=1 \
  node "$ROOT/scripts/gates/check-psg-public-surface-matrix.cjs" || fail "B5 matrix"
ok "B5"

# --- B4 Runtime (readonly unless destructive allowed) ---
echo "=== B4 Runtime Governance ==="
if [[ "$ALLOW_DEST" == "1" ]]; then
  PSG_SKIP_BOOTSTRAP=0 PSG_ALLOW_BOOTSTRAP_WRITE="${PSG_ALLOW_BOOTSTRAP_WRITE:-1}" \
    bash "$ROOT/scripts/gates/run-psg-runtime-certification.sh" || fail "B4 runtime cert"
  ok "B4 full runtime cert"
else
  PSG_SKIP_BOOTSTRAP=1 PSG_FORCE_STAGING_MATRIX=1 \
    bash "$ROOT/scripts/gates/run-psg-runtime-certification.sh" || fail "B4 runtime readonly"
  note "B4 readonly path — destructive suite required for PRODUCTION_CERT PASS"
fi

DEST_STATUS="WAITING_OWNER"
DEST_RESULTS=()

run_dest() {
  local id="$1" script="$2"
  echo "=== DESTRUCTIVE: $id ==="
  if [[ ! -f "$ROOT/$script" ]]; then
    fail "missing destructive script $script"
  fi
  if [[ "$ALLOW_DEST" != "1" ]]; then
    note "$id SKIPPED (set PSG_ALLOW_DESTRUCTIVE_CERT=1)"
    DEST_RESULTS+=("$id:SKIPPED")
    return 0
  fi
  node "$ROOT/$script" || fail "destructive $id"
  DEST_RESULTS+=("$id:PASS")
  ok "destructive $id"
}

if [[ "$ALLOW_DEST" == "1" ]]; then
  export PSG_ALLOW_DESTRUCTIVE_REDEPLOY=1
  export PSG_ALLOW_BOOTSTRAP_WRITE="${PSG_ALLOW_BOOTSTRAP_WRITE:-1}"
fi

run_dest media_destructive scripts/dev/run-psg-p0-4-destructive-media-cert.cjs
run_dest machine_replacement scripts/dev/run-psg-destructive-machine-replacement.cjs
run_dest double_bootstrap scripts/dev/run-psg-destructive-double-bootstrap.cjs
# Clean deploy: verify-only dual snapshot unless Owner sets PSG_ALLOW_CLEAN_DEPLOY=1 for real sequence
if [[ "$ALLOW_DEST" == "1" && "${PSG_ALLOW_CLEAN_DEPLOY:-0}" != "1" ]]; then
  export PSG_CLEAN_DEPLOY_VERIFY_ONLY=1
fi
run_dest clean_deploy scripts/dev/run-psg-destructive-clean-deploy.cjs
run_dest cache_flush scripts/dev/run-psg-destructive-cache-flush.cjs
run_dest runtime_restart scripts/dev/run-psg-destructive-runtime-restart.cjs

if [[ "$ALLOW_DEST" == "1" ]]; then
  DEST_STATUS="PASS"
else
  DEST_STATUS="WAITING_OWNER"
fi

DEST_JOIN=$(IFS=,; echo "${DEST_RESULTS[*]-}")

# Emit evidence (desensitized) — PASS only if admission trio + domains + destructive all green
node -e "
const fs=require('fs');
const allow=process.argv[1]==='1';
const destStatus=process.argv[2];
const stamp=process.argv[3];
const api=process.argv[4];
const destItems=process.argv[5].split(',').filter(Boolean);
const ssot=process.argv[6];
const repro=process.argv[7];
const envA=process.argv[8];
const admissionOk = ssot==='PASS' && repro==='PASS' && envA==='PASS';
const destOk = allow && destStatus==='PASS';
const status = admissionOk && destOk ? 'PASS' : 'FAIL_OR_WAITING';
const report={
  schema:'traveltrust.psg_production_cert.v1',
  machine_key:'TT_PSG_PRODUCTION_CERT',
  stamp_utc:stamp,
  api,
  production_go:'NO_GO',
  pf_step5:'FROZEN',
  domains:{B1:'PASS',B2:'PASS',B3:'PASS',B4:allow?'PASS':'PASS_READONLY_PARTIAL',B5:'PASS'},
  admission:{
    TT_PSG_SSOT_DRIFT: ssot,
    TT_PSG_REPRODUCIBLE_BUILD: repro,
    TT_PSG_ENVIRONMENT_ALIGNMENT: envA,
  },
  destructive_suite:{status:destStatus,items:destItems},
  credentials_in_report:false,
  status,
  note: status==='PASS'
    ? 'PRODUCTION_CERT PASS — PF still needs P0③⑤ CLOSED + full unfreeze formula'
    : 'Not PASS until SSOT+Repro+EnvAlignment+destructive all PASS',
};
const p=process.argv[9];
fs.writeFileSync(p, JSON.stringify(report,null,2)+'\n');
if (report.status!=='PASS') {
  console.log('TT_PSG_PRODUCTION_CERT: FAIL (waiting admission trio and/or destructive)');
  process.exit(2);
}
console.log('TT_PSG_PRODUCTION_CERT: PASS');
" "$ALLOW_DEST" "$DEST_STATUS" "$STAMP" "$API" "$DEST_JOIN" "$SSOT_STATUS" "$REPRO_STATUS" "$ENV_STATUS" \
  "$EVID/PSG-PRODUCTION-CERT-LATEST.json"
