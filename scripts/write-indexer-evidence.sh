#!/usr/bin/env bash
# 将 **`scripts/indexer-public-snapshot.sh`** 的合并 JSON 写入 **`evidence/GO_YYYYMMDD/`**（留痕、与 07 / 110 / evidence README 一致）。
# 继承当前 shell 的 **`API_BASE_URL`**、**`ADMIN_BEARER_TOKEN`**、**`INTERNAL_API_SECRET`**、**`SNAPSHOT_INTERNAL_RECONCILE_RPC`**、**`SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_CHAIN_TIP`**、**`SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_EVENT_LOG_ESCROW_COVERAGE`**、**`SNAPSHOT_INTERNAL_INDEXER_TICK`**、**`SNAPSHOT_INTERNAL_SKIP_RECONCILE`**（**`1`** 时跳过 **`POST …/internal/indexer-reconcile`**；**`internal_indexer_reconcile`** 为 **`snapshot_skipped`**；合并 JSON 内 **`snapshot_options`** 与 reconcile 请求侧相关的 **RPC/chain_tip/event_log_coverage** 键强制 **`null`**）等（密钥 **勿**入库）。
#
# 可选 **`INDEXER_EVIDENCE_WRITE_MANIFEST=1`**：为本目录下所有 **`indexer_public_snapshot_*.json`** 生成 **`indexer_public_snapshot_manifest.json`**
# （字段与 **`evidence/README.md`** manifest 约定对齐：`gate` / `date` / `artifacts[]` / `sign_off`；另含 **`bundle_kind`**）。
# 可选 **`INDEXER_EVIDENCE_BUNDLE_ZIP=1`**：在写完快照后生成上述 manifest（隐含）并再打 **`indexer_evidence_bundle_*.zip`**
# （须系统 **`zip`** 与 **`jq`**；正式过门前请将 **`INDEXER_EVIDENCE_MANIFEST_GATE`** / **`INDEXER_EVIDENCE_MANIFEST_SIGN_OFF`** 换为工单口径）。
#
# 用法（项目根）：
#   bash scripts/write-indexer-evidence.sh
#   INDEXER_EVIDENCE_BUNDLE_ZIP=1 bash scripts/write-indexer-evidence.sh
#   EVIDENCE_ROOT=/tmp/ev bash scripts/write-indexer-evidence.sh
#   EVIDENCE_DAY_GO=GO_20260327 bash scripts/write-indexer-evidence.sh   # 覆盖目录名
# Windows：.\scripts\write-indexer-evidence.ps1（须 **Git Bash** 跑 **indexer-public-snapshot.sh**；manifest/zip 由 PS 生成）
#
# 依赖：同 **indexer-public-snapshot.sh**（curl、jq）；**bash**；manifest/zip 另须 **sha256sum** 或 **shasum**、**zip**（仅 zip 时）。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE_ROOT="${EVIDENCE_ROOT:-$ROOT/evidence}"
DAY="${EVIDENCE_DAY_GO:-GO_$(date +%Y%m%d)}"
OUT_DIR="${EVIDENCE_ROOT%/}/${DAY}"
mkdir -p "$OUT_DIR"
OUT_FILE="${OUT_DIR}/indexer_public_snapshot_$(date -u +%Y%m%dT%H%M%SZ).json"

file_sha256() {
  local f="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$f" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$f" | awk '{print $1}'
  else
    echo "write-indexer-evidence.sh: need sha256sum or shasum" >&2
    return 1
  fi
}

# indexer_public_snapshot_manifest.json — 与 evidence/README「manifest 格式」对齐，供 110 / Gate 留痕。
maybe_write_indexer_bundle_manifest() {
  local dir="$1"
  command -v jq >/dev/null 2>&1 || {
    echo "write-indexer-evidence.sh: jq required for manifest or zip bundle" >&2
    return 1
  }
  local artifacts_json='[]'
  local snaps=()
  shopt -s nullglob
  snaps=( "${dir}"/indexer_public_snapshot_*.json )
  shopt -u nullglob
  if ((${#snaps[@]} == 0)); then
    echo "write-indexer-evidence.sh: no indexer_public_snapshot_*.json under ${dir}" >&2
    return 1
  fi
  local f base h
  for f in "${snaps[@]}"; do
    base=$(basename "$f")
    h=$(file_sha256 "$f") || return 1
    [[ -n "$h" ]] || return 1
    artifacts_json=$(jq -n --argjson a "$artifacts_json" --arg p "$base" --arg h "$h" '$a + [{path: $p, sha256: $h}]')
  done
  local sign_off_raw
  if [[ -n "${INDEXER_EVIDENCE_MANIFEST_SIGN_OFF:-}" ]]; then
    sign_off_raw="$INDEXER_EVIDENCE_MANIFEST_SIGN_OFF"
  else
    sign_off_raw='["automation"]'
  fi
  echo "$sign_off_raw" | jq -e . >/dev/null 2>&1 || {
    echo "write-indexer-evidence.sh: INDEXER_EVIDENCE_MANIFEST_SIGN_OFF must be valid JSON" >&2
    return 1
  }
  jq -n \
    --arg kind "indexer_public_snapshot" \
    --arg gate "${INDEXER_EVIDENCE_MANIFEST_GATE:-Indexer-110-public-snapshot}" \
    --arg date "$(date -u +%Y-%m-%d)" \
    --arg notes "Paths relative to GO_* day dir. Replace gate/sign_off for formal gate per evidence/README.md. RUNBOOK §2.55 / 110." \
    --argjson artifacts "$artifacts_json" \
    --argjson sign_off "$(echo "$sign_off_raw" | jq -c .)" \
    '{bundle_kind: $kind, gate: $gate, date: $date, artifacts: $artifacts, sign_off: $sign_off, notes: $notes}' \
    > "${dir}/indexer_public_snapshot_manifest.json"
  echo "write-indexer-evidence.sh: wrote ${dir}/indexer_public_snapshot_manifest.json"
}

maybe_zip_indexer_bundle() {
  local dir="$1"
  local day="$2"
  if ! command -v zip >/dev/null 2>&1; then
    echo "write-indexer-evidence.sh: zip not installed; skip bundle zip" >&2
    return 0
  fi
  local ts zip_name
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  zip_name="indexer_evidence_bundle_${day}_${ts}.zip"
  (
    cd "$dir"
    zip -q "$zip_name" indexer_public_snapshot_manifest.json indexer_public_snapshot_*.json
  )
  echo "write-indexer-evidence.sh: wrote ${dir}/${zip_name}"
}

(cd "$ROOT" && bash scripts/indexer-public-snapshot.sh) >"$OUT_FILE"
echo "write-indexer-evidence.sh: wrote ${OUT_FILE}"

if [[ "${INDEXER_EVIDENCE_WRITE_MANIFEST:-}" == "1" || "${INDEXER_EVIDENCE_BUNDLE_ZIP:-}" == "1" ]]; then
  maybe_write_indexer_bundle_manifest "$OUT_DIR" || exit 1
fi
if [[ "${INDEXER_EVIDENCE_BUNDLE_ZIP:-}" == "1" ]]; then
  maybe_zip_indexer_bundle "$OUT_DIR" "$DAY" || exit 1
fi
