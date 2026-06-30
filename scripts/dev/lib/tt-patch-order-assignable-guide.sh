#!/usr/bin/env bash
# ① 本地烟测：为订单 PATCH 绑定向导 — 遍历 catalog 可用项，必要时注册新向导+stake。
#
# 用法（source 后）：
#   tt_patch_order_assignable_guide "$API_BASE" "$TOURIST_TOKEN" "$ORDER_ID" "$FRESH_GUIDE_TOKEN"
# 成功时设置 TT_PATCHED_GUIDE_ID；失败 exit 1。
#
# 可选第 5 参 exclude_guide_id：跳过 catalog 中该 id（用于 reassign 烟测避免 idempotent 同向导）。
# FRESH_GUIDE_TOKEN：catalog 全 409 时用该 token POST /guides + stake 后重试 PATCH。
# 订单已有向导时 PATCH 不同 guide_id 为 reassign（200）；同 id 为 idempotent（200）。
set -euo pipefail

tt_patch_order_assignable_guide() {
  local api_base="${1:?api_base}"
  local tourist_token="${2:?tourist_token}"
  local order_id="${3:?order_id}"
  local fresh_guide_token="${4:-}"
  local exclude_guide_id="${5:-}"

  api_base="${api_base%/}"
  TT_PATCHED_GUIDE_ID=""

  local guides_resp guides_code guides_body
  guides_resp="$(curl -sS -w '|%{http_code}' -X GET "$api_base/api/v1/guides" \
    -H "Authorization: Bearer $tourist_token" -H "Content-Type: application/json")"
  guides_code="${guides_resp##*|}"
  guides_body="${guides_resp%|*}"
  [[ "$guides_code" == "200" ]] || {
    echo "tt-patch-order-assignable-guide: GET guides HTTP $guides_code" >&2
    return 1
  }

  local guides_tmp patch_tmp
  guides_tmp="$(mktemp)"
  printf '%s' "$guides_body" > "$guides_tmp"
  while IFS= read -r gid; do
    [[ -z "$gid" ]] && continue
    if [[ -n "$exclude_guide_id" && "$gid" == "$exclude_guide_id" ]]; then
      continue
    fi
    patch_resp="$(curl -sS -w '|%{http_code}' -X PATCH "$api_base/api/v1/orders/$order_id/guide" \
      -H "Authorization: Bearer $tourist_token" -H "Content-Type: application/json" \
      -d "{\"guide_id\":\"$gid\"}")"
    patch_code="${patch_resp##*|}"
    if [[ "$patch_code" == "200" ]]; then
      TT_PATCHED_GUIDE_ID="$gid"
      rm -f "$guides_tmp"
      return 0
    fi
    if [[ "$patch_code" != "409" ]]; then
      rm -f "$guides_tmp"
      echo "tt-patch-order-assignable-guide: PATCH guide HTTP $patch_code body=${patch_resp%|*}" >&2
      return 1
    fi
  done < <(node -e "const o=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); (o.items||[]).forEach(g=>console.log(String(g.id||'')));" "$guides_tmp")
  rm -f "$guides_tmp"

  [[ -n "$fresh_guide_token" ]] || {
    echo "tt-patch-order-assignable-guide: no assignable catalog guide (all 409) and no fresh_guide_token" >&2
    return 1
  }

  local stamp create_resp create_code create_body new_gid stake_resp stake_code
  stamp="$(date +%s)"
  create_resp="$(curl -sS -w '|%{http_code}' -X POST "$api_base/api/v1/guides" \
    -H "Authorization: Bearer $fresh_guide_token" -H "Content-Type: application/json" \
    -d "{\"display_name\":\"Smoke Guide $stamp\",\"city\":\"Shanghai\",\"country_code\":\"CN\"}")"
  create_code="${create_resp##*|}"
  create_body="${create_resp%|*}"
  [[ "$create_code" == "200" || "$create_code" == "201" ]] || {
    echo "tt-patch-order-assignable-guide: POST /guides HTTP $create_code body=$create_body" >&2
    return 1
  }
  patch_tmp="$(mktemp)"
  printf '%s' "$create_body" > "$patch_tmp"
  new_gid="$(node -e "const o=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); process.stdout.write(String(o.guide?.id||o.id||''));" "$patch_tmp")"
  rm -f "$patch_tmp"
  [[ -n "$new_gid" ]] || {
    echo "tt-patch-order-assignable-guide: POST /guides missing guide.id" >&2
    return 1
  }

  stake_resp="$(curl -sS -w '|%{http_code}' -X POST "$api_base/api/v1/guides/$new_gid/stake" \
    -H "Authorization: Bearer $fresh_guide_token" -H "Content-Type: application/json" \
    -d '{"amount":"100"}')"
  stake_code="${stake_resp##*|}"
  [[ "$stake_code" == "200" ]] || {
    echo "tt-patch-order-assignable-guide: POST stake HTTP $stake_code body=${stake_resp%|*}" >&2
    return 1
  }

  patch_resp="$(curl -sS -w '|%{http_code}' -X PATCH "$api_base/api/v1/orders/$order_id/guide" \
    -H "Authorization: Bearer $tourist_token" -H "Content-Type: application/json" \
    -d "{\"guide_id\":\"$new_gid\"}")"
  patch_code="${patch_resp##*|}"
  [[ "$patch_code" == "200" ]] || {
    echo "tt-patch-order-assignable-guide: PATCH fresh guide HTTP $patch_code body=${patch_resp%|*}" >&2
    return 1
  }
  TT_PATCHED_GUIDE_ID="$new_gid"
  return 0
}
