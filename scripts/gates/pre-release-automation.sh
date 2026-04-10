#!/usr/bin/env bash
# 发版前「机器可执行」聚合：不变量、55-S13、（可选）Forge ABI multiset。
# 不替代：缺口与待补-官方总表 P0 十二项、15 附录〇 人工勾选、08-4/08-2 签字、evidence 真实 bundle、53/55 维护人确认表。
# 用法（项目根）：
#   ./scripts/pre-release-automation.sh
#   SKIP_FORGE_VERIFY=1 ./scripts/pre-release-automation.sh   # 本机无 forge 时
#   CHECK_E2E_THREE_PACK=1 EVIDENCE_GO_DIR=evidence/GO_20260407 ./scripts/pre-release-automation.sh
#     # 可选（Epic F-10）：在末尾追加 F-06 结构校验；须已设 EVIDENCE_GO_DIR；失败=证据目录未就绪，非订单业务失败
#   CHECK_E2E_THREE_PACK_MANIFEST=1 …  # 同上且校验 manifest.json 登记三条 path（须 jq）
# Windows（等价）：.\scripts\pre-release-automation.ps1 ；无 forge：$env:SKIP_FORGE_VERIFY='1'
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"

echo "=== pre-release-automation: check-invariants ==="
bash scripts/check-invariants.sh

echo "=== pre-release-automation: 55-S13 ==="
bash scripts/check-55-s13.sh

echo "=== pre-release-automation: 04 API + 04/13-1 routes (app + doc subset) ==="
if bash scripts/run-check-04-routes.sh; then :; else
  pr=$?
  if [[ "$pr" == 2 ]]; then echo "pre-release-automation: skip 04 route check (no working python)"; else exit "$pr"; fi
fi

if [[ "${SKIP_FORGE_VERIFY:-}" == "1" ]]; then
  echo "=== pre-release-automation: SKIP_FORGE_VERIFY=1 — skipped verify-abi-forge ==="
elif command -v forge >/dev/null 2>&1; then
  echo "=== pre-release-automation: forge build + verify-abi-forge ==="
  (cd contracts && forge build)
  bash scripts/run-verify-abi-forge.sh
else
  echo "=== pre-release-automation: forge not in PATH — skipped verify-abi-forge (set SKIP_FORGE_VERIFY=1 to silence) ==="
fi

if [[ "${CHECK_E2E_THREE_PACK:-}" == "1" ]]; then
  echo "=== pre-release-automation: CHECK_E2E_THREE_PACK=1 — Epic F-06 check-e2e-three-pack-evidence ==="
  if [[ -z "${EVIDENCE_GO_DIR:-}" ]]; then
    echo "pre-release-automation: CHECK_E2E_THREE_PACK=1 requires EVIDENCE_GO_DIR (e.g. evidence/GO_20260407)" >&2
    exit 2
  fi
  if [[ "${CHECK_E2E_THREE_PACK_MANIFEST:-}" == "1" ]]; then
    export E2E_THREE_PACK_CHECK_MANIFEST=1
  else
    unset E2E_THREE_PACK_CHECK_MANIFEST
  fi
  bash scripts/check-e2e-three-pack-evidence.sh "$EVIDENCE_GO_DIR"
fi

echo ""
echo "pre-release-automation: 机器步骤完成。"
echo "须人工（不可替代）：缺口与待补-官方总表 P0、15 附录〇、53-收口-09-04-36-确认表、55 §八附续.9、08-4/08-2/evidence/Runbook。"
