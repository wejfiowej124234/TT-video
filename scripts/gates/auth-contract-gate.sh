#!/usr/bin/env bash
set -euo pipefail

# Auth contract gate:
# - login/register/logout/session contract slices must stay green
# - keep this focused so auth regressions fail fast

echo "[auth-contract-gate] running auth contract test slices..."

cargo test -p traveltrust-api session_cookie::tests
cargo test -p traveltrust-api auth_logout_api_tests::
cargo test -p traveltrust-api auth_register_login_logout_db_api_tests::

echo "[auth-contract-gate] ok"

