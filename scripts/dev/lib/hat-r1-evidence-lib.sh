#!/usr/bin/env bash
# HAT-R1 evidence helpers — tx / receipt / events / API / DB snapshots
set -euo pipefail

# Resolve HAT-R1 evidence dir: HAT_R1_EVID_DIR > latest stamp dir > default session
hat_r1_resolve_evid_dir() {
  local root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
  if [[ -n "${HAT_R1_EVID_DIR:-}" ]]; then
    echo "$HAT_R1_EVID_DIR"
    return 0
  fi
  local base="$root/evidence/GO_hat_r1_sepolia"
  local latest
  latest="$(ls -dt "$base"/*/ 2>/dev/null | head -1 || true)"
  latest="${latest%/}"
  if [[ -n "$latest" && -f "$latest/EXECUTE_EARLIEST_UNIX.txt" ]]; then
    echo "$latest"
    return 0
  fi
  if [[ -f "$base/latest-stamp.txt" ]]; then
    local stamp
    stamp="$(tr -d '\r\n' <"$base/latest-stamp.txt")"
    if [[ -n "$stamp" && -d "$base/$stamp" ]]; then
      echo "$base/$stamp"
      return 0
    fi
  fi
  echo "$base/20260616T063612Z"
}

hat_r1_step_dir() {
  local step="$1"
  mkdir -p "${HAT_R1_EVID}/${step}"
  echo "${HAT_R1_EVID}/${step}"
}

hat_r1_save_json() {
  local path="$1"
  local content="$2"
  mkdir -p "$(dirname "$path")"
  printf '%s\n' "$content" >"$path"
}

hat_r1_tx_json() {
  local step="$1"
  local label="$2"
  local tx_hash="$3"
  local dir
  dir="$(hat_r1_step_dir "$step")"
  hat_r1_save_json "$dir/tx-${label}.json" "$(jq -n \
    --arg step "$step" \
    --arg label "$label" \
    --arg tx "$tx_hash" \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{step:$step,label:$label,tx_hash:$tx,recorded_at:$ts}')"
}

hat_r1_receipt_and_events() {
  local step="$1"
  local tx_hash="$2"
  local dir rpc
  dir="$(hat_r1_step_dir "$step")"
  rpc="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
  cast receipt "$tx_hash" --rpc-url "$rpc" --json >"$dir/receipt-${tx_hash}.json" 2>/dev/null || true
  cast logs --from-block "$(jq -r .blockNumber "$dir/receipt-${tx_hash}.json" 2>/dev/null || echo latest)" \
    --to-block "$(jq -r .blockNumber "$dir/receipt-${tx_hash}.json" 2>/dev/null || echo latest)" \
    --rpc-url "$rpc" --json 2>/dev/null | jq --arg tx "$tx_hash" '[.[] | select(.transactionHash|ascii_downcase==($tx|ascii_downcase))]' \
    >"$dir/events-${tx_hash}.json" 2>/dev/null || echo '[]' >"$dir/events-${tx_hash}.json"
}

hat_r1_cast_rpc() {
  local rpc="$1"
  shift
  local attempt out
  for attempt in 1 2 3 4 5; do
    if out="$("$@" --rpc-url "$rpc" 2>&1)"; then
      printf '%s' "$out"
      return 0
    fi
    if ! echo "$out" | grep -qiE '502|503|504|timeout|rate limit|connection reset|EOF'; then
      printf '%s' "$out" >&2
      return 1
    fi
    sleep "$((attempt * 2))"
  done
  printf '%s' "$out" >&2
  return 1
}

hat_r1_cast_send_capture() {
  local step="$1"
  local label="$2"
  shift 2
  local rpc out hash
  rpc="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
  if ! out="$(hat_r1_cast_rpc "$rpc" cast send "$@" --private-key "$HAT_R1_PK" --json)"; then
    echo "HAT_R1_TX_FAIL step=${step} label=${label}" >&2
    echo "$out" >&2
    hat_r1_save_json "$(hat_r1_step_dir "$step")/tx-${label}-error.txt" "$out"
    return 1
  fi
  hash="$(echo "$out" | jq -r '.transactionHash // empty')"
  [[ -n "$hash" ]] || hash="$(echo "$out" | grep -oE '0x[a-fA-F0-9]{64}' | head -1)"
  [[ -n "$hash" ]] || { echo "HAT_R1_TX_PARSE_FAIL ${label}" >&2; return 1; }
  hat_r1_tx_json "$step" "$label" "$hash"
  hat_r1_receipt_and_events "$step" "$hash"
  echo "$hash"
}

hat_r1_api_get() {
  local step="$1"
  local name="$2"
  local path="$3"
  local dir code api
  dir="$(hat_r1_step_dir "$step")"
  api="${API_BASE:-http://127.0.0.1:8080}"
  code="$(curl -sS -o "$dir/api-${name}.json" -w '%{http_code}' "${api}${path}" 2>/dev/null || echo 000)"
  echo "{\"path\":\"${path}\",\"http_code\":${code}}" >"$dir/api-${name}-meta.json"
  echo "$code"
}

hat_r1_db_snapshot() {
  local step="$1"
  local dir sqlfile
  dir="$(hat_r1_step_dir "$step")"
  if [[ -z "${DATABASE_URL:-}" ]]; then
    hat_r1_save_json "$dir/db-snapshot-skipped.json" '{"reason":"DATABASE_URL unset"}'
    return 0
  fi
  if ! command -v psql >/dev/null 2>&1; then
    hat_r1_save_json "$dir/db-snapshot-skipped.json" '{"reason":"psql not installed"}'
    return 0
  fi
  sqlfile="$dir/db-snapshot.sql"
  {
    echo "-- HAT-R1 ${step} @ $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    psql "$DATABASE_URL" -Atc "SELECT count(*) FROM users;" 2>/dev/null | sed 's/^/users_count=/' || true
    psql "$DATABASE_URL" -Atc "SELECT id, role FROM users ORDER BY id DESC LIMIT 5;" 2>/dev/null || true
  } >"$sqlfile" 2>&1 || true
  hat_r1_save_json "$dir/db-snapshot-meta.json" "$(jq -n --arg step "$step" --arg file "db-snapshot.sql" '{step:$step,file:$file,captured:true}')"
}

hat_r1_page_manifest() {
  local step="$1"
  local dir
  dir="$(hat_r1_step_dir "$step")"
  cat >"$dir/screenshots-README.md" <<EOF
# HAT-R1 · ${step} · 五层证据 · L1 页面截图

**验收标准（每步必齐）：** 页面展示 → 钱包签名 → 链上事件 → API 返回 → 数据库状态

| 层 | 本目录文件 |
|----|------------|
| L1 页面 | \`screenshots/\`（本 README 下方命令） |
| L2 钱包 | \`tx-*.json\` · \`receipt-*.json\` |
| L3 链上事件 | \`events-*.json\` |
| L4 API | \`api-*.json\` · \`api-*-meta.json\` |
| L5 DB | \`db-snapshot.sql\`（需 \`DATABASE_URL\`） |

在 \`:3012\` 前端运行期间执行：

\`\`\`bash
node scripts/dev/capture-hat-r1-screenshots.mjs --step ${step} --out ${dir}/screenshots
\`\`\`

或人工截图保存至 \`${dir}/screenshots/\`（PNG · 含 URL 栏与时间戳）。
EOF
  hat_r1_save_json "$dir/five-layer-evidence-checklist.json" "$(jq -n \
    --arg step "$step" \
    '{step:$step,layers:["page_ui","wallet_tx","chain_events","api_response","db_state"],required:true}')"
}
