#!/usr/bin/env bash
# P5-2-C1：只读运维入口 — 调用已封口的 **`GET /api/v1/admin/region-vault/forwarded-events/export`**，
# 将响应体与完整性响应头落盘；**不**改 API / 索引器 / 投影表。
#
# 环境变量：
#   ADMIN_BEARER_TOKEN   — **必填**（Admin session，**勿**写入仓库；与 **`indexer-public-snapshot.sh`** 同形，**不含** `Bearer ` 前缀）
#   API_BASE_URL         — 可选，默认 `http://127.0.0.1:8080`
#   VAULT_EXPORT_FORMAT  — 可选 `csv`|`json`，默认 `csv`
#   VAULT_EXPORT_CHAIN_ID — 可选，query `chain_id`
#   VAULT_EXPORT_LIMIT    — 可选，query `limit`（1～2000）
#   VAULT_EXPORT_OUT_DIR  — 可选；默认 `./vault-forwarded-export-<UTC>`
#
# 产物（均在 `VAULT_EXPORT_OUT_DIR`）：
#   region-vault-forwarded-events.csv | .json     — 响应体
#   region-vault-forwarded-events.export.headers.txt — 原始响应头（curl -D）
#   region-vault-forwarded-events.export.sha256    — 单行 hex，与头 **`x-traveltrust-reconcile-export-sha256`** 一致
#   region-vault-forwarded-events.export.ed25519   — 若存在头 **`x-traveltrust-reconcile-export-ed25519`**
#   region-vault-forwarded-events.export.truncated — 若存在头 **`x-traveltrust-reconcile-export-truncated`**
#
# 退出码：0 成功；2 用法/环境；3 HTTP 非 200 或缺 SHA256 头；4 体空或 SHA256 与侧车/头不一致
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
FMT_RAW="${VAULT_EXPORT_FORMAT:-csv}"

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "vault-forwarded-export-fetch: set ADMIN_BEARER_TOKEN (Admin bearer without 'Bearer ' prefix)" >&2
  exit 2
fi

fmt="$(printf '%s' "$FMT_RAW" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
if [[ "$fmt" != "csv" && "$fmt" != "json" ]]; then
  echo "vault-forwarded-export-fetch: VAULT_EXPORT_FORMAT must be csv or json" >&2
  exit 2
fi

ext="$fmt"
if [[ -n "${VAULT_EXPORT_OUT_DIR:-}" ]]; then
  OUT_DIR="$VAULT_EXPORT_OUT_DIR"
else
  OUT_DIR="$(pwd)/vault-forwarded-export-$(date -u +%Y%m%dT%H%M%SZ)"
fi
mkdir -p "$OUT_DIR"

BASE="${API_BASE_URL%/}"
Q="format=${fmt}"
if [[ -n "${VAULT_EXPORT_CHAIN_ID:-}" ]]; then
  Q="${Q}&chain_id=${VAULT_EXPORT_CHAIN_ID}"
fi
if [[ -n "${VAULT_EXPORT_LIMIT:-}" ]]; then
  Q="${Q}&limit=${VAULT_EXPORT_LIMIT}"
fi
URL="${BASE}/api/v1/admin/region-vault/forwarded-events/export?${Q}"

BODY="${OUT_DIR}/region-vault-forwarded-events.${ext}"
HDR="${OUT_DIR}/region-vault-forwarded-events.export.headers.txt"
SHA_SIDE="${OUT_DIR}/region-vault-forwarded-events.export.sha256"
ED_SIDE="${OUT_DIR}/region-vault-forwarded-events.export.ed25519"
TR_SIDE="${OUT_DIR}/region-vault-forwarded-events.export.truncated"

rm -f "$ED_SIDE" "$TR_SIDE"

http_code="$(
  curl -sS -o "$BODY" -D "$HDR" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "$URL"
)"

if [[ "$http_code" != "200" ]]; then
  echo "vault-forwarded-export-fetch: HTTP ${http_code} (expected 200); body at ${BODY}; headers at ${HDR}" >&2
  exit 3
fi

extract_hdr() {
  local f="$1" want="$2"
  local l key val
  want="${want,,}"
  while IFS= read -r l || [[ -n "$l" ]]; do
    l="${l%$'\r'}"
    [[ "$l" == *:* ]] || continue
    key="${l%%:*}"
    [[ "${key,,}" == "$want" ]] || continue
    val="${l#*:}"
    val="${val#"${val%%[![:space:]]*}"}"
    val="${val%"${val##*[![:space:]]}"}"
    printf '%s' "$val"
    return 0
  done <"$f"
  printf ''
}

sha_hdr="$(extract_hdr "$HDR" "x-traveltrust-reconcile-export-sha256")"
sha_hdr="$(printf '%s' "$sha_hdr" | tr 'A-F' 'a-f' | tr -d '[:space:]')"

if [[ -z "$sha_hdr" ]]; then
  echo "vault-forwarded-export-fetch: missing response header x-traveltrust-reconcile-export-sha256" >&2
  exit 3
fi
if [[ ${#sha_hdr} -ne 64 ]]; then
  echo "vault-forwarded-export-fetch: invalid x-traveltrust-reconcile-export-sha256 length (${#sha_hdr}), expected 64 hex chars" >&2
  exit 3
fi

printf '%s\n' "$sha_hdr" >"$SHA_SIDE"

ed_hdr="$(extract_hdr "$HDR" "x-traveltrust-reconcile-export-ed25519")"
ed_hdr="$(printf '%s' "$ed_hdr" | tr 'A-F' 'a-f' | tr -d '[:space:]')"
if [[ -n "$ed_hdr" ]]; then
  printf '%s\n' "$ed_hdr" >"$ED_SIDE"
fi

tr_hdr="$(extract_hdr "$HDR" "x-traveltrust-reconcile-export-truncated")"
tr_hdr="$(printf '%s' "$tr_hdr" | tr -d '[:space:]\r')"
if [[ -n "$tr_hdr" ]]; then
  printf '%s\n' "$tr_hdr" >"$TR_SIDE"
fi

if [[ ! -s "$BODY" ]]; then
  echo "vault-forwarded-export-fetch: response body is empty" >&2
  exit 4
fi

body_sha() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum -b "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

computed="$(body_sha "$BODY" | tr 'A-F' 'a-f')"
side="$(tr 'A-F' 'a-f' <"$SHA_SIDE" | tr -d '[:space:]')"

if [[ "$computed" != "$sha_hdr" ]]; then
  echo "vault-forwarded-export-fetch: body sha256 ${computed} != header ${sha_hdr}" >&2
  exit 4
fi
if [[ "$computed" != "$side" ]]; then
  echo "vault-forwarded-export-fetch: body sha256 ${computed} != sidecar ${side}" >&2
  exit 4
fi

echo "vault-forwarded-export-fetch: OK → ${OUT_DIR}"
echo "  body: region-vault-forwarded-events.${ext}"
echo "  sha256 sidecar matches header and body"
