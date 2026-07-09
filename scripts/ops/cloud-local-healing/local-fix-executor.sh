#!/usr/bin/env bash
# L3 · Local Fix Executor — 安全执行 Signed Fix Proposal（不直连 staging）
#
#   FIX_PROPOSAL_PATH=evidence/.../FIX-PROPOSAL.json bash scripts/ops/cloud-local-healing/local-fix-executor.sh --dry-run
#   FIX_PROPOSAL_PATH=... bash scripts/ops/cloud-local-healing/local-fix-executor.sh --execute
#
# 末行: TT_LOCAL_FIX_EXECUTOR: PASS|FAIL|BLOCKED
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PROPOSAL="${FIX_PROPOSAL_PATH:-}"
EXECUTE=0
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/CLOUD_LOCAL_HEALING_CI/executions/$STAMP"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) EXECUTE=0; shift ;;
    --execute) EXECUTE=1; shift ;;
    --proposal) PROPOSAL="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,8p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

blocked() { echo "TT_LOCAL_FIX_EXECUTOR: BLOCKED $*" >&2; exit 3; }
fail() { echo "TT_LOCAL_FIX_EXECUTOR: FAIL $*" >&2; exit 2; }

[[ -n "$PROPOSAL" && -f "$PROPOSAL" ]] || blocked "set FIX_PROPOSAL_PATH or --proposal to FIX-PROPOSAL.json"

mkdir -p "$EVID"
PROP_DIR="$(dirname "$PROPOSAL")"
issue_id="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).issue_id)" "$PROPOSAL")"
patch_type="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).patch_type)" "$PROPOSAL")"
patch_ref="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).patch_ref)" "$PROPOSAL")"
PATCH="$PROP_DIR/$patch_ref"
[[ -f "$PATCH" ]] || fail "missing patch_ref $PATCH"

gates_json="$(node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).gate_subset))" "$PROPOSAL")"

echo "local-fix-executor: issue=$issue_id patch_type=$patch_type execute=$EXECUTE"

case "$patch_type" in
  unified_diff)
    git -C "$ROOT" apply --check "$PATCH" || fail "git apply --check failed"
    [[ "$EXECUTE" == "1" ]] && git -C "$ROOT" apply "$PATCH"
    ;;
  shell_script)
    bash -n "$PATCH" || fail "shell script syntax check failed"
    [[ "$EXECUTE" == "1" ]] && bash "$PATCH"
    ;;
  config_overlay)
    fail "config_overlay requires Owner manual review"
    ;;
  *) fail "unknown patch_type=$patch_type" ;;
esac

# GATE 子集（proposal 声明）
gate_rc=0
node -e "
const gates=JSON.parse(process.argv[1]);
for (const g of gates) console.log(g);
" "$gates_json" | while read -r gate; do
  [[ -z "$gate" ]] && continue
  echo "  gate: $gate"
  if [[ "$EXECUTE" == "1" ]]; then
    eval "$gate" >>"$EVID/gates.log" 2>&1 || gate_rc=1
  fi
done

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.local_fix_execution_result.v1',
  executed_at_utc:new Date().toISOString(),
  issue_id:process.argv[2],
  dry_run:process.argv[3]!=='1',
  proposal:process.argv[4],
  gate_subset:JSON.parse(process.argv[5]),
  policy:'local_executor_never_direct_prod'
},null,2)+'\n');
" "$EVID/EXECUTION-RESULT.json" "$issue_id" "$EXECUTE" "$PROPOSAL" "$gates_json"

[[ "$EXECUTE" != "1" ]] && { echo "TT_LOCAL_FIX_EXECUTOR: PASS mode=dry-run evidence=$EVID"; exit 0; }
[[ "$gate_rc" -eq 0 ]] || fail "gate subset failed — see $EVID/gates.log"
echo "TT_LOCAL_FIX_EXECUTOR: PASS evidence=$EVID"
exit 0
