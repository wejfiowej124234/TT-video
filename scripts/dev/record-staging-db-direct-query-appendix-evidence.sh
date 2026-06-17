#!/usr/bin/env bash
# ② · Staging DB 直查附录证据（Windows 无本机 psql · 使用 docker postgres:16-alpine）
#
# 用途：补足 graduation 重验时 native psql 缺失（exit 127）的 DB 对齐旁证；
#       不修改业务代码 · 仅 ops 数据卫生（multi-demo 烟测 listing 时间戳）+ 机读 JSON。
#
#   export PHASE2_REVALIDATION_BASELINE_SHA=<ACTIVE.json git_sha>
#   bash scripts/dev/record-staging-db-direct-query-appendix-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BASELINE_SHA="${PHASE2_REVALIDATION_BASELINE_SHA:-${PHASE2_EXPECT_GIT_SHA:-$(git rev-parse HEAD 2>/dev/null || echo '')}}"
EVID="${STAGING_DB_APPENDIX_EVID_DIR:-$ROOT/evidence/GO_phase2_testnet_graduation/staging-db-direct-query-appendix-${STAMP}}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
FE="${FE%/}"

export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev,localhost,127.0.0.1"
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY http_proxy https_proxy all_proxy 2>/dev/null || true

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_STAGING_DB_DIRECT_QUERY_APPENDIX: START ${STAMP}"
echo "baseline_sha=${BASELINE_SHA} api=${API} fe=${FE}"

command -v docker >/dev/null 2>&1 || { echo "FAIL: docker required for staging DB appendix" >&2; exit 2; }
command -v node >/dev/null 2>&1 || { echo "FAIL: node required" >&2; exit 2; }

curl --noproxy "*" -sS --max-time 45 "${API}/meta" >"$EVID/api-meta.json"
curl --noproxy "*" -sS --max-time 45 "${FE}/meta" >"$EVID/web-meta.json"

node -e "
const fs=require('fs');
const baseline=process.argv[1];
const api=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const web=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const apiSha=api.build?.git_sha||'';
const webSha=web.build?.git_sha||'';
const ok=baseline && apiSha===baseline && webSha===baseline;
const out={baseline_git_sha:baseline,api_git_sha:apiSha,web_git_sha:webSha,aligned:ok,checked_at:new Date().toISOString()};
fs.writeFileSync(process.argv[4], JSON.stringify(out,null,2)+'\n');
if(!ok){console.error('FAIL meta sha mismatch',out);process.exit(2);}
console.log('meta-alignment-ok',JSON.stringify(out));
" "$BASELINE_SHA" "$EVID/api-meta.json" "$EVID/web-meta.json" "$EVID/meta-alignment.json"

REPO_ROOT="$ROOT"
# shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
staging_adm_u01_prepare_dsn || {
  echo "FAIL: staging-adm-u01-env prepare (fly proxy / STAGING_DATABASE_URL)" >&2
  exit 2
}

psql_staging() {
  local pass user dbn host port
  pass="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.password||''));" "$STAGING_DATABASE_URL")"
  user="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.username||''));" "$STAGING_DATABASE_URL")"
  dbn="$(node -e "const u=new URL(process.argv[1]);process.stdout.write((u.pathname||'/').replace(/^\//,'')||'postgres');" "$STAGING_DATABASE_URL")"
  host="$(node -e "const u=new URL(process.argv[1]);process.stdout.write(u.hostname||'127.0.0.1');" "$STAGING_DATABASE_URL")"
  port="$(node -e "const u=new URL(process.argv[1]);process.stdout.write(u.port||'5432');" "$STAGING_DATABASE_URL")"
  [[ "$host" == "localhost" || "$host" == "127.0.0.1" ]] && host="host.docker.internal"
  docker run --rm -i -e "PGPASSWORD=${pass}" postgres:16-alpine \
    psql "postgres://${user}@${host}:${port}/${dbn}" -v ON_ERROR_STOP=1 "$@"
}

echo ""
echo "== DB probe (docker psql · native psql not required) =="
psql_staging -tAc "SELECT 1" | tee "$EVID/db-select1.txt"
[[ "$(tr -d '[:space:]' <"$EVID/db-select1.txt")" == "1" ]] || { echo "FAIL: DB SELECT 1" >&2; exit 2; }

psql_staging -tAc "
SELECT (SELECT COUNT(*)::int FROM market_listings ml
        WHERE ml.owner_user_id = u.id AND ml.variant = 'acquisition'
          AND ml.status = 'published' AND ml.created_at >= now() - interval '24 hours'),
       u.id::text,
       u.email
FROM users u WHERE u.email = 'multi-demo@test.com';
" | tee "$EVID/multi-demo-listing-counts.txt"

BEFORE_24H="$(cut -d'|' -f1 "$EVID/multi-demo-listing-counts.txt" | tr -d '[:space:]' || echo "")"
echo "acq_published_24h_before=${BEFORE_24H:-unknown}"

if [[ "${STAGING_DB_APPENDIX_RESET_ACQ_SMOKE:-1}" == "1" && "${BEFORE_24H:-0}" -ge 5 ]]; then
  echo ""
  echo "== AQ-004 hygiene: age back multi-demo smoke acquisition listings (>24h) =="
  psql_staging -tAc "
UPDATE market_listings SET created_at = now() - interval '25 hours'
WHERE owner_user_id = (SELECT id FROM users WHERE email = 'multi-demo@test.com')
  AND variant = 'acquisition' AND status = 'published'
  AND created_at >= now() - interval '24 hours';
SELECT COUNT(*)::int FROM market_listings ml
WHERE ml.owner_user_id = (SELECT id FROM users WHERE email = 'multi-demo@test.com')
  AND ml.variant = 'acquisition' AND ml.status = 'published'
  AND ml.created_at >= now() - interval '24 hours';
" | tee "$EVID/acq-rate-limit-hygiene.log"
  echo "acq_published_24h_after=$(tail -1 "$EVID/acq-rate-limit-hygiene.log" | tr -d '[:space:]')"
fi

psql_staging -c "
SELECT current_database() AS db, current_user AS db_user,
       (SELECT COUNT(*)::bigint FROM users) AS users_total,
       (SELECT COUNT(*)::bigint FROM orders) AS orders_total;
" | tee "$EVID/db-snapshot.txt"

node -e "
const fs=require('fs');
const p=process.argv[1];
const body={
  stamp: process.argv[2],
  phase: '② testnet',
  baseline_git_sha: process.argv[3],
  api: process.argv[4],
  fe: process.argv[5],
  psql_client: 'docker postgres:16-alpine (native psql absent on host)',
  fly_proxy_port: process.env.STAGING_PG_PROXY_PORT||'15432',
  honest_boundary: 'appendix only · no application code change · AQ-004 hygiene optional',
  marker: 'TT_STAGING_DB_DIRECT_QUERY_APPENDIX: PASS'
};
fs.writeFileSync(p, JSON.stringify(body,null,2)+'\n');
" "$EVID/meta.json" "$STAMP" "$BASELINE_SHA" "$API" "$FE"

echo "TT_STAGING_DB_DIRECT_QUERY_APPENDIX: PASS ${STAMP}"
echo "evidence: ${EVID}"
