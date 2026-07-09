#!/usr/bin/env bash
# DEPRECATED for Phase ② Staging — use configure-staging-media-r2-cdn.sh (R2 + CDN) instead.
# Incident-only: short-term localtunnel → local MinIO when R2 not yet provisioned.
#
#   bash scripts/dev/restore-c4-staging-media-tunnel.sh   # NOT recommended
#   bash scripts/dev/configure-staging-media-r2-cdn.sh    # recommended
#
# SSOT: docs/runbook/TT-MEDIA-THREE-TIER-ARCHITECTURE.md
set -euo pipefail

echo "WARN: restore-c4-staging-media-tunnel is DEPRECATED for Staging — migrate to R2+CDN" >&2

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SECRETS_ONLY=0
[[ "${1:-}" == "--secrets-only" ]] && SECRETS_ONLY=1

MINIO_PORT="${MINIO_API_PORT:-19000}"
BUCKET="${COMMUNITY_MEDIA_S3_BUCKET:-traveltrust-community-media}"
MC_USER="${MINIO_ROOT_USER:-minio}"
MC_PASS="${MINIO_ROOT_PASSWORD:-minio12345}"
FLY_APP="${FLY_API_APP:-tt-api-staging}"
TUNNEL_PORT="${C4_MINIO_TUNNEL_PORT:-$MINIO_PORT}"
EVID="${C4_TUNNEL_EVID:-$ROOT/evidence/GO_staging_infra_console_errors/latest-c4-tunnel}"
TUNNEL_LOG="$EVID/localtunnel.log"
TUNNEL_PID="$EVID/localtunnel.pid"

mkdir -p "$EVID"

ok() { echo "OK: $*"; }
fail() { echo "FAIL: $*" >&2; exit 1; }

wait_minio() {
  for _ in $(seq 1 45); do
    if curl -sf "http://127.0.0.1:${MINIO_PORT}/minio/health/live" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

start_minio() {
  if wait_minio; then
    ok "MinIO already live on :${MINIO_PORT}"
    return
  fi
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$ROOT/scripts/dev/ensure-community-media-minio.ps1" \
      || fail "ensure-community-media-minio.ps1"
  else
    fail "MinIO not running and powershell unavailable — start traveltrust-community-minio-evidence on :${MINIO_PORT}"
  fi
  wait_minio || fail "MinIO did not become healthy on :${MINIO_PORT}"
  ok "MinIO healthy :${MINIO_PORT}"
}

start_tunnel() {
  if [[ -f "$TUNNEL_PID" ]]; then
    old_pid="$(cat "$TUNNEL_PID" 2>/dev/null || true)"
    old_url="$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$TUNNEL_LOG" 2>/dev/null | tail -1 || true)"
    if [[ -n "$old_pid" && -n "$old_url" ]] && kill -0 "$old_pid" 2>/dev/null; then
      if curl -sfI -H "Bypass-Tunnel-Reminder: true" "${old_url}/minio/health/live" 2>/dev/null | head -1 | grep -q 200; then
        ok "reuse localtunnel pid=$old_pid url=$old_url"
        echo "$old_url"
        return
      fi
    fi
  fi
  npx --yes localtunnel --port "$TUNNEL_PORT" >"$TUNNEL_LOG" 2>&1 &
  echo $! >"$TUNNEL_PID"
  sleep 3
  TUNNEL_URL="$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$TUNNEL_LOG" | tail -1 || true)"
  [[ -n "$TUNNEL_URL" ]] || fail "localtunnel did not print URL — see $TUNNEL_LOG"
  for _ in $(seq 1 20); do
    if curl -sfI -H "Bypass-Tunnel-Reminder: true" "${TUNNEL_URL}/minio/health/live" | head -1 | grep -q 200; then
      ok "localtunnel url=$TUNNEL_URL"
      echo "$TUNNEL_URL"
      return
    fi
    sleep 2
  done
  fail "localtunnel ${TUNNEL_URL} did not proxy MinIO health"
}

sync_fly_secrets() {
  local tunnel_url="$1"
  local public_base="${tunnel_url}/${BUCKET}"
  local endpoint="${tunnel_url}"
  command -v fly >/dev/null 2>&1 || fail "fly CLI not found"
  fly secrets set -a "$FLY_APP" \
    "COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=${public_base}" \
    "COMMUNITY_MEDIA_S3_ENDPOINT=${endpoint}" \
    "COMMUNITY_MEDIA_S3_BUCKET=${BUCKET}" \
    "COMMUNITY_MEDIA_S3_REGION=us-east-1" \
    "COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE=1" \
    "AWS_ACCESS_KEY_ID=${MC_USER}" \
    "AWS_SECRET_ACCESS_KEY=${MC_PASS}" \
    "TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=${public_base},${tunnel_url}" \
    --stage
  fly apps restart "$FLY_APP"
  ok "Fly secrets staged + restart requested for $FLY_APP"
  cat >"$EVID/fly-secrets-sync.json" <<EOF
{
  "fly_app": "${FLY_APP}",
  "COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL": "${public_base}",
  "COMMUNITY_MEDIA_S3_ENDPOINT": "${endpoint}",
  "tunnel_url": "${tunnel_url}",
  "note": "short-term localtunnel→MinIO; long-term migrate R2/S3/CDN"
}
EOF
}

if [[ "$SECRETS_ONLY" -eq 0 ]]; then
  start_minio
  TUNNEL_URL="$(start_tunnel)"
else
  TUNNEL_URL="${C4_MINIO_TUNNEL_URL:-}"
  [[ -n "$TUNNEL_URL" ]] || TUNNEL_URL="$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$TUNNEL_LOG" 2>/dev/null | tail -1 || true)"
  [[ -n "$TUNNEL_URL" ]] || fail "set C4_MINIO_TUNNEL_URL or run without --secrets-only"
fi

sync_fly_secrets "$TUNNEL_URL"
echo "C4_MINIO_TUNNEL_URL=$TUNNEL_URL"
echo "restore-c4-staging-media-tunnel: OK"
