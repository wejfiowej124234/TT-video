#!/usr/bin/env bash
# 串联 check-04-routes-vs-code.py、check-04-frontend-routes-vs-app.py、check-13-1-table1-routes-vs-app.py、
# check-13-1-routes-covered-by-04-frontend-table.py
#
# 冻结口径（工程约定）：以本脚本 exit 0 作为 docs/spec/04 与 docs/spec/14 当前「路由机读契约」验收冻结点
#（含 §3.4/14 表结构与为 B450～B457 等门禁服务的字面锚点）。不在同一 PR 内混做「版式/可读性重排」与上述锚点变更；
# 若仅优化 04/14 排版或拆表，须另开独立 PR，且仍须保持本串联绿。默认不再提交「仅为扩写锚点、无路由真值变更」的 04/14 文档 PR。
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"
pick_py() {
  if [[ -n "${PYTHON:-}" ]] && command -v "${PYTHON}" >/dev/null 2>&1 && "${PYTHON}" -c "import sys" >/dev/null 2>&1; then
    echo "${PYTHON}"
    return 0
  fi
  for c in python python3; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys" >/dev/null 2>&1; then
      echo "$c"
      return 0
    fi
  done
  return 1
}
py="$(pick_py)" || {
  echo "run-check-04-routes: need working python or python3 on PATH (or set PYTHON)" >&2
  exit 2
}
# 与 Build CI 一致：默认 STRICT_WARNINGS=1（未在 04 §3.4 登记的公开 /api/v1 路由将导致失败）
export STRICT_WARNINGS="${STRICT_WARNINGS:-1}"
"$py" scripts/gates/check-04-routes-vs-code.py
"$py" scripts/gates/check-04-frontend-routes-vs-app.py
"$py" scripts/gates/check-13-1-table1-routes-vs-app.py
"$py" scripts/gates/check-13-1-routes-covered-by-04-frontend-table.py
# B-432 / TT-B432: governance closeloop UI surface (complements 04 §3.4; does not replace it)
"$py" scripts/gates/check-b432-governance-ui-ssot-surface.py
# B-450 / TT-B450: POST …/reviews weight* SSOT anchors (04 / 14 / frontend types)
"$py" scripts/gates/check-b450-review-post-ssot-doc-anchors.py
# B-451 / TT-B451: review JSON contract schema_version / evolution anchors (04 / 14 / reviews.rs)
"$py" scripts/gates/check-b451-review-json-contract-evolution-gate.py
# B-452 / TT-B452: client-side parse + degrade (frontend reviewJsonContract + orders.ts)
"$py" scripts/gates/check-b452-review-json-contract-client-gate.py
# B-453 / TT-B453: degrade counters + trackReviewJsonContractDegrade (observability + release gate)
"$py" scripts/gates/check-b453-review-json-contract-observability-gate.py
# B-454 / TT-B454: degrade evidence replay + post-release runbook gate
"$py" scripts/gates/check-b454-review-json-contract-degrade-evidence-gate.py
# B-455 / TT-B455: gray rollout thresholds + eval-b455 + rollback strategy runbook gate
"$py" scripts/gates/check-b455-review-json-contract-rollout-gate.py
# B-456 / TT-B456: release controller + GHA workflow + b456 config gate
"$py" scripts/gates/check-b456-review-json-contract-release-controller-gate.py
# B-457 / TT-B457: adapter layer + execution_receipt + workflow evidence gate
"$py" scripts/gates/check-b457-review-json-contract-release-adapter-gate.py
