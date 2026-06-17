#!/usr/bin/env bash
# CP Revenue HAT · reuse HAT-R1 five-layer evidence helpers with CP_REVENUE_EVID
set -euo pipefail

_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export HAT_R1_EVID="${CP_REVENUE_EVID:?CP_REVENUE_EVID required}"
# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$_LIB_DIR/hat-r1-evidence-lib.sh"

cp_hat_step_dir() { hat_r1_step_dir "$@"; }
cp_hat_save_json() { hat_r1_save_json "$@"; }
cp_hat_api_get() { hat_r1_api_get "$@"; }
cp_hat_db_snapshot() { hat_r1_db_snapshot "$@"; }
cp_hat_page_manifest() { hat_r1_page_manifest "$@"; }
