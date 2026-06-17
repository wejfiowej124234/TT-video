#!/usr/bin/env bash
# ① 治理矩阵本地闸（93 · C-GOV 切片）
# SSOT: frontend/evidence/GO_local_marketing_front_closure/governance-matrix-local-gate.v1.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MAP="$ROOT/frontend/evidence/GO_local_marketing_front_closure/governance-matrix-local-gate.v1.json"

mapfile -t FILES < <(
  node -e "
    const m = require(process.argv[1]);
    const s = new Set();
    for (const row of m.rows || []) {
      for (const f of row.vitest || []) s.add(f);
    }
    for (const f of m.epic_a_companion || []) s.add(f);
    [...s].sort().forEach((f) => console.log(f));
  " "$MAP"
)

echo "==> [governance-matrix-local-gate] vitest · ${#FILES[@]} files (93 C-GOV slice)"
cd "$ROOT/frontend"
npx vitest run "${FILES[@]}"

echo ""
echo "TT_GOVERNANCE_MATRIX_LOCAL_GATE_SUMMARY: OK phase=local-1 matrix=93-C-GOV-slice"
