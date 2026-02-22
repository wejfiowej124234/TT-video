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

# --- Frontend baseline security + determinism hints ---
web_index="crates/web/index.html"
[[ -f "$web_index" ]] || fail "missing $web_index"

grep -q "Content-Security-Policy" "$web_index" || fail "missing CSP meta in $web_index"
grep -q "meta name=\"referrer\"" "$web_index" || fail "missing referrer policy meta in $web_index"
grep -q "data-wasm-opt=\"z\"" "$web_index" || fail "missing data-wasm-opt=\"z\" in $web_index"

# --- Frontend manifest determinism (script must embed deterministic anchors) ---
manifest_script="scripts/build-frontend-manifest.sh"
[[ -f "$manifest_script" ]] || fail "missing $manifest_script"

grep -q "git_sha" "$manifest_script" || fail "frontend manifest script missing git commit anchor (git_sha)"
grep -q "Cargo.lock_sha256" "$manifest_script" || fail "frontend manifest script missing Cargo.lock sha256 anchor"

# --- Backend baseline security headers ---
api_main="crates/api/src/main.rs"
[[ -f "$api_main" ]] || fail "missing $api_main"

grep -q "security_headers_layer" "$api_main" || fail "API missing security_headers_layer middleware"
grep -q "x-content-type-options" "$api_main" || fail "API security headers missing x-content-type-options"

# --- Node supply-chain policy (only enforced if Node is introduced) ---
if [[ -f package.json ]]; then
  bash scripts/check-node-lock-policy.sh
fi

echo "OK: invariants passed"
