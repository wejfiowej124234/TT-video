#!/usr/bin/env bash
# Market Media DDG Remediation · 数据治理收尾（非 OCS · 非 G3）
#
#   bash scripts/dev/run-market-media-ddg-remediation.sh
#
# Goal: migrate legacy listing covers → OCS/CDN paths, then strict full-site DDG PASS.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${MARKET_MEDIA_DDG_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
EVID="${MARKET_MEDIA_DDG_EVIDENCE_DIR:-$ROOT/evidence/GO_market_media_ddg_remediation/$STAMP}"

export API_BASE API="$API_BASE"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1"

OCS_STATE="${OCS_STATE:-}"
if [[ -z "$OCS_STATE" ]]; then
  OCS_STATE="$(node -e "const {findLatestOcsStatePath}=require('$ROOT/scripts/dev/lib/smoke-data-heuristics.cjs'); console.log(findLatestOcsStatePath('$ROOT')||'');")"
fi

mkdir -p "$EVID"
git rev-parse HEAD >"$EVID/local-git-sha.txt"
echo "staging_api=$API_BASE" >"$EVID/staging-target.txt"
echo "ocs_state=$OCS_STATE" >>"$EVID/staging-target.txt"
echo "TT_MARKET_MEDIA_DDG: IMPLEMENTING" >"$EVID/STATUS.txt"

echo "== Market Media DDG · listing cover migration (PLANNED implementation) =="
MIG_RC=0
if [[ -f "$ROOT/scripts/dev/remediate-market-listing-covers-staging.cjs" ]]; then
  STATE="$OCS_STATE" OUT="$EVID/market-listing-cover-remediation.json" \
    node "$ROOT/scripts/dev/remediate-market-listing-covers-staging.cjs" 2>&1 | tee "$EVID/cover-remediation.log" || MIG_RC=$?
else
  echo "SKIP: remediate-market-listing-covers-staging.cjs not yet implemented" | tee "$EVID/cover-remediation.log"
  MIG_RC=2
fi

echo "== Market Media DDG · strict full-site audit (OCS_DDG_REMEDIATION_MODE=0) =="
export OCS_DDG_REMEDIATION_MODE=0
export OCS_STATE_PATH="$OCS_STATE"
DDG_RC=0
API="$API_BASE" FS_DG_JSON="$EVID/fs-dg-strict-audit.json" OCS_STATE="$OCS_STATE" \
  node "$ROOT/scripts/dev/staging-full-site-display-governance-audit.cjs" 2>&1 | tee "$EVID/fs-dg-strict-audit.log" || DDG_RC=$?

node -e "
const fs=require('fs');
const path=require('path');
const evid=process.argv[1];
const stamp=process.argv[2];
const api=process.argv[3];
const ddg=JSON.parse(fs.readFileSync(path.join(evid,'fs-dg-strict-audit.json'),'utf8'));
const signoff={
  schema:'traveltrust.market_media_ddg.signoff.v1',
  stamp,
  environment:'staging',
  api,
  machine_key:'TT_MARKET_MEDIA_DDG',
  strict_ddg_mode:false,
  ddg_verdict:ddg.verdict,
  ddg_blocking:(ddg.issue_counts?.PRODUCT_DATA_DEFECT||0)+(ddg.issue_counts?.TEST_DATA_LEAKAGE||0),
  ddg_advisory:ddg.issue_counts?.ADVISORY||0,
  migration_rc:Number(process.argv[4]),
  recorded_at:new Date().toISOString(),
};
signoff.verdict = signoff.migration_rc===0 && ddg.verdict==='PASS' ? 'PASS' : 'READY_FOR_REMEDIATION';
signoff.machine_keys={ TT_MARKET_MEDIA_DDG: signoff.verdict };
fs.writeFileSync(path.join(evid,'market-media-ddg-signoff.json'), JSON.stringify(signoff,null,2)+'\n');
console.log('TT_MARKET_MEDIA_DDG:', signoff.verdict);
" "$EVID" "$STAMP" "$API_BASE" "$MIG_RC" | tee "$EVID/signoff-summary.log"

if [[ "$MIG_RC" -eq 0 && "$DDG_RC" -eq 0 ]]; then
  cat > "$EVID/STATUS.txt" <<EOF
TT_MARKET_MEDIA_DDG: PASS
environment: staging
at=${STAMP}
api=${API_BASE}
signoff=market-media-ddg-signoff.json
evidence=${EVID#"$ROOT/"}
note=Strict full-site DDG PASS · listing covers migrated to OCS/CDN paths
EOF
  echo "Evidence: $EVID"
  exit 0
fi

cat > "$EVID/STATUS.txt" <<EOF
TT_MARKET_MEDIA_DDG: READY_FOR_REMEDIATION
environment: staging
at=${STAMP}
api=${API_BASE}
migration_rc=${MIG_RC}
ddg_rc=${DDG_RC}
evidence=${EVID#"$ROOT/"}
note=Implement listing cover migration then re-run with OCS_DDG_REMEDIATION_MODE=0
EOF
echo "Evidence: $EVID"
exit 1
