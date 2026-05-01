#!/usr/bin/env bash
# Shared helpers for vertical-slice * public smoke scripts.
# Sourced by other gates; do not run directly.

# GET /meta can exceed the API TimeoutLayer under cold chain/RPC; server returns 408. Brief retries stabilize ① gates.
HTTP_SMOKE_RETRIES="${HTTP_SMOKE_RETRIES:-5}"
HTTP_SMOKE_RETRY_DELAY_SECS="${HTTP_SMOKE_RETRY_DELAY_SECS:-2}"

http_get_with_retry() {
  local url="$1"
  local label="$2"
  local i=1
  while (( i <= HTTP_SMOKE_RETRIES )); do
    local body=""
    if body="$(curl -sfS "$url" 2>/dev/null)"; then
      printf '%s' "$body"
      return 0
    fi
    if (( i < HTTP_SMOKE_RETRIES )); then
      echo "note: ${label} GET failed (attempt ${i}/${HTTP_SMOKE_RETRIES}); retry in ${HTTP_SMOKE_RETRY_DELAY_SECS}s" >&2
      sleep "${HTTP_SMOKE_RETRY_DELAY_SECS}"
    fi
    i=$((i + 1))
  done
  curl -sfS "$url"
}
