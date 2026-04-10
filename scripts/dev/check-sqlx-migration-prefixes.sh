#!/usr/bin/env bash
# Fail if two crates/api/migrations/*.sql files share the same numeric prefix (SQLx PK on version).
# Usage: from repo root, bash scripts/check-sqlx-migration-prefixes.sh
# Avoids mapfile for compatibility with macOS Bash 3.2.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MIG_DIR="$REPO_ROOT/crates/api/migrations"
if [ ! -d "$MIG_DIR" ]; then
  echo "check-sqlx-migration-prefixes: missing $MIG_DIR" >&2
  exit 1
fi
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
for f in "$MIG_DIR"/*.sql; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  prefix="${base%%_*}"
  case "$prefix" in
    *[!0-9]*) continue ;;
  esac
  echo "$prefix"
done | sort | uniq -d >"$TMP"
if [ -s "$TMP" ]; then
  echo "check-sqlx-migration-prefixes: duplicate migration version prefix(es) will break _sqlx_migrations PK:" >&2
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    echo "  $p:" >&2
    for f in "$MIG_DIR"/"${p}"_*.sql; do
      [ -f "$f" ] && echo "    $(basename "$f")" >&2
    done
  done <"$TMP"
  echo "Rename one file so each prefix is unique (lexicographic order = apply order)." >&2
  exit 1
fi
echo "check-sqlx-migration-prefixes: OK"
