#!/usr/bin/env bash
# ① 烟测辅助：订单 guide_id 是否为空 / 是否已指派（itinerary-first · 创建不带向导）
#
# 用法（source 后）：
#   tt_assert_order_has_no_guide "$get_body" "after POST /itineraries"
#   tt_assert_order_has_guide "$get_body" "$GUIDE_ID" "after PATCH guide"

tt_order_guide_id_from_json() {
  node -e "
    const o=JSON.parse(process.argv[1]);
    const g=o.order?.guide_id ?? o.guide_id ?? '';
    process.stdout.write(String(g==null?'':g).trim());
  " "$1"
}

tt_order_guide_id_is_unassigned() {
  local gid
  gid="$(tt_order_guide_id_from_json "$1")"
  [[ -z "$gid" || "$gid" == "00000000-0000-0000-0000-000000000000" ]]
}

tt_assert_order_has_no_guide() {
  local json="$1" ctx="${2:-order}"
  if tt_order_guide_id_is_unassigned "$json"; then
    return 0
  fi
  local gid
  gid="$(tt_order_guide_id_from_json "$json")"
  echo "tt-order-guide-id: FAIL $ctx — expected no guide_id, got=$gid" >&2
  return 1
}

tt_assert_order_has_guide() {
  local json="$1" want="$2" ctx="${3:-order}"
  local got
  got="$(tt_order_guide_id_from_json "$json")"
  [[ "$got" == "$want" ]] || {
    echo "tt-order-guide-id: FAIL $ctx — guide_id got=$got want=$want" >&2
    return 1
  }
}
