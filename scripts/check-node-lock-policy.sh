#!/usr/bin/env bash
# **Node lockfile** **策略** **占位** **门禁** **：** **与** **frontend/package-lock.json** **同读** **。**
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ ! -f frontend/package-lock.json ]]; then
  echo "check-node-lock-policy: frontend/package-lock.json missing" >&2
  exit 1
fi
echo "check-node-lock-policy: ok (package-lock.json present)" >&2
