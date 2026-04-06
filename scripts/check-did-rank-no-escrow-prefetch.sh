#!/usr/bin/env bash
# DID 榜页面/组件域不得引用 orderEscrowPrefetch 或 stashEscrow（与托管 session 预填解耦）。
# 台账：07 §六 6.4 顶行 637 批；87 §11.1.1；trackDidRank*+Link 侧效仅限 analytics，勿混预填链。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

DIRS=(frontend/components/did-rank frontend/app/did-rank)
for d in "${DIRS[@]}"; do
  test -d "$d" || fail "missing directory $d"
done

scan_rg() {
  rg -n 'stashEscrow|orderEscrowPrefetch' "${DIRS[@]}" 2>/dev/null || true
}

scan_grep() {
  grep -RInE 'stashEscrow|orderEscrowPrefetch' "${DIRS[@]}" 2>/dev/null || true
}

if command -v rg >/dev/null 2>&1; then
  out="$(scan_rg)"
else
  out="$(scan_grep)"
fi

if [[ -n "${out}" ]]; then
  echo "FAIL: did-rank must not reference order escrow prefetch (stashEscrow / orderEscrowPrefetch)." >&2
  echo "${out}" >&2
  exit 1
fi

echo "OK: did-rank has no orderEscrowPrefetch / stashEscrow references."
