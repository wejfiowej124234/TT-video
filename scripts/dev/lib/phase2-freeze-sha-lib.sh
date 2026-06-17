#!/usr/bin/env bash
# Phase ② · TESTNET_STAGING_FREEZE + baseline SHA helpers (SSOT: ACTIVE.json)
set -euo pipefail

phase2_freeze_active_path() {
  local root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
  echo "$root/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"
}

# stdout: full git_sha from ACTIVE.json, or empty if inactive
phase2_read_freeze_git_sha() {
  local root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
  local active
  active="$(phase2_freeze_active_path "$root")"
  [[ -f "$active" ]] || return 0
  node -e "
const fs=require('fs');
try {
  const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
  if(j.git_sha) process.stdout.write(String(j.git_sha));
} catch {}
" "$active" 2>/dev/null || true
}

# stdout: resolved SSOT SHA (freeze ACTIVE > env > fallback)
phase2_resolve_baseline_ssot_sha() {
  local root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
  local from_freeze from_env fallback
  from_freeze="$(phase2_read_freeze_git_sha "$root")"
  from_env="${PHASE2_BASELINE_SSOT_SHA:-${PHASE2_REVALIDATION_BASELINE_SHA:-}}"
  fallback="${PHASE2_BASELINE_SSOT_FALLBACK:-8dcd304afae1bafe5a4de738175e171256a9501e}"
  if [[ -n "$from_freeze" ]]; then
    echo "$from_freeze"
  elif [[ -n "$from_env" ]]; then
    echo "$from_env"
  else
    echo "$fallback"
  fi
}

# exit 0 if staging deploy/secrets sync is allowed; exit 3 if freeze blocks
phase2_require_staging_deploy_allowed() {
  local root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
  local active
  active="$(phase2_freeze_active_path "$root")"
  if [[ -f "$active" && "${TESTNET_FREEZE_OVERRIDE:-}" != "1" ]]; then
    echo "BLOCKED: TESTNET_STAGING_FREEZE ACTIVE ($active) — set TESTNET_FREEZE_OVERRIDE=1 (Owner only) to deploy" >&2
    return 3
  fi
  return 0
}
