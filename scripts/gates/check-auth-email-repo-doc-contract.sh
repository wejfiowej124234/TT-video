#!/usr/bin/env bash
# Auth 邮件：仓库 `.env*` 与实现（off/log/resend）契约回归（不触网、不读根 .env 密钥）。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
cargo test -p traveltrust-api read_email_transport_tests --quiet
cargo test -p traveltrust-api resend_from_env_key_tests --quiet
exec cargo test -p traveltrust-api auth_email_repo_doc_contract_tests --quiet
