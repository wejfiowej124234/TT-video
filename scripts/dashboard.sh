#!/usr/bin/env bash
# Fixed entry · TravelTrust Dashboard System
exec node "$(dirname "$0")/dev/dashboard.cjs" "$@"
