#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

# --- Deterministic build / toolchain ---
[[ -f rust-toolchain.toml ]] || fail "missing rust-toolchain.toml (toolchain must be pinned)"

# --- Frontend (Next.js) presence ---
[[ -d "frontend" ]] || fail "missing frontend/ (Next.js app root)"
[[ -f "frontend/package.json" ]] || fail "missing frontend/package.json"

# --- Frontend manifest determinism (script must embed deterministic anchors) ---
manifest_script="scripts/build-frontend-manifest.sh"
[[ -f "$manifest_script" ]] || fail "missing $manifest_script"

grep -q "git_sha" "$manifest_script" || fail "frontend manifest script missing git commit anchor (git_sha)"
grep -q "frontend_lock_sha256\|lock_sha256" "$manifest_script" || fail "frontend manifest script missing lock sha256 anchor"

# --- Backend baseline security headers ---
api_main="crates/api/src/main.rs"
[[ -f "$api_main" ]] || fail "missing $api_main"

grep -q "security_headers_layer" "$api_main" || fail "API missing security_headers_layer middleware"
grep -q "x-content-type-options" "$api_main" || fail "API security headers missing x-content-type-options"

# --- Node supply-chain policy（前端为 Next.js，须过锁文件与版本规则）---
if [[ -d frontend ]] && [[ -f frontend/package.json ]]; then
  bash scripts/check-node-lock-policy.sh
fi

echo "OK: invariants passed"
