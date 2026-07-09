#!/usr/bin/env bash
# Fly Managed Postgres helpers (PI3-001 · tt-traveltrust-prod MPG)
set -euo pipefail

fly_mpg_cluster_id_for_name() {
  local name="${1:?cluster name}"
  local id=""
  if command -v fly >/dev/null 2>&1; then
    id="$(fly mpg list -j 2>/dev/null | python -c "
import json, sys
raw = sys.stdin.read()
i = raw.find('[')
if i < 0:
    sys.exit(0)
for c in json.loads(raw[i:]):
    if c.get('name') == sys.argv[1]:
        print(c.get('id',''))
        break
" "$name" 2>/dev/null || true)"
  fi
  if [[ -z "$id" ]]; then
    id="${FLY_PROD_MPG_CLUSTER_ID:-q49ypo4e98pr17ln}"
  fi
  printf '%s' "$id"
}

fly_pg_backend_kind() {
  local app="${1:?app or cluster name}"
  local cid
  cid="$(fly_mpg_cluster_id_for_name "$app" 2>/dev/null || true)"
  if [[ -n "$cid" ]] && fly mpg status "$cid" >/dev/null 2>&1; then
    echo mpg
    return 0
  fi
  if fly apps list 2>/dev/null | grep -q "^${app}[[:space:]]"; then
    echo unmanaged
    return 0
  fi
  echo missing
}

fly_mpg_backup_list() {
  local cluster_id="${1:?cluster id}"
  fly mpg backup list "$cluster_id" --all 2>&1
}

fly_mpg_backup_create() {
  local cluster_id="${1:?cluster id}"
  fly mpg backup create "$cluster_id" --type full 2>&1
}
