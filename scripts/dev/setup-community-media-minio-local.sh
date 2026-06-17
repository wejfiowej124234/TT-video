#!/usr/bin/env bash
# ① 本地：起 MinIO（docker compose）→ 建桶 → CORS → 打印/合并根 .env 社区视频变量。
# 用法：bash scripts/dev/setup-community-media-minio-local.sh
# 改 .env 后须重启 traveltrust-api（或重跑 scripts/dev/start-api-with-seed.bat）。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

MINIO_API_PORT="${MINIO_API_PORT:-19000}"
MINIO_CONSOLE_PORT="${MINIO_CONSOLE_PORT:-19001}"
BUCKET="${COMMUNITY_MEDIA_S3_BUCKET:-traveltrust-community-media}"
MC_USER="${MINIO_ROOT_USER:-minio}"
MC_PASS="${MINIO_ROOT_PASSWORD:-minio12345}"
PUBLIC_BASE="http://127.0.0.1:${MINIO_API_PORT}/${BUCKET}"
FRONTEND_ORIGINS="${COMMUNITY_MEDIA_CORS_ORIGINS:-http://localhost:3012,http://127.0.0.1:3012,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001}"

echo "==> docker compose up -d minio (evidence/community-media-local-minio-chain)"
COMPOSE_FILE="$ROOT/evidence/community-media-local-minio-chain/docker-compose.yml"
if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "missing $COMPOSE_FILE" >&2
  exit 1
fi
docker compose -f "$COMPOSE_FILE" up -d minio

echo "==> wait MinIO (${MINIO_API_PORT})"
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${MINIO_API_PORT}/minio/health/live" >/dev/null 2>&1; then
    echo "minio: ready ($i)"
    break
  fi
  sleep 2
  if [[ "$i" -eq 30 ]]; then
    echo "minio: TIMEOUT" >&2
    exit 1
  fi
done

IFS=',' read -ra ORIG_ARR <<< "$FRONTEND_ORIGINS"
CORS_ORIGINS_CSV="$(IFS=','; echo "${ORIG_ARR[*]}")"

echo "==> mc: bucket + 全局 CORS（社区版 MinIO **不支持** \`mc cors set\` 桶级 API，用 api.cors_allow_origin）"
docker exec traveltrust-community-minio-evidence mc alias set local http://127.0.0.1:9000 "${MC_USER}" "${MC_PASS}" 2>/dev/null || true
docker exec traveltrust-community-minio-evidence mc mb "local/${BUCKET}" --ignore-existing 2>/dev/null || true
docker exec traveltrust-community-minio-evidence mc admin config set local api "cors_allow_origin=${CORS_ORIGINS_CSV}"
docker restart traveltrust-community-minio-evidence >/dev/null
echo "==> wait MinIO after CORS restart"
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${MINIO_API_PORT}/minio/health/live" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec traveltrust-community-minio-evidence mc admin config get local api 2>/dev/null | grep -o 'cors_allow_origin=[^ ]*' || true
docker exec traveltrust-community-minio-evidence mc ls local/ 2>/dev/null || true

SNIPPET="$ROOT/scripts/dev/community-media-minio-local.env.snippet"
cat > "$SNIPPET" <<EOF
# --- 社区视频 MinIO 本地（由 setup-community-media-minio-local.sh 生成）---
COMMUNITY_MEDIA_S3_BUCKET=${BUCKET}
COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=${PUBLIC_BASE}
COMMUNITY_MEDIA_S3_ENDPOINT=http://127.0.0.1:${MINIO_API_PORT}
COMMUNITY_MEDIA_S3_REGION=us-east-1
COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE=1
AWS_ACCESS_KEY_ID=${MC_USER}
AWS_SECRET_ACCESS_KEY=${MC_PASS}
TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=${PUBLIC_BASE},http://127.0.0.1:${MINIO_API_PORT}
NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=${PUBLIC_BASE},http://127.0.0.1:${MINIO_API_PORT}
EOF

ENV_FILE="$ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^COMMUNITY_MEDIA_S3_BUCKET=' "$ENV_FILE" 2>/dev/null; then
    echo "==> .env 已有 COMMUNITY_MEDIA_S3_BUCKET，请手动对照 $SNIPPET"
  else
    echo "" >> "$ENV_FILE"
    cat "$SNIPPET" >> "$ENV_FILE"
    echo "==> 已追加到 $ENV_FILE"
  fi
else
  echo "==> 无根 .env；请复制 $SNIPPET 内容"
fi

echo ""
echo "MinIO API:     http://127.0.0.1:${MINIO_API_PORT}"
echo "MinIO Console: http://127.0.0.1:${MINIO_CONSOLE_PORT}  (${MC_USER} / ${MC_PASS})"
echo "验证: curl -sS http://127.0.0.1:8080/api/v1/community/media/capabilities | jq .public_video_publish_ready"
echo "（须重启 API 后 public_video_publish_ready 才可能为 true）"
