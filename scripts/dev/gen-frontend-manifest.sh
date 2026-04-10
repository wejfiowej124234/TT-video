#!/usr/bin/env bash
# 51-D3：可验证发布 — 前端构建产物 manifest 生成
# 用法：在项目根目录执行；需先完成 frontend 构建：cd frontend && npm run build
# 输出：frontend/.next/build-manifest.json（路径与 sha256），可纳入 evidence/GO_YYYYMMDD/
# 可选：EVIDENCE_GO_DIR=evidence/GO_20260328 时另写入该目录 frontend-build-manifest.json + .sha256
# 详见：ops/RUNBOOK.md §2、evidence/README.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FE="${ROOT}/frontend"
NEXT="${FE}/.next"

if [ ! -d "$NEXT" ]; then
  echo "Missing ${NEXT}. Run: cd frontend && npm run build" >&2
  exit 1
fi

MANIFEST="${NEXT}/build-manifest.json"
DATE=$(date +%Y-%m-%d)

if command -v sha256sum >/dev/null 2>&1; then
  SUM_CMD=sha256sum
elif command -v shasum >/dev/null 2>&1; then
  SUM_CMD="shasum -a 256"
else
  echo "Need sha256sum or shasum" >&2
  exit 1
fi

TMP_ARTIFACTS=$(mktemp)
trap 'rm -f "$TMP_ARTIFACTS"' EXIT

if [ -f "${NEXT}/BUILD_ID" ]; then
  H=$($SUM_CMD < "${NEXT}/BUILD_ID" | awk '{print $1}')
  echo "{\"path\": \".next/BUILD_ID\", \"sha256\": \"${H}\"}" >> "$TMP_ARTIFACTS"
fi
if [ -d "${NEXT}/static" ]; then
  nf=$(find "${NEXT}/static" -type f 2>/dev/null | wc -l | tr -d ' ')
  if [ "${nf:-0}" -gt 0 ]; then
    H=$(cd "$NEXT" && find static -type f | sort | xargs cat 2>/dev/null | $SUM_CMD | awk '{print $1}')
    echo "{\"path\": \".next/static\", \"sha256\": \"${H}\"}" >> "$TMP_ARTIFACTS"
  fi
fi

# 输出符合 evidence/README 的 manifest 格式
{
  echo "{"
  echo "  \"gate\": \"Gate-5\","
  echo "  \"date\": \"${DATE}\","
  if [ ! -s "$TMP_ARTIFACTS" ]; then
    echo "  \"artifacts\": [],"
  else
    echo "  \"artifacts\": ["
    awk 'NR>1{print ","} {print "    " $0}' "$TMP_ARTIFACTS"
    echo ""
    echo "  ],"
  fi
  echo "  \"sign_off\": [\"发版人\"]"
  echo "}"
} > "$MANIFEST"

echo "Wrote ${MANIFEST}"
if command -v jq >/dev/null 2>&1; then
  jq . "$MANIFEST" >/dev/null && echo "JSON valid."
fi

if [ -n "${EVIDENCE_GO_DIR:-}" ]; then
  mkdir -p "$EVIDENCE_GO_DIR"
  DEST="$EVIDENCE_GO_DIR/frontend-build-manifest.json"
  cp "$MANIFEST" "$DEST"
  (cd "$(dirname "$DEST")" && $SUM_CMD "$(basename "$DEST")" | awk '{print $1}' > "${DEST}.sha256")
  echo "Copied manifest to ${DEST} (+ .sha256)"
fi

echo "Tip: cp ${MANIFEST} evidence/GO_YYYYMMDD/frontend-build-manifest.json && (cd evidence/GO_YYYYMMDD && sha256sum frontend-build-manifest.json > frontend-build-manifest.json.sha256)"
