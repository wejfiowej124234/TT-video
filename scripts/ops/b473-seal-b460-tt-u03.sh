#!/usr/bin/env bash
# B-473 / 母表 B-460：TT-U03 **单一封口命令**（机读闸 + 评价契约 + Playwright 串联 + Epic F 补充）。
# 须本机可跑全栈 Playwright（`PLAYWRIGHT_FULL_STACK=1`，API 可用）；退出码非 0 即失败。
#
# 证据落盘：
#   - evidence/b460_tt_u03_order_lifecycle_review_e2e/b410_stderr.txt（b410 闸）
#   - evidence/b473_seal_b460_tt_u03/seal-run.log（本脚本全量步骤输出）

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

B460="${ROOT}/evidence/b460_tt_u03_order_lifecycle_review_e2e"
B473="${ROOT}/evidence/b473_seal_b460_tt_u03"
mkdir -p "$B460" "$B473"

LOG="${B473}/seal-run.log"
: >"$LOG"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG"
}

log "b473-seal-b460-tt-u03: start (repo root: ${ROOT})"

log "step 1/4: b410-user-flow-e2e-gate.sh -> evidence/b460_tt_u03_order_lifecycle_review_e2e/b410_stderr.txt"
bash "${ROOT}/scripts/ops/b410-user-flow-e2e-gate.sh" >"${B460}/b410_stderr.txt" 2>&1
cat "${B460}/b410_stderr.txt" >>"$LOG"
log "step 1/4: ok (exit 0)"

log "step 2/4: cargo test -p traveltrust-api b449_ b451_"
( cd "$ROOT" && cargo test -p traveltrust-api b449_ -- --nocapture ) >>"$LOG" 2>&1
( cd "$ROOT" && cargo test -p traveltrust-api b451_ -- --nocapture ) >>"$LOG" 2>&1
log "step 2/4: ok"

log "step 3/4: Playwright p02–p05 (chromium, workers=1, PLAYWRIGHT_FULL_STACK=1)"
(
  cd "${ROOT}/frontend"
  export PLAYWRIGHT_FULL_STACK=1
  export PLAYWRIGHT_REUSE_API_SERVER=0
  npx playwright test \
    e2e/p02-tourist-order-create-list.spec.ts \
    e2e/p03-tourist-guide-accept.spec.ts \
    e2e/p04-bilateral-confirm.spec.ts \
    e2e/p05-confirm-final-escrow.spec.ts \
    --project=chromium --workers=1
) >>"$LOG" 2>&1
log "step 3/4: ok"

log "step 4/4: epic-f-normal-release-real.spec.ts (REST 链补充)"
(
  cd "${ROOT}/frontend"
  export PLAYWRIGHT_FULL_STACK=1
  export PLAYWRIGHT_REUSE_API_SERVER=0
  npx playwright test e2e/epic-f-normal-release-real.spec.ts --project=chromium --workers=1
) >>"$LOG" 2>&1
log "step 4/4: ok"

log "b473-seal-b460-tt-u03: ALL STEPS PASS"
echo "b473-seal-b460-tt-u03: ok" >&2
