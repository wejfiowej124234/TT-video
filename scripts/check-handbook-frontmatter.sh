#!/usr/bin/env bash
# Wrapper (repo root): handbook frontmatter gate → scripts/gates/
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
exec bash scripts/gates/check-handbook-frontmatter.sh "$@"
