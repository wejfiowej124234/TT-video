#!/usr/bin/env bash
set -euo pipefail
_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$_here/ops/user-security-notifications-dispatch.sh" "$@"

