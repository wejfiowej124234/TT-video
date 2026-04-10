#!/usr/bin/env bash
# 对账导出响应体 Ed25519 验签（200、Runbook §2.55；须 OpenSSL 3+）
# 用法: ./scripts/verify-reconcile-export-ed25519.sh <body_file> <sig_hex> <pubkey_hex_32bytes>
# 自检: ./scripts/verify-reconcile-export-ed25519.sh --self-test（CI / 无导出文件时验证 OpenSSL 路径）
# 签名: 响应头 x-traveltrust-reconcile-export-ed25519（128 hex = 64 字节）
# 公钥: GET /api/v1/meta → admin_exports.reconcile_export_ed25519_public_key_hex（64 hex = 32 字节）
set -euo pipefail

if [[ "${1:-}" == "--self-test" ]]; then
  TMPDIR="${TMPDIR:-/tmp}"
  TTD=$(mktemp -d "$TMPDIR/tt-ed25519-selftest.XXXXXX")
  trap 'rm -rf "$TTD"' EXIT
  openssl genpkey -algorithm ED25519 -out "$TTD/k.pem" 2>/dev/null
  printf '%s' 'traveltrust-reconcile-export-selftest' > "$TTD/body.txt"
  openssl pkeyutl -sign -inkey "$TTD/k.pem" -in "$TTD/body.txt" -out "$TTD/sig.bin" -rawin
  PUB_HEX=$(openssl pkey -in "$TTD/k.pem" -pubout -outform DER | tail -c 32 | xxd -p | tr -d '\n')
  SIG_HEX=$(xxd -p "$TTD/sig.bin" | tr -d '\n')
  exec bash "${BASH_SOURCE[0]}" "$TTD/body.txt" "$SIG_HEX" "$PUB_HEX"
fi

if [[ $# -ne 3 ]]; then
  echo "usage: $0 <export_body_file> <signature_hex> <ed25519_public_key_hex_64chars>" >&2
  exit 2
fi

BODY="$1"
SIG_HEX="$2"
PUB_HEX="$3"

if [[ ! -f "$BODY" ]]; then
  echo "error: body file not found: $BODY" >&2
  exit 2
fi

# 去掉可选 0x 前缀并转小写（与 API hex 编码一致）
normalize_hex() {
  local x="${1//0x/}"
  x="${x,,}"
  echo -n "$x" | tr -d '[:space:]'
}

SIG_HEX="$(normalize_hex "$SIG_HEX")"
PUB_HEX="$(normalize_hex "$PUB_HEX")"

if [[ ${#PUB_HEX} -ne 64 ]]; then
  echo "error: public key hex must be 64 characters (32 bytes), got ${#PUB_HEX}" >&2
  exit 2
fi
if [[ ${#SIG_HEX} -ne 128 ]]; then
  echo "error: signature hex must be 128 characters (64 bytes), got ${#SIG_HEX}" >&2
  exit 2
fi

# RFC 8410 SubjectPublicKeyInfo for Ed25519 (raw 32-byte public key)
SPKI_PREFIX="302a300506032b6570032100"

TMPDIR="${TMPDIR:-/tmp}"
PUB_DER="$(mktemp "$TMPDIR/tt-ed25519-pub.XXXXXX.der")"
SIG_BIN="$(mktemp "$TMPDIR/tt-ed25519-sig.XXXXXX.bin")"
cleanup() { rm -f "$PUB_DER" "$SIG_BIN"; }
trap cleanup EXIT

printf '%s' "${SPKI_PREFIX}${PUB_HEX}" | xxd -r -p >"$PUB_DER"
printf '%s' "$SIG_HEX" | xxd -r -p >"$SIG_BIN"

if openssl pkeyutl -verify -pubin -inkey "$PUB_DER" -in "$BODY" -sigfile "$SIG_BIN" -rawin; then
  echo "OK: Ed25519 signature matches body"
  exit 0
fi
echo "FAIL: Ed25519 verify rejected (wrong key, corrupted body, or OpenSSL <3?)" >&2
exit 1
