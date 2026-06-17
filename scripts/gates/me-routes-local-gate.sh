#!/usr/bin/env bash
# ① /me 子路由 page contract 闸
# SSOT: frontend/evidence/GO_local_marketing_front_closure/me-routes-local-gate.v1.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MAP="$ROOT/frontend/evidence/GO_local_marketing_front_closure/me-routes-local-gate.v1.json"

mapfile -t FILES < <(
  node -e "
    const m = require(process.argv[1]);
    const s = new Set();
    for (const row of m.routes || []) {
      for (const f of row.vitest || []) s.add(f);
    }
    [...s].sort().forEach((f) => console.log(f));
  " "$MAP"
)

echo "==> [me-routes-local-gate] vitest · ${#FILES[@]} files (/me identities + security)"
cd "$ROOT/frontend"
npx vitest run "${FILES[@]}"

echo ""
echo "TT_ME_ROUTES_LOCAL_GATE_SUMMARY: OK phase=local-1 routes=2"
