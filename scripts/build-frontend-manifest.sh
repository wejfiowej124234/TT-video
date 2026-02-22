#!/usr/bin/env bash
# 前端可验证发布（deterministic manifest）：在 frontend 构建产物目录生成 manifest.json 与 manifest.sha256（08-4 第 7 章、W-Q6-FE）
# 用法：前端构建完成后在仓库根执行，默认扫描 dist/；可传目录： ./scripts/build-frontend-manifest.sh [dist_dir]
# 示例：cd crates/web && trunk build --release && cd ../.. && ./scripts/build-frontend-manifest.sh dist
#
# 重要：manifest 内容必须尽量“可重复”。不得包含 wall-clock 时间戳；否则同一 commit 不同机器会生成不同 manifest.sha256。

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="${1:-dist}"
cd "$ROOT"

if [ ! -d "$DIST_DIR" ]; then
  echo "SKIP: 目录 $DIST_DIR 不存在；请先完成前端构建（如 trunk build 产出 dist/）再运行本脚本。"
  exit 0
fi

MANIFEST_JSON="${DIST_DIR}/manifest.json"
MANIFEST_SHA="${DIST_DIR}/manifest.sha256"

git_sha=""
git_ct=""
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git_sha="$(git rev-parse HEAD 2>/dev/null || true)"
  git_ct="$(git show -s --format=%ct HEAD 2>/dev/null || true)"
fi

rustc_v="$(command -v rustc >/dev/null 2>&1 && rustc --version 2>/dev/null || echo "")"
cargo_v="$(command -v cargo >/dev/null 2>&1 && cargo --version 2>/dev/null || echo "")"
trunk_v="$(command -v trunk >/dev/null 2>&1 && trunk --version 2>/dev/null || echo "")"
wasm_opt_v="$(command -v wasm-opt >/dev/null 2>&1 && wasm-opt --version 2>/dev/null || echo "")"

lock_sha256=""
if command -v sha256sum >/dev/null 2>&1 && [ -f "Cargo.lock" ]; then
  lock_sha256="$(sha256sum Cargo.lock | cut -d' ' -f1)"
fi

# 收集产物：path 与 sha256（需 jq 生成多文件列表；无 jq 时写空 artifacts）
ARTIFACTS="[]"
if command -v jq >/dev/null 2>&1; then
  if command -v sha256sum >/dev/null 2>&1; then
    while IFS= read -r -d '' f; do
      rel="${f#$DIST_DIR/}"
      [ "$rel" = "manifest.json" ] || [ "$rel" = "manifest.sha256" ] && continue
      h="$(sha256sum "$f" | cut -d' ' -f1)"
      ARTIFACTS="$(echo "$ARTIFACTS" | jq --arg p "$rel" --arg s "$h" '. + [{path:$p, sha256:$s}]')"
    done < <(find "$DIST_DIR" -type f -print0 2>/dev/null | sort -z)
  else
    while IFS= read -r -d '' f; do
      rel="${f#$DIST_DIR/}"
      [ "$rel" = "manifest.json" ] || [ "$rel" = "manifest.sha256" ] && continue
      ARTIFACTS="$(echo "$ARTIFACTS" | jq --arg p "$rel" '. + [{path:$p, sha256:""}]')"
    done < <(find "$DIST_DIR" -type f -print0 2>/dev/null | sort -z)
  fi

  # 再按 path 排序，确保不同文件系统顺序也一致
  ARTIFACTS="$(echo "$ARTIFACTS" | jq 'sort_by(.path)')"
fi

echo "{\"gate\":\"Q6-frontend\",\"git\":{\"commit\":\"$git_sha\",\"commit_time_unix\":\"$git_ct\"},\"tooling\":{\"rustc\":\"$rustc_v\",\"cargo\":\"$cargo_v\",\"trunk\":\"$trunk_v\",\"wasm_opt\":\"$wasm_opt_v\"},\"locks\":{\"Cargo.lock_sha256\":\"$lock_sha256\"},\"artifacts\":$ARTIFACTS,\"sign_off\":[\"build\"]}" > "$MANIFEST_JSON"

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$MANIFEST_JSON" | cut -d' ' -f1 > "$MANIFEST_SHA"
else
  echo "（无 sha256sum，请人工生成 manifest.sha256）" > "$MANIFEST_SHA"
fi
echo "OK: 已生成 $MANIFEST_JSON 与 $MANIFEST_SHA"
