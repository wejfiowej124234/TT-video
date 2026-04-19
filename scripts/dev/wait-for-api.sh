#!/usr/bin/env bash
# Poll /health until 200. Usage: PORT=8080 bash scripts/dev/wait-for-api.sh
set -euo pipefail
PORT="${PORT:-8080}"
MAX="${WAIT_API_MAX_ATTEMPTS:-60}"
SLEEP="${WAIT_API_INTERVAL_SEC:-2}"
URL="http://127.0.0.1:${PORT}/health"
for ((i = 1; i <= MAX; i++)); do
  code="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 "$URL" 2>/dev/null || echo "000")"
  if [[ "$code" == "200" ]]; then
    echo "wait-for-api: OK $URL ($i attempts)"
    exit 0
  fi
  echo "wait-for-api: waiting ($i/$MAX)..."
  sleep "$SLEEP"
done
echo "wait-for-api: TIMEOUT $URL" >&2
exit 1
