#!/usr/bin/env bash
# TN-P1-010 · R1 Remediation（② · Reliability Closure 最短路径）
#
# 定向 backfill 11027290–11027450 → 单次 replay → reconcile(persist)
# 目标：missing_projection=0 · reconcile_compound_pass=true
# 不跑 infinite tick 循环
#
#   bash scripts/dev/record-tn-p1-010-r1-remediation-staging-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-010-r1-remediation-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"
RPC="${P2B407_RPC_URL:-${CHAIN_RPC_URL:-https://sepolia.drpc.org}}"

merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    export "$key=$val"
  done < "$f"
}

merge_env "$ROOT/.env"
merge_env "$ROOT/scripts/dev/.env.staging-onboarding.local"

export CHAIN_RPC_URL="$RPC"
export P2B407_RPC_URL="$RPC"
export STAGING_API_BASE="$STAGING_API"
export API_BASE_URL="$STAGING_API"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1,drpc.org"

SEC="${INTERNAL_API_SECRET:-}"

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_010_R1_REMEDIATION: START ${STAMP}"
echo "api=${STAGING_API} rpc=${RPC}"

[[ -n "$SEC" ]] || { echo "FAIL: INTERNAL_API_SECRET unset" >&2; exit 2; }
command -v jq >/dev/null 2>&1 || { echo "FAIL: jq required" >&2; exit 2; }
command -v node >/dev/null 2>&1 || { echo "FAIL: node required" >&2; exit 2; }

curl_internal() {
  local path="$1" body="${2:-{}}"
  curl --noproxy "*" -sS -X POST \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${SEC}" \
    -d "$body" \
    "${STAGING_API}${path}"
}

psql_staging() {
  # shellcheck disable=SC1091
  source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
  REPO_ROOT="$ROOT" staging_adm_u01_prepare_dsn >/dev/null
  local pass user dbn host port
  pass="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.password||''));" "$STAGING_DATABASE_URL")"
  user="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.username||''));" "$STAGING_DATABASE_URL")"
  dbn="$(node -e "const u=new URL(process.argv[1]);process.stdout.write(u.pathname.slice(1))" "$STAGING_DATABASE_URL")"
  host="$(node -e "const u=new URL(process.argv[1]);process.stdout.write(u.hostname);" "$STAGING_DATABASE_URL")"
  port="$(node -e "const u=new URL(process.argv[1]);process.stdout.write(u.port||'5432');" "$STAGING_DATABASE_URL")"
  [[ "$host" == "localhost" || "$host" == "127.0.0.1" ]] && host="host.docker.internal"
  docker run --rm -i -e "PGPASSWORD=${pass}" postgres:16-alpine \
    psql "postgres://${user}@${host}:${port}/${dbn}" -v ON_ERROR_STOP=1 "$@"
}

echo ""
echo "== Step 1: R1 pre-bootstrap backfill (11027290–11027450) =="
SQL_FILE="$EVID/r1-backfill.sql"
node "$ROOT/scripts/dev/tn-p1-010-r1-pre-bootstrap-backfill-staging.mjs" \
  --rpc "$RPC" \
  --sql-out "$SQL_FILE" | tee "$EVID/r1-backfill-summary.json"

[[ -f "$SQL_FILE" ]] || { echo "FAIL: no SQL generated" >&2; exit 2; }

psql_staging -f - <"$SQL_FILE" | tee "$EVID/r1-backfill-apply.log"

echo ""
echo "== Step 2: DB align bd83b97f accepted → escrowed (RCA R4) =="
psql_staging -c "
UPDATE orders
SET status = 'escrowed',
    escrowed_at = COALESCE(escrowed_at, '2026-06-10 04:44:00+00'::timestamptz),
    updated_at = now()
WHERE id = 'bd83b97f-77f4-4391-b71f-dc236cc4c9c0'
  AND status = 'accepted';
" | tee "$EVID/r1-db-align-bd83.log"

echo ""
echo "== Step 3: single indexer-replay =="
curl_internal "/api/v1/internal/indexer-replay" '{}' | tee "$EVID/indexer-replay.json"

echo ""
echo "== Step 4: indexer-reconcile (persist + rpc samples) =="
RECON_BODY='{"persist":true,"rpc_escrow_samples":10,"include_event_log_escrow_coverage":true,"include_fee_router_platform_fee_routed_log_count_chain_vs_db_observability":true}'
curl_internal "/api/v1/internal/indexer-reconcile" "$RECON_BODY" | tee "$EVID/indexer-reconcile.json"

node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const gate=j.orders_projection_reconcile_gate||{};
const bd=gate.breakdown||{};
const miss=Number(bd.missing_projection??-1);
const compound=!!j.reconcile_compound_pass;
const clean=!!j.projection_reconcile_clean;
const rpc=j.indexer_reconcile_compound_gate?.breakdown?.rpc_escrow_samples||{};
console.log(JSON.stringify({missing_projection:miss,reconcile_compound_pass:compound,projection_reconcile_clean:clean,rpc_escrow_samples:rpc},null,2));
if(miss!==0){console.error('FAIL missing_projection',miss);process.exit(2);}
if(!compound){console.error('FAIL reconcile_compound_pass false');process.exit(2);}
if(!clean){console.error('FAIL projection_reconcile_clean false');process.exit(2);}
" "$EVID/indexer-reconcile.json" | tee "$EVID/reconcile-assertions.json"

node -e "
const fs=require('fs');
const recon=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const summary={
  schema:'tn_p1_010_r1_remediation_staging.v1',
  stamp:process.argv[2],
  phase:'② testnet',
  remediation:'R1_pre_bootstrap_backfill_11027290_11027450',
  reconcile_compound_pass:recon.reconcile_compound_pass,
  missing_projection:recon.orders_projection_reconcile_gate?.breakdown?.missing_projection??null,
  projection_reconcile_clean:recon.projection_reconcile_clean,
  release_gate:'GO',
  honest_boundary:'Targeted legacy backfill + single replay/reconcile · no infinite tick · ≠ ③ mainnet'
};
fs.writeFileSync(process.argv[3], JSON.stringify(summary,null,2)+'\n');
" "$EVID/indexer-reconcile.json" "$STAMP" "$EVID/report.json"

TN010_EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-010-indexer-reconcile-${STAMP}"
mkdir -p "$TN010_EVID"
cp -r "$EVID/." "$TN010_EVID/"

cat >"$EVID/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: TN-P1-010 R1 remediation
at: ${STAMP}
release_gate: GO
EOF

cat >"$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-010-indexer-reconcile-${STAMP}/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: TN-P1-010 indexer reconcile (R1 remediation)
at: ${STAMP}
release_gate: GO
EOF

echo ""
echo "TT_TN_P1_010_INDEXER_RECONCILE_EVIDENCE: PASS ${STAMP}"
echo "TT_TN_P1_010_R1_REMEDIATION: PASS ${STAMP}"
echo "evidence: ${EVID}"
