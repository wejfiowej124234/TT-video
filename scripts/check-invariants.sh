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
[[ -f "frontend/package-lock.json" ]] || fail "missing frontend/package-lock.json (lock file required)"

# --- Backend baseline security headers（挂载在 router，实现见 middleware）---
api_main="crates/api/src/main.rs"
api_router="crates/api/src/router.rs"
api_mw_headers="crates/api/src/middleware/auth_pause_metrics/mod.rs"
[[ -f "$api_main" ]] || fail "missing $api_main"
[[ -f "$api_router" ]] || fail "missing $api_router"
[[ -f "$api_mw_headers" ]] || fail "missing $api_mw_headers"

grep -q "security_headers_layer" "$api_router" || fail "API router missing security_headers_layer middleware"
grep -q "x-content-type-options" "$api_mw_headers" || fail "API security headers missing x-content-type-options"

# SSOT Guard CI v2：B-097 + B-110 静态门禁 + 响应快照契约（编排器写 target/ssot-guard-ci-v2-report.json）
# Windows Git Bash: `python3` may be a store stub (exit 49); fall back to `python`.
python3 "$root_dir/scripts/ssot-guard-ci-v2.py" \
  || python "$root_dir/scripts/ssot-guard-ci-v2.py" \
  || fail "ssot-guard-ci-v2.py failed (see target/ssot-guard-ci-v2-report.json)"

echo "OK: invariants passed"
