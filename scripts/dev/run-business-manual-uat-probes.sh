#!/usr/bin/env bash
# Business Manual UAT — API probes (post Display Data Governance)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
ENV_LABEL="${ENV_LABEL:-auto}"
[[ "$ENV_LABEL" == "auto" ]] && { [[ "$API" == *staging* ]] && ENV_LABEL=staging || ENV_LABEL=local; }

fail() { echo "business-manual-uat-probes: FAIL [$ENV_LABEL] $*" >&2; exit 1; }
ok() { echo "business-manual-uat-probes: OK [$ENV_LABEL] $*"; }

env API="$API" ENV_LABEL="$ENV_LABEL" node "$ROOT/scripts/dev/business-manual-uat-probes.cjs"
ok "all probes passed"
