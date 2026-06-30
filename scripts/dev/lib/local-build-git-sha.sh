#!/usr/bin/env bash
# Export git SHA for local API /meta build observability (① · non-staging).
# Source from dev API entrypoints; staging uses fly deploy --build-arg.
local_build_git_sha_export() {
  local root="${1:-}"
  [[ -n "$root" ]] || return 0
  if [[ -z "${TRAVELTRUST_GIT_SHA:-}" ]]; then
    export TRAVELTRUST_GIT_SHA="$(git -C "$root" rev-parse HEAD 2>/dev/null || echo unknown)"
  fi
  if [[ -z "${TRAVELTRUST_BUILD_GIT_SHA:-}" ]]; then
    export TRAVELTRUST_BUILD_GIT_SHA="${TRAVELTRUST_GIT_SHA}"
  fi
}
