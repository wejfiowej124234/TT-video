#!/usr/bin/env bash
# FPC-100 B40 · Staging one-shot deploy from Local Final Freeze authoritative SHA only
#
#   TRAVELTRUST_FPC_B40_STAGING_OK=1 \
#   DEPLOY_GOVERNANCE_FORCE_RUNTIME=1 \
#     bash scripts/dev/run-fpc-b40-staging-deploy-from-anchor.sh
#
# Optional:
#   FPC_AUTHORITATIVE_GIT_SHA=<40-char>  — override SSOT load
#   SKIP_WEB_DEPLOY=1                    — API only
#   TESTNET_FREEZE_OVERRIDE=1            — if staging freeze active
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "TT_FPC_B40_STAGING_DEPLOY: FAIL $*" >&2; exit 2; }
ok() { echo "TT_FPC_B40_STAGING_DEPLOY: OK $*"; }

[[ "${TRAVELTRUST_FPC_B40_STAGING_OK:-}" == "1" ]] || \
  fail "Owner authorization required: TRAVELTRUST_FPC_B40_STAGING_OK=1"

if [[ -n "${FPC_AUTHORITATIVE_GIT_SHA:-}" ]]; then
  ANCHOR_SHA="$FPC_AUTHORITATIVE_GIT_SHA"
else
  ANCHOR_SHA="$(node -e "
    const fs=require('fs');
    const p='docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-LOCAL-FINAL-FREEZE-LATEST.json';
    const j=JSON.parse(fs.readFileSync(p,'utf8'));
    console.log(j.authoritative_immutable_head);
  ")"
fi

[[ "$ANCHOR_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "invalid authoritative SHA: ${ANCHOR_SHA:-empty}"

git cat-file -e "${ANCHOR_SHA}^{commit}" 2>/dev/null || fail "anchor commit not in repo: $ANCHOR_SHA"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B40-deployment"
mkdir -p "$EVID"
LOG="$EVID/deploy-from-anchor-${STAMP}.log"
exec > >(tee -a "$LOG") 2>&1

echo "TT_FPC_B40_STAGING_DEPLOY: START anchor=${ANCHOR_SHA} stamp=${STAMP}"
echo "  governance_head=$(git rev-parse HEAD)"
echo "  policy: deploy build source = authoritative SHA only; B21-B36 frozen unchanged"

WORKTREE="$ROOT/.fpc-b40-deploy-worktree"
if [[ -d "$WORKTREE" ]]; then
  git worktree remove --force "$WORKTREE" 2>/dev/null || rm -rf "$WORKTREE"
fi
git worktree add --detach "$WORKTREE" "$ANCHOR_SHA" || fail "git worktree add $ANCHOR_SHA"

echo "== normalize migration SQL to authoritative LF blobs (avoid Windows CRLF deploy drift) =="
node - "$ANCHOR_SHA" "$WORKTREE" <<'NODE'
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const anchor = process.argv[2];
const wt = process.argv[3];
const root = process.cwd();
const files = execSync(`git ls-tree -r --name-only ${anchor} -- crates/api/migrations`, { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((f) => f.endsWith('.sql'));
for (const mig of files) {
  const blob = execSync(`git show ${anchor}:${mig}`, { cwd: root });
  const out = path.join(wt, mig);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, blob);
}
console.log(`  normalized ${files.length} migration blobs (binary LF write)`);
NODE

echo "== patch Dockerfile: in-container LF strip (Fly Windows context upload safety) =="
node - "$WORKTREE/Dockerfile" <<'NODE'
const fs = require('fs');
const p = process.argv[2];
let d = fs.readFileSync(p, 'utf8');
if (!d.includes('TT_B40_MIGRATION_LF_STRIP')) {
  const inj = '# TT_B40_MIGRATION_LF_STRIP\nRUN find crates/api/migrations -name "*.sql" -exec sed -i "s/\\r$//" {} +\n';
  d = d.replace(/^RUN cargo build/m, inj + 'RUN cargo build');
  fs.writeFileSync(p, d);
  console.log('  patched Dockerfile with in-builder LF strip');
} else {
  console.log('  Dockerfile already patched');
}
NODE

cleanup() {
  git worktree remove --force "$WORKTREE" 2>/dev/null || rm -rf "$WORKTREE"
}
trap cleanup EXIT

export DEPLOYMENT_THREE_STATE_ROOT="$ROOT"
export DEPLOYMENT_STATE="${DEPLOYMENT_STATE:-sync}"
export DEPLOY_GOVERNANCE_FORCE_RUNTIME=1
export TRAVELTRUST_BUILD_GIT_SHA="$ANCHOR_SHA"
export STAGING_ENV_FILE="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
export STAGING_SECRETS_FILE="${STAGING_SECRETS_FILE:-$ROOT/scripts/dev/.env.staging-secrets.local}"
export PHASE2_CHAIN_DEPLOY_ENV="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"

echo "== secrets sync (from repo root env; image build from worktree) =="
if [[ "${SKIP_SECRETS_SYNC:-}" == "1" ]]; then
  echo "  SKIP_SECRETS_SYNC=1 — using existing Fly secrets"
else
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" --secrets-only || {
    echo "WARN: secrets sync failed — continuing if SKIP_SECRETS_SYNC_ON_FAIL=1 or staging health OK" >&2
    [[ "${SKIP_SECRETS_SYNC_ON_FAIL:-1}" == "1" ]] || fail "secrets sync failed"
    hc_pre="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}/health" 2>/dev/null || echo 000)"
    [[ "$hc_pre" == "200" ]] || fail "secrets sync failed and staging health not 200 ($hc_pre)"
  }
fi

echo "== API deploy from anchor worktree =="
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"
APP="${FLY_STAGING_API_APP:-tt-api-staging}"
FLY_CONFIG="$WORKTREE/deploy/fly/tt-api-staging/fly.toml"
[[ -f "$FLY_CONFIG" ]] || fail "missing $FLY_CONFIG @ anchor"

FLY_DEPLOY_EXTRA=()
if [[ "${FLY_API_NO_CACHE:-1}" == "1" ]]; then
  FLY_DEPLOY_EXTRA+=(--no-cache)
  echo "  FLY_API_NO_CACHE=1 — bust Docker layer cache (migration LF normalization)"
fi

fly deploy -c "$FLY_CONFIG" \
  --build-arg "TRAVELTRUST_BUILD_GIT_SHA=${ANCHOR_SHA}" \
  "${FLY_DEPLOY_EXTRA[@]}" \
  -a "$APP"

API="${STAGING_API_BASE:-https://${APP}.fly.dev}"
hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 45 "${API}/health" 2>/dev/null || echo 000)"
[[ "$hc" == "200" ]] || fail "${API}/health not 200 (got $hc)"

STAGING_SHA="$(curl -sS --max-time 45 "${API}/meta" 2>/dev/null \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log((j.build||{}).git_sha||'')}catch{console.log('')}})")"

if [[ "$STAGING_SHA" != "$ANCHOR_SHA" ]]; then
  fail "post-deploy meta SHA mismatch expected=${ANCHOR_SHA} got=${STAGING_SHA:-unknown}"
fi

WEB_SHA="skipped"
if [[ "${SKIP_WEB_DEPLOY:-}" != "1" ]]; then
  echo "== Web deploy (repo root script; build arg pinned to anchor) =="
  export TRAVELTRUST_BUILD_GIT_SHA="$ANCHOR_SHA"
  FLY_WEB_NO_CACHE="${FLY_WEB_NO_CACHE:-1}" bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh"
  WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
  web_hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 45 "${WEB}/" 2>/dev/null || echo 000)"
  [[ "$web_hc" == "200" || "$web_hc" == "304" ]] || fail "${WEB}/ not 200 (got $web_hc)"
  WEB_SHA="deployed"
fi

MANIFEST="$EVID/FPC-100-B40-DEPLOY-MANIFEST-${STAMP}.json"
node - "$MANIFEST" "$STAMP" "$ANCHOR_SHA" "$STAGING_SHA" "$API" "$LOG" <<'NODE'
const fs = require('fs');
const [out, stamp, anchor, stagingSha, api, log] = process.argv.slice(2);
const doc = {
  schema: 'traveltrust.fpc_100_b40_deploy_manifest.v1',
  timestamp_utc: new Date().toISOString(),
  phase: '② staging',
  authoritative_git_sha: anchor,
  staging_meta_git_sha: stagingSha,
  sha_match: anchor === stagingSha,
  staging_api: api,
  deploy_log: log,
  deploy_source: 'git worktree detach @ authoritative SHA',
  owner_auth: 'TRAVELTRUST_FPC_B40_STAGING_OK=1',
};
fs.writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
console.log(`manifest: ${out}`);
NODE

cp -f "$MANIFEST" "$EVID/FPC-100-B40-DEPLOY-MANIFEST-LATEST.json"

ok "anchor=${ANCHOR_SHA} staging_meta=${STAGING_SHA} api_health=200"
echo "TT_FPC_B40_STAGING_DEPLOY: PASS"
