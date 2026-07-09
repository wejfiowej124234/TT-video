#!/usr/bin/env bash
# P2FC · post-soak 波次库（Wave0 meta · Wave1 API · Wave2 Web · 回滚快照）
# shellcheck disable=SC2034
set -euo pipefail

p2fc_post_soak_root() {
  if [[ -n "${P2FC_POST_SOAK_ROOT:-}" ]]; then
    printf '%s' "$P2FC_POST_SOAK_ROOT"
    return 0
  fi
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  printf '%s' "$(cd "$here/../../.." && pwd)"
}

p2fc_wave_checkpoint() {
  local out="$1" phase="$2" status="$3" detail="${4:-}"
  mkdir -p "$(dirname "$out")"
  node -e "
const fs=require('fs');
const p=process.argv[1];
let o={};
try{o=JSON.parse(fs.readFileSync(p,'utf8'))}catch{}
o.phases=o.phases||{};
o.phases[process.argv[2]]={status:process.argv[3],at_utc:new Date().toISOString(),detail:process.argv[4]||''};
fs.writeFileSync(p, JSON.stringify(o,null,2)+'\n');
" "$out" "$phase" "$status" "$detail"
}

# 只读：记录 fly release 镜像（回滚预案 · 不 deploy）
p2fc_capture_fly_rollback_snapshot() {
  local out_dir="$1"
  local api_app="${FLY_STAGING_API_APP:-tt-api-staging}"
  local web_app="${FLY_STAGING_WEB_APP:-tt-web-staging}"
  mkdir -p "$out_dir"
  if ! command -v fly >/dev/null 2>&1; then
    echo '{"error":"fly_cli_missing"}' >"$out_dir/fly-rollback-snapshot.json"
    return 0
  fi
  node -e "
const fs=require('fs');
const {execSync}=require('child_process');
const out=process.argv[1];
const apps=[process.argv[2], process.argv[3]];
const snap={schema:'traveltrust.p2fc_fly_rollback_snapshot.v1',recorded_at_utc:new Date().toISOString(),apps:{}};
for (const app of apps) {
  try {
    const raw=execSync('fly releases -a '+app+' --json',{encoding:'utf8',stdio:['pipe','pipe','pipe']});
    const arr=JSON.parse(raw);
    const cur=Array.isArray(arr)?arr[0]:null;
    const prev=Array.isArray(arr)&&arr.length>1?arr[1]:null;
    snap.apps[app]={
      current_image: cur?.ImageRef||cur?.image_ref||'',
      previous_image: prev?.ImageRef||prev?.image_ref||'',
      version: cur?.Version??cur?.version??null,
    };
  } catch (e) {
    snap.apps[app]={error:String(e.message||e)};
  }
}
fs.writeFileSync(out+'/fly-rollback-snapshot.json', JSON.stringify(snap,null,2)+'\n');
const md=['# Fly rollback snapshot (read-only)','',...Object.entries(snap.apps).map(([a,v])=>'- **'+a+'**: current='+(v.current_image||'n/a')+' · previous='+(v.previous_image||'n/a'))];
fs.writeFileSync(out+'/ROLLBACK-SNAPSHOT.md', md.join('\n')+'\n');
" "$out_dir" "$api_app" "$web_app"
}

p2fc_apply_backlog_patches() {
  local root="$1" stamp="$2" log="${3:-/dev/stderr}"
  local patch="$root/evidence/GO_phase2_deploy_backlog/${stamp}/deploy-backlog.patch"
  local hotfix="$root/evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch"
  [[ -f "$patch" ]] || { echo "FAIL missing patch $patch" | tee -a "$log" >&2; return 2; }
  echo "== Wave1-prep: apply deploy-backlog.patch stamp=${stamp} ==" | tee -a "$log"
  git -C "$root" apply --whitespace=nowarn "$patch" 2>&1 | tee -a "$log"
  if [[ -f "$hotfix" ]]; then
    echo "== Wave0: apply meta-availability-hotfix.patch ==" | tee -a "$log"
    git -C "$root" apply --whitespace=nowarn "$hotfix" 2>&1 | tee -a "$log" || true
  fi
  local untracked_dir="$root/evidence/GO_phase2_deploy_backlog/${stamp}/untracked"
  if [[ -d "$untracked_dir" ]]; then
    echo "== restore archived untracked deploy-path files ==" | tee -a "$log"
    cp -a "$untracked_dir/." "$root/" 2>&1 | tee -a "$log" || true
  fi
}

p2fc_deploy_api_wave() {
  local root="$1" log="${2:-/dev/stderr}"
  export TESTNET_FREEZE_OVERRIDE=1
  export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
  export TRAVELTRUST_GIT_SHA="$(git -C "$root" rev-parse HEAD)"
  export PHASE2_EXPECT_GIT_SHA="$TRAVELTRUST_GIT_SHA"
  echo "== Wave1: deploy tt-api-staging @ ${TRAVELTRUST_GIT_SHA:0:12}… ==" | tee -a "$log"
  bash "$root/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee -a "$log"
}

p2fc_deploy_web_wave() {
  local root="$1" log="${2:-/dev/stderr}"
  export TESTNET_FREEZE_OVERRIDE=1
  export STAGING_FE_BASE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
  export STAGING_WEB_BASE="$STAGING_FE_BASE"
  echo "== Wave2: deploy tt-web-staging ==" | tee -a "$log"
  if ! TESTNET_FREEZE_OVERRIDE=1 FLY_WEB_OOM_FIX=1 FLY_WEB_REMOTE_BUILD=1 \
    BUILD_NODE_MAX_OLD_SPACE_SIZE=6144 FLY_WEB_BUILDER_MEMORY_MB=8192 \
    bash "$root/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee -a "$log"; then
    TESTNET_FREEZE_OVERRIDE=1 bash "$root/scripts/dev/tt-web-staging-oom-fix-deploy.sh" 2>&1 | tee -a "$log"
  fi
  sleep 20
}

p2fc_rollback_fly_app() {
  local app="$1" image="$2" log="${3:-/dev/stderr}"
  [[ "$app" =~ ^(tt-api-staging|tt-web-staging)$ ]] || { echo "refusing rollback for $app" >&2; return 2; }
  [[ -n "$image" ]] || { echo "no rollback image for $app" >&2; return 2; }
  echo "== ROLLBACK: fly deploy --image ${image:0:40}… -a $app ==" | tee -a "$log"
  fly deploy --image "$image" -a "$app" --strategy immediate 2>&1 | tee -a "$log"
}
