#!/usr/bin/env bash
# Community Media Guard — CI / pre-push guardrail (not PRM Blocker)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
export SKIP_COMMUNITY_MEDIA_GUARD_DB="${SKIP_COMMUNITY_MEDIA_GUARD_DB:-1}"
node scripts/dev/validate-community-media-guard.cjs
