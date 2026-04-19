#!/usr/bin/env bash
# **部署** **前** **SSOT** **预检** **占位** **：** **串联** **invariants** **/** **55-S13** **可读** **。**
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
bash scripts/check-invariants.sh
bash scripts/check-55-s13.sh
echo "ssot-deploy-preflight: ok" >&2
