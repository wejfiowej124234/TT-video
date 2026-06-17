#!/usr/bin/env bash
# Unix wrapper → Windows one-click local stack (①)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ -f "$ROOT/scripts/start-api-with-seed.bat" ]]; then
  cmd //c "scripts\\start-api-with-seed.bat" "$@"
  exit $?
fi
if [[ -f "$ROOT/scripts/dev/start-api-with-seed.bat" ]]; then
  cmd //c "scripts\\dev\\start-api-with-seed.bat" "$@"
  exit $?
fi
echo "start-api-with-seed: missing scripts/start-api-with-seed.bat (or scripts/dev/…)" >&2
exit 2
