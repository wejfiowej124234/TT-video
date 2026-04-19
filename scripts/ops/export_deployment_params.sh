#!/usr/bin/env bash
# 17 条 #5 / checklist-17：产出可附入 evidence/GO_YYYYMMDD/ 或 08-3 的部署与构建快照。
# forge inspect 覆盖：Escrow、EscrowFactory、GuideIdentityStakingPool、Registry、FeeRouter、MockERC20（与 contracts/src 一致）。
# 用法：项目根执行 ./scripts/export_deployment_params.sh
#       或 ./scripts/export_deployment_params.sh path/to/deployment-params.txt
# Windows：.\scripts\export_deployment_params.ps1 [out.txt]
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTRACTS="$ROOT/contracts"
OUT="${1:-}"

section() {
  echo ""
  echo "=== $* ==="
}

emit() {
  if [[ -n "$OUT" ]]; then
    tee "$OUT"
  else
    cat
  fi
}

{
  section "meta"
  echo "exported_utc: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "repo_root: $ROOT"
  (cd "$ROOT" && git rev-parse HEAD 2>/dev/null | sed 's/^/git_commit: /' || echo "git_commit: n/a")

  section "contracts / forge"
  if command -v forge >/dev/null 2>&1; then
    forge --version | sed 's/^/forge_version: /'
    (cd "$CONTRACTS" && forge build)
    for c in Escrow EscrowFactory GuideIdentityStakingPool Registry FeeRouter MockERC20; do
      blen=$(cd "$CONTRACTS" && forge inspect "$c" bytecode 2>/dev/null | wc -c | tr -d ' ' || echo "0")
      echo "bytecode_chars_$c: $blen"
    done
  else
    echo "forge: not in PATH — install Foundry, then re-run for bytecode lengths"
  fi

  section "optional slither"
  echo "Run: cd contracts && slither . --json slither-report.json"
  echo "Attach slither-report.json or this file to evidence/GO_YYYYMMDD/ per checklist-17 #5."
} | emit
