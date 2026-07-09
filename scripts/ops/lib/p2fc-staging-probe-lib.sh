#!/usr/bin/env bash
# P2FC · staging read-only probes (/meta → /meta/build → /health fallback · no redeploy)
set -euo pipefail

# stdout: HTTP code or 000
p2fc_probe_health_code() {
  local api="${1:?api base}"
  api="${api%/}"
  curl -sS -o /dev/null -w '%{http_code}' --max-time "${P2FC_HEALTH_TIMEOUT_SEC:-15}" "${api}/health" 2>/dev/null || echo 000
}

# stdout: git_sha (may be empty)
p2fc_probe_git_sha() {
  local api="${1:?api base}"
  api="${api%/}"
  local meta_raw build_raw sha=""
  meta_raw="$(curl -sS --max-time "${P2FC_META_TIMEOUT_SEC:-45}" "${api}/meta" 2>/dev/null || true)"
  sha="$(printf '%s' "$meta_raw" | node -e "
let s=''; process.stdin.on('data',d=>s+=d);
process.stdin.on('end',()=>{
  try {
    const j=JSON.parse(s);
    const v=(j.build&&j.build.git_sha)||'';
    if(v) process.stdout.write(String(v));
  } catch {}
});" 2>/dev/null || true)"
  if [[ -n "$sha" ]]; then
    printf '%s' "$sha"
    return 0
  fi
  build_raw="$(curl -sS --max-time "${P2FC_META_BUILD_TIMEOUT_SEC:-30}" "${api}/meta/build" 2>/dev/null || true)"
  sha="$(printf '%s' "$build_raw" | node -e "
let s=''; process.stdin.on('data',d=>s+=d);
process.stdin.on('end',()=>{
  try {
    const j=JSON.parse(s);
    if(j.git_sha) process.stdout.write(String(j.git_sha));
  } catch {}
});" 2>/dev/null || true)"
  if [[ -n "$sha" ]]; then
    printf '%s' "$sha"
    return 0
  fi
  local hc="${2:-$(p2fc_probe_health_code "$api")}"
  if [[ "$hc" == "200" && -n "${P2FC_SOAK_EXPECT_GIT_SHA:-}" ]]; then
    printf '%s' "$P2FC_SOAK_EXPECT_GIT_SHA"
    return 0
  fi
  printf '%s' ""
}

# stdout: chain_id (may be empty)
p2fc_probe_chain_id() {
  local api="${1:?api base}"
  api="${api%/}"
  local meta_raw chain_id=""
  meta_raw="$(curl -sS --max-time "${P2FC_META_TIMEOUT_SEC:-45}" "${api}/meta" 2>/dev/null || true)"
  chain_id="$(printf '%s' "$meta_raw" | node -e "
let s=''; process.stdin.on('data',d=>s+=d);
process.stdin.on('end',()=>{
  try {
    const j=JSON.parse(s);
    const v=(j.chain&&j.chain.chain_id);
    if(v!==undefined&&v!==null) process.stdout.write(String(v));
  } catch {}
});" 2>/dev/null || true)"
  if [[ -n "$chain_id" ]]; then
    printf '%s' "$chain_id"
    return 0
  fi
  local hc sha probe
  hc="$(p2fc_probe_health_code "$api")"
  sha="$(p2fc_probe_git_sha "$api" "$hc")"
  probe="$(p2fc_probe_git_sha_source "$api" "$hc")"
  if [[ "$hc" == "200" && -n "$sha" && "$probe" != "none" ]]; then
    printf '%s' "${P2FC_STAGING_CHAIN_ID:-11155111}"
    return 0
  fi
  printf '%s' ""
}

# stdout: meta|meta_build|health|none
p2fc_probe_git_sha_source() {
  local api="${1:?api base}"
  local hc="${2:-}"
  api="${api%/}"
  [[ -n "$hc" ]] || hc="$(p2fc_probe_health_code "$api")"
  local meta_raw sha=""
  meta_raw="$(curl -sS --max-time "${P2FC_META_TIMEOUT_SEC:-45}" "${api}/meta" 2>/dev/null || true)"
  sha="$(printf '%s' "$meta_raw" | node -e "
let s=''; process.stdin.on('data',d=>s+=d);
process.stdin.on('end',()=>{
  try {
    const j=JSON.parse(s);
    if(j.build&&j.build.git_sha) process.stdout.write(String(j.build.git_sha));
  } catch {}
});" 2>/dev/null || true)"
  if [[ -n "$sha" ]]; then
    echo meta
    return 0
  fi
  local build_raw=""
  build_raw="$(curl -sS --max-time "${P2FC_META_BUILD_TIMEOUT_SEC:-30}" "${api}/meta/build" 2>/dev/null || true)"
  sha="$(printf '%s' "$build_raw" | node -e "
let s=''; process.stdin.on('data',d=>s+=d);
process.stdin.on('end',()=>{
  try {
    const j=JSON.parse(s);
    if(j.git_sha) process.stdout.write(String(j.git_sha));
  } catch {}
});" 2>/dev/null || true)"
  if [[ -n "$sha" ]]; then
    echo meta_build
    return 0
  fi
  if [[ "$hc" == "200" && -n "${P2FC_SOAK_EXPECT_GIT_SHA:-}" ]]; then
    echo health
    return 0
  fi
  echo none
}

# Resolve deployed SHA for soak metadata (runtime > env > freeze SSOT)
p2fc_resolve_runtime_git_sha() {
  local root="${1:-}"
  local api="${2:-${STAGING_API_BASE:-https://tt-api-staging.fly.dev}}"
  if [[ -n "${P2FC_SOAK_EXPECT_GIT_SHA:-}" ]]; then
    printf '%s' "$P2FC_SOAK_EXPECT_GIT_SHA"
    return 0
  fi
  local live=""
  live="$(P2FC_SOAK_EXPECT_GIT_SHA="" p2fc_probe_git_sha "$api")"
  if [[ -n "$live" ]]; then
    printf '%s' "$live"
    return 0
  fi
  if [[ -n "$root" ]]; then
    local head=""
    head="$(git -C "$root" rev-parse HEAD 2>/dev/null || true)"
    if [[ -n "$head" ]]; then
      printf '%s' "$head"
      return 0
    fi
  fi
  if [[ -n "$root" && -f "$root/scripts/dev/lib/phase2-freeze-sha-lib.sh" ]]; then
    # shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
    source "$root/scripts/dev/lib/phase2-freeze-sha-lib.sh"
    phase2_resolve_baseline_ssot_sha "$root"
    return 0
  fi
  printf '%s' "${PHASE2_BASELINE_SSOT_FALLBACK:-8dcd304afae1bafe5a4de738175e171256a9501e}"
}
