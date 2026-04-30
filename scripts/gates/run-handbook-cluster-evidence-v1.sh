#!/usr/bin/env bash
# Union of local commands cited in docs/handbook/engineering/EVIDENCE-*-cluster-verified.md §V-1
# (04-api, 07-devflow, 93-c-gov, 94-market, 14-chain-abi, 70-admin, 110-reconcile, 100-330-phase,
#  20-B-orders, 30-C-async, 10-A-auth). Single entry for humans + CI; does not edit docs or 09 §3.
#
# Usage (repo root): bash scripts/gates/run-handbook-cluster-evidence-v1.sh
#
# Env (optional skips):
#   TT_CLUSTER_EVIDENCE_V1_SKIP_CARGO=1              — skip all cargo test blocks
#   TT_CLUSTER_EVIDENCE_V1_SKIP_AUTH=1             — skip auth_register_login_logout_db_api_tests
#   TT_CLUSTER_EVIDENCE_V1_SKIP_INDEXER_REORG_STATUS=1 — skip indexer-reorg-recovery.sh status
#
# Note: check-handbook-engineering-content may print HBOOK-ENG-TABLE-WARN on stderr while exiting 0.
#
# CI / 日志机读：最后一行（或失败当刻一行）固定为
#   TT_EVIDENCE_V1_SUMMARY: OK steps=<comma-separated-ids>
#   TT_EVIDENCE_V1_SUMMARY: FAIL step=<id> exit=<n>
#
# Contract (repo policy; CONTRIBUTING + scripts/README + engineering/22 §3):
#   - Do not remove/rename/silence the TT_EVIDENCE_V1_SUMMARY line; keep prefix + OK/FAIL shape grep-stable.
#   - Union steps must stay semantically aligned with each EVIDENCE-*-cluster-verified.md ## V-1 block.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

say() { printf '%s\n' "$*"; }
step() { say ""; say "==> $*"; }

STEPS_DONE=()
CURRENT_STEP_ID=init

_ev1_fail() {
  local ec=$?
  printf '%s\n' "TT_EVIDENCE_V1_SUMMARY: FAIL step=${CURRENT_STEP_ID} exit=${ec}" >&2
  exit "$ec"
}

trap '_ev1_fail' ERR

_ev1_step() {
  local id="$1"
  shift
  CURRENT_STEP_ID="$id"
  "$@"
  STEPS_DONE+=("$id")
}

_ev1_ok_line() {
  local joined
  joined=$(printf '%s,' "${STEPS_DONE[@]}")
  joined="${joined%,}"
  printf '%s\n' "TT_EVIDENCE_V1_SUMMARY: OK steps=${joined}"
}

step "07 version triple (EVIDENCE-07-devflow §V-1)"
_ev1_step 07-triple bash scripts/check-07-version-triple.sh

step "Wave / phase spec files (EVIDENCE-100-330-phase §V-1)"
_ev1_step wave-phase bash scripts/check-wave-phase-files.sh

step "Handbook frontmatter (shared across EVIDENCE V-1)"
_ev1_step frontmatter bash scripts/check-handbook-frontmatter.sh

step "Handbook engineering content / EVIDENCE hygiene (shared)"
_ev1_step eng-content bash scripts/check-handbook-engineering-content.sh

step "55-S13 ABI gate (EVIDENCE-14-chain-abi §V-1)"
_ev1_step 55-s13 bash scripts/check-55-s13.sh

step "04 §3.4 routes vs code (shared)"
_ev1_step routes-04 bash scripts/run-check-04-routes.sh

if [[ "${TT_CLUSTER_EVIDENCE_V1_SKIP_INDEXER_REORG_STATUS:-}" != "1" ]]; then
  step "indexer-reorg-recovery status — no API: curl (7) expected (EVIDENCE-70 / 110 §V-1)"
  _ev1_step indexer-reorg bash scripts/ops/indexer-reorg-recovery.sh status
fi

if [[ "${TT_CLUSTER_EVIDENCE_V1_SKIP_CARGO:-}" == "1" ]]; then
  say ""
  say "TT_CLUSTER_EVIDENCE_V1_SKIP_CARGO=1 — skipping cargo test blocks."
  trap - ERR
  _ev1_ok_line
  exit 0
fi

CT=(cargo test -p traveltrust-api --no-fail-fast)

step "93·C governance read contract (EVIDENCE-93-c-gov §V-1)"
_ev1_step cargo-gov-read "${CT[@]}" read_contract_pool_placeholder_matches_chain_lane

step "94 market_subsite — compile test target (EVIDENCE-94-market §V-1)"
_ev1_step cargo-market-compile cargo test -p traveltrust-api market_subsite_catalog_db_api_tests --no-run

step "20-B orders matrix — compile test target (EVIDENCE-20-B §V-1)"
_ev1_step cargo-orders-compile cargo test -p traveltrust-api orders_create_list_set_escrow_address_db_api_tests --no-run

step "30-C onboarding / async_jobs stack — compile test target (EVIDENCE-30-C §V-1)"
_ev1_step cargo-onboarding-compile cargo test -p traveltrust-api onboarding_app_stack_db_api_tests --no-run

step "70 Admin matrix D-ADM-003b (EVIDENCE-70 §V-1)"
_ev1_step cargo-matrix-adm "${CT[@]}" matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg

step "70 / 110 D-IDX-001b indexer status matrix (EVIDENCE-70 / 110 §V-1)"
_ev1_step cargo-matrix-idx "${CT[@]}" matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg

step "42-D / 70 approval_requires_super_admin_role (EVIDENCE-70 §V-1)"
_ev1_step cargo-approval "${CT[@]}" approval_requires_super_admin_role

if [[ "${TT_CLUSTER_EVIDENCE_V1_SKIP_AUTH:-}" != "1" ]]; then
  step "10-A auth_register_login_logout_db_api_tests (EVIDENCE-10-A §V-1)"
  _ev1_step cargo-auth "${CT[@]}" auth_register_login_logout_db_api_tests
else
  say ""
  say "TT_CLUSTER_EVIDENCE_V1_SKIP_AUTH=1 — skipping auth_register_login_logout_db_api_tests."
fi

say ""
trap - ERR
_ev1_ok_line
