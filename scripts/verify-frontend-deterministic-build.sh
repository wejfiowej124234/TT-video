#!/usr/bin/env bash
# Deterministic build verifier (05 §7.7 / 08-4 第 7 章, W-Q6-FE)
# Goal: 同 commit + 同工具链 + 同依赖锁 → 产物 hash 一致。
#
# 用法：
#   scripts/verify-frontend-deterministic-build.sh
# 输出：
#   - 在两个临时 dist 目录生成 manifest.json + manifest.sha256
#   - 比较 manifest.sha256；相同则 OK，不同则 FAIL

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v trunk >/dev/null 2>&1; then
  echo "ERR: trunk 未安装，无法验证 deterministic build。"
  echo "     安装示例: cargo install trunk --locked"
  exit 2
fi

if ! command -v sha256sum >/dev/null 2>&1; then
  echo "ERR: 缺少 sha256sum（用于生成 manifest.sha256），请在 Git Bash / WSL 环境运行。"
  exit 2
fi

tmp1="$(mktemp -d 2>/dev/null || true)"
tmp2="$(mktemp -d 2>/dev/null || true)"
if [ -z "$tmp1" ] || [ -z "$tmp2" ] || [ ! -d "$tmp1" ] || [ ! -d "$tmp2" ]; then
  echo "ERR: mktemp 不可用；请在支持 mktemp 的 shell 运行（Git Bash/WSL）。"
  exit 2
fi

cleanup() {
  rm -rf "$tmp1" "$tmp2" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "== build #1 =="
pushd crates/web >/dev/null
trunk build --release --dist "$tmp1"
popd >/dev/null
scripts/build-frontend-manifest.sh "$tmp1" >/dev/null

echo "== build #2 =="
pushd crates/web >/dev/null
trunk build --release --dist "$tmp2"
popd >/dev/null
scripts/build-frontend-manifest.sh "$tmp2" >/dev/null

sha1="$(cat "$tmp1/manifest.sha256" | tr -d '\r\n')"
sha2="$(cat "$tmp2/manifest.sha256" | tr -d '\r\n')"

echo "build1 manifest.sha256=$sha1"
echo "build2 manifest.sha256=$sha2"

if [ "$sha1" = "$sha2" ]; then
  echo "OK: deterministic build verified (same commit => same manifest hash)"
  exit 0
fi

echo "FAIL: manifest hash differs; build is NOT deterministic under current toolchain/env."
echo "Hint: 检查 rust-toolchain、Cargo.lock、trunk/wasm-opt 版本与构建参数是否漂移。"
exit 1
