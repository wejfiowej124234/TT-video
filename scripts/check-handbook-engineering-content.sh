#!/usr/bin/env bash
# Wrapper (repo root): handbook engineering content gate → scripts/gates/
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
exec bash scripts/gates/check-handbook-engineering-content.sh "$@"
