#!/usr/bin/env bash
# 将 **`scripts/indexer-public-snapshot.sh`** 的合并 JSON 写入 **`evidence/GO_YYYYMMDD/`**（留痕、与 07 / 110 / evidence README 一致）。
# **Epic D-10**：**`INDEXER_EVIDENCE_WRITE_MANIFEST=1`** 或 **`INDEXER_EVIDENCE_BUNDLE_ZIP=1`** 时另产出 **`manifest.json`**（与 **`indexer_public_snapshot_manifest.json`** 同形）、**`manifest.sha256`**（**`sha256sum -c`** 可用）、**`epic_d_go_bundle_closure.json`**（**`traveltrust.ops_artifact.v1`** · **`artifact_type:bundle`**）；**zip** 含上述文件 + **`artifacts/epic_d_d0{3,4,5}_*.json`**（若已生成）。
# 继承当前 shell 的 **`API_BASE_URL`**、**`ADMIN_BEARER_TOKEN`**、**`INTERNAL_API_SECRET`**、**`SNAPSHOT_INTERNAL_*`** 等（密钥 **勿**入库）。
#
# **只读 Epic D-03～D-05 附档**（**不**落库、**不** **`persist:true`**）：设 **`INTERNAL_API_SECRET`** 且 **`INDEXER_EVIDENCE_EPIC_D_ENVELOPES=1`**（默认 **1**）时，在写 manifest 前于 **`artifacts/`** 落 **`internal-indexer-ops.sh`** **`status --ops-artifact`** / **`status --live-reconcile --ops-artifact`** / **`reconcile --ops-artifact`**，使 bundle 内可 **`jq`** 检索 **≥2** 类 **`artifact_type`**（**D-02** **`snapshot_public`** + **D-03/D-04/D-05**）。无密钥时跳过并 **stderr** 提示。
# **`epic_d_go_bundle_closure.json`** 根级 **`bundle_closure`**：**`epic`**、**`closure_status`**（**`INDEXER_EVIDENCE_CLOSURE_STATUS`**，默认 **`GO`**）、**`artifact_version`**（与 **`artifact_version`:`v1`** 一致）、**`included_tasks`**（据目录内文件与 **`artifact_type`** 推断，供完整性 / 历史 diff / release gate）。
#
# 可选 **`INDEXER_EVIDENCE_WRITE_MANIFEST=1`**：生成本目录 **`indexer_public_snapshot_manifest.json`** + **`manifest.json`**（字段与 **`evidence/README.md`** 约定对齐）。
# 可选 **`INDEXER_EVIDENCE_BUNDLE_ZIP=1`**：再打 **`indexer_evidence_bundle_*.zip`**（须 **`zip`** 与 **`jq`**）。
#
# 用法（项目根）：
#   bash scripts/write-indexer-evidence.sh
#   INDEXER_EVIDENCE_BUNDLE_ZIP=1 INTERNAL_API_SECRET='…' bash scripts/write-indexer-evidence.sh
#   EVIDENCE_GO_DIR=evidence/GO_20260409 bash scripts/write-indexer-evidence.sh   # 等价于指定当日目录
#   bash scripts/write-indexer-evidence.sh --epic-d10-post /abs/path/to/GO_DIR   # 仅补 **manifest.sha256** + **closure**（PowerShell 路径在写完 manifest 后调用）
# Windows：.\scripts\write-indexer-evidence.ps1（**`--epic-d10-post`** 由 **.ps1** 委托 **bash**）
#
# 依赖：同 **indexer-public-snapshot.sh**（curl、jq）；manifest/zip 另须 **sha256sum** 或 **shasum**、**zip**（仅 zip 时）。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

WRITE_INDEXER_EVIDENCE_SCRIPT_SEMVER="1.1.0"

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

write_manifest_sha256_list() {
  local dir="$1"
  (
    cd "$dir" || exit 1
    local names=()
    [[ -f manifest.json ]] && names+=(manifest.json)
    shopt -s nullglob
    for f in indexer_public_snapshot_*.json; do
      names+=("$f")
    done
    [[ -f epic_d_go_bundle_closure.json ]] && names+=("epic_d_go_bundle_closure.json")
    for f in artifacts/*.json; do
      [[ -f "$f" ]] && names+=("$f")
    done
    shopt -u nullglob
    if ((${#names[@]} == 0)); then
      echo "write-indexer-evidence.sh: no files to hash in ${dir}" >&2
      exit 1
    fi
    local h n
    for n in "${names[@]}"; do
      h=$(file_sha256 "$n") || exit 1
      echo "$h  $n"
    done
  ) > "${dir}/manifest.sha256"
  echo "write-indexer-evidence.sh: wrote ${dir}/manifest.sha256"
}

# 输出 JSON 数组字符串，如 ["D-10","D-02","D-03"]（去重、排序按任务号）
compute_included_tasks_json() {
  local dir="$1"
  local arr='["D-10"]'
  local f typ
  shopt -s nullglob
  for f in "${dir}"/indexer_public_snapshot_*.json; do
    [[ -f "$f" ]] || continue
    if jq -e '.artifact_type == "snapshot_public"' "$f" >/dev/null 2>&1; then
      arr=$(jq -n --argjson a "$arr" '$a + ["D-02"] | unique')
      break
    fi
  done
  [[ -f "${dir}/artifacts/epic_d_d03_indexer_status.json" ]] && arr=$(jq -n --argjson a "$arr" '$a + ["D-03"] | unique')
  [[ -f "${dir}/artifacts/epic_d_d04_indexer_status_live.json" ]] && arr=$(jq -n --argjson a "$arr" '$a + ["D-04"] | unique')
  [[ -f "${dir}/artifacts/epic_d_d05_reconcile.json" ]] && arr=$(jq -n --argjson a "$arr" '$a + ["D-05"] | unique')
  for f in "${dir}"/artifacts/*.json; do
    [[ -f "$f" ]] || continue
    typ=$(jq -r '.artifact_type // empty' "$f" 2>/dev/null || true)
    case "$typ" in
      dry_run_chain) arr=$(jq -n --argjson a "$arr" '$a + ["D-06"] | unique') ;;
      dry_run_event_log) arr=$(jq -n --argjson a "$arr" '$a + ["D-07"] | unique') ;;
      dry_run_correction_executor) arr=$(jq -n --argjson a "$arr" '$a + ["D-08"] | unique') ;;
      probe) arr=$(jq -n --argjson a "$arr" '$a + ["D-09"] | unique') ;;
    esac
  done
  shopt -u nullglob
  echo "$arr" | jq -c 'unique | sort_by(sub("^D-";"") | tonumber)'
}

write_bundle_closure() {
  local dir="$1"
  command -v jq >/dev/null 2>&1 || {
    echo "write-indexer-evidence.sh: jq required for bundle closure" >&2
    return 1
  }
  [[ -f "${dir}/manifest.json" ]] || {
    echo "write-indexer-evidence.sh: missing manifest.json in ${dir}" >&2
    return 1
  }
  local manifest_json types_json
  manifest_json=$(jq -c . "${dir}/manifest.json")
  types_json='[]'
  shopt -s nullglob
  local f t
  for f in "${dir}"/indexer_public_snapshot_*.json "${dir}"/artifacts/*.json; do
    [[ -f "$f" ]] || continue
    t=$(jq -r '.artifact_type // empty' "$f" 2>/dev/null || true)
    if [[ -n "$t" ]]; then
      types_json=$(jq -n --argjson a "$types_json" --arg t "$t" '($a + [$t]) | unique')
    fi
  done
  shopt -u nullglob

  local HOST_GIT_COMMIT="" HOST_GIT_BRANCH="" HOST_REPO_DIRTY_JSON="null"
  if repo_root=$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null); then
    if commit=$(git -C "$repo_root" rev-parse HEAD 2>/dev/null); then
      HOST_GIT_COMMIT="$commit"
      if br=$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null); then
        HOST_GIT_BRANCH="$br"
      fi
      if git -C "$repo_root" diff --quiet && git -C "$repo_root" diff --cached --quiet 2>/dev/null; then
        HOST_REPO_DIRTY_JSON="false"
      else
        HOST_REPO_DIRTY_JSON="true"
      fi
    fi
  fi

  local closure_status included_json
  closure_status="${INDEXER_EVIDENCE_CLOSURE_STATUS:-GO}"
  included_json=$(compute_included_tasks_json "$dir")

  # shellcheck disable=SC2016
  jq -n \
    --argjson manifest "$manifest_json" \
    --argjson types "$types_json" \
    --argjson included "$included_json" \
    --arg ver "1.0.0" \
    --arg av "v1" \
    --arg cs "$closure_status" \
    --arg sem "$WRITE_INDEXER_EVIDENCE_SCRIPT_SEMVER" \
    --arg hcommit "$HOST_GIT_COMMIT" \
    --arg hbranch "$HOST_GIT_BRANCH" \
    --argjson hdirty "$HOST_REPO_DIRTY_JSON" \
    '{
      artifact_schema_id: "traveltrust.ops_artifact.v1",
      artifact_schema_version: $ver,
      artifact_version: $av,
      artifact_type: "bundle",
      captured_at: (now | todate),
      epic_task_id: "Epic-D-D10",
      bundle_closure: {
        epic: "D",
        closure_status: $cs,
        artifact_version: $av,
        included_tasks: $included
      },
      provenance: {
        script: "write-indexer-evidence.sh",
        script_semver: $sem,
        host_git_commit: (if ($hcommit | length) > 0 then $hcommit else null end),
        host_git_branch: (if ($hbranch | length) > 0 then $hbranch else null end),
        host_repo_dirty: $hdirty
      },
      api_context: {
        internal_invoked: false,
        api_base_url_redacted: false,
        evidence_bundle_read_only: true
      },
      payload: {
        manifest: $manifest,
        manifest_sha256_file: "manifest.sha256",
        artifact_types_detected: $types,
        artifacts_min_epic_d_hint: {
          "Epic-D-D02": "indexer_public_snapshot_*.json → artifact_type snapshot_public",
          "Epic-D-D03": "artifacts/epic_d_d03_indexer_status.json → indexer_status",
          "Epic-D-D04": "artifacts/epic_d_d04_indexer_status_live.json → indexer_status",
          "Epic-D-D05": "artifacts/epic_d_d05_reconcile.json → reconcile"
        },
        notes: "Read-only packaging; no persist:true reconcile in this flow. INDEXER_EVIDENCE_EPIC_D_ENVELOPES=1 + INTERNAL_API_SECRET yields D-03..D-05 sidecars for two+ artifact_type in bundle."
      }
    }' > "${dir}/epic_d_go_bundle_closure.json"
  echo "write-indexer-evidence.sh: wrote ${dir}/epic_d_go_bundle_closure.json"
}

if [[ "${1:-}" == "--epic-d10-post" ]]; then
  command -v jq >/dev/null 2>&1 || {
    echo "write-indexer-evidence.sh: jq required" >&2
    exit 1
  }
  [[ -n "${2:-}" ]] || {
    echo "usage: $0 --epic-d10-post <OUT_DIR>" >&2
    exit 1
  }
  write_bundle_closure "$2"
  write_manifest_sha256_list "$2"
  exit 0
fi

EVIDENCE_ROOT="${EVIDENCE_ROOT:-$ROOT/evidence}"
if [[ -n "${EVIDENCE_GO_DIR:-}" ]]; then
  OUT_DIR="${EVIDENCE_GO_DIR}"
  DAY="$(basename "$OUT_DIR")"
  mkdir -p "$OUT_DIR"
else
  DAY="${EVIDENCE_DAY_GO:-GO_$(date +%Y%m%d)}"
  OUT_DIR="${EVIDENCE_ROOT%/}/${DAY}"
  mkdir -p "$OUT_DIR"
fi
OUT_FILE="${OUT_DIR}/indexer_public_snapshot_$(date -u +%Y%m%dT%H%M%SZ).json"

maybe_collect_epic_d_envelopes() {
  local dir="$1"
  [[ "${INDEXER_EVIDENCE_EPIC_D_ENVELOPES:-1}" == "1" ]] || return 0
  if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
    echo "write-indexer-evidence.sh: INTERNAL_API_SECRET unset; skipping Epic D-03/04/05 artifacts/ (bundle may only contain snapshot_public until you add sidecars manually)" >&2
    return 0
  fi
  mkdir -p "${dir}/artifacts"
  export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
  (cd "$ROOT" && bash scripts/internal-indexer-ops.sh status --ops-artifact >"${dir}/artifacts/epic_d_d03_indexer_status.json")
  (cd "$ROOT" && bash scripts/internal-indexer-ops.sh status --live-reconcile --ops-artifact >"${dir}/artifacts/epic_d_d04_indexer_status_live.json")
  (cd "$ROOT" && bash scripts/internal-indexer-ops.sh reconcile --ops-artifact >"${dir}/artifacts/epic_d_d05_reconcile.json")
  echo "write-indexer-evidence.sh: wrote Epic D-03/04/05 JSON under ${dir}/artifacts/"
}

# indexer_public_snapshot_manifest.json — 与 evidence/README「manifest 格式」对齐。
maybe_write_indexer_bundle_manifest() {
  local dir="$1"
  command -v jq >/dev/null 2>&1 || {
    echo "write-indexer-evidence.sh: jq required for manifest or zip bundle" >&2
    return 1
  }
  local artifacts_json='[]'
  local f base h
  shopt -s nullglob
  for f in "${dir}"/indexer_public_snapshot_*.json; do
    base=$(basename "$f")
    h=$(file_sha256 "$f") || return 1
    [[ -n "$h" ]] || return 1
    artifacts_json=$(jq -n --argjson a "$artifacts_json" --arg p "$base" --arg h "$h" '$a + [{path: $p, sha256: $h}]')
  done
  if [[ -d "${dir}/artifacts" ]]; then
    shopt -s nullglob
    for f in "${dir}/artifacts/"*.json; do
      [[ -f "$f" ]] || continue
      base=$(basename "$f")
      h=$(file_sha256 "$f") || return 1
      artifacts_json=$(jq -n --argjson a "$artifacts_json" --arg p "artifacts/${base}" --arg h "$h" '$a + [{path: $p, sha256: $h}]')
    done
    shopt -u nullglob
  fi
  shopt -u nullglob
  if echo "$artifacts_json" | jq -e 'length == 0' >/dev/null; then
    echo "write-indexer-evidence.sh: no indexer_public_snapshot_*.json under ${dir}" >&2
    return 1
  fi
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
    --arg notes "Paths relative to GO_* day dir. Epic D-10: also manifest.json + manifest.sha256 + epic_d_go_bundle_closure.json (traveltrust.ops_artifact.v1 bundle). Replace gate/sign_off for formal gate per evidence/README.md. RUNBOOK §2.55 / 110." \
    --argjson artifacts "$artifacts_json" \
    --argjson sign_off "$(echo "$sign_off_raw" | jq -c .)" \
    '{bundle_kind: $kind, gate: $gate, date: $date, artifacts: $artifacts, sign_off: $sign_off, notes: $notes}' \
    >"${dir}/indexer_public_snapshot_manifest.json"
  cp "${dir}/indexer_public_snapshot_manifest.json" "${dir}/manifest.json"
  echo "write-indexer-evidence.sh: wrote ${dir}/indexer_public_snapshot_manifest.json"
  echo "write-indexer-evidence.sh: wrote ${dir}/manifest.json"
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
    cd "$dir" || exit 1
    shopt -s nullglob
    local files=(
      manifest.json manifest.sha256 epic_d_go_bundle_closure.json
      indexer_public_snapshot_*.json
      artifacts/*.json
    )
    shopt -u nullglob
    if ((${#files[@]} == 0)); then
      echo "write-indexer-evidence.sh: nothing to zip in ${dir}" >&2
      exit 1
    fi
    zip -q "$zip_name" "${files[@]}"
  )
  echo "write-indexer-evidence.sh: wrote ${dir}/${zip_name}"
}

(cd "$ROOT" && bash scripts/indexer-public-snapshot.sh) >"$OUT_FILE"
echo "write-indexer-evidence.sh: wrote ${OUT_FILE}"

if [[ "${INDEXER_EVIDENCE_WRITE_MANIFEST:-}" == "1" || "${INDEXER_EVIDENCE_BUNDLE_ZIP:-}" == "1" ]]; then
  maybe_collect_epic_d_envelopes "$OUT_DIR" || exit 1
  maybe_write_indexer_bundle_manifest "$OUT_DIR" || exit 1
  write_bundle_closure "$OUT_DIR" || exit 1
  write_manifest_sha256_list "$OUT_DIR" || exit 1
fi
if [[ "${INDEXER_EVIDENCE_BUNDLE_ZIP:-}" == "1" ]]; then
  maybe_zip_indexer_bundle "$OUT_DIR" "$DAY" || exit 1
fi
