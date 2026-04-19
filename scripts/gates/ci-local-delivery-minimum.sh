#!/usr/bin/env bash
# TT-LOCAL-CI-DELIVERY-GATE-001 · 最小交付三连（不依赖 GitHub-hosted）
# 与 scripts/README.md「提交前自检三连」一致；在仓库根执行。
set -euo pipefail
_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$_root"
echo "==> cargo test -p traveltrust-api"
cargo test -p traveltrust-api
echo "==> run-check-04-routes"
bash scripts/run-check-04-routes.sh
echo "==> check-pr-crates-needs-metadata (main..HEAD)"
bash scripts/check-pr-crates-needs-metadata.sh main HEAD
echo "OK: ci-local-delivery-minimum"
