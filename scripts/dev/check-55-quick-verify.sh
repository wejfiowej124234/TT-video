#!/usr/bin/env bash
# 55 阶段运行时快速验收：请求关键 API，确认服务与 55 能力可用（§九附续.6）。
# 用法：API 已启动时在项目根执行 ./scripts/check-55-quick-verify.sh
# 环境变量：BASE_URL 优先；否则用 PORT（默认 8080）拼 http://localhost:$PORT

set -euo pipefail
PORT="${PORT:-8080}"
BASE_URL="${BASE_URL:-http://localhost:${PORT}}"
fail() { echo "55-QUICK-VERIFY FAIL: $*" >&2; exit 1; }
ok() { echo "55-QUICK-VERIFY OK: $*"; }

# 取 HTTP 状态码（-o /dev/null -w "%{http_code}"）
code_health=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/health" || echo "000")
code_discover=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/api/v1/discover/orders" || echo "000")
code_didrank=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/api/v1/did-rank/itineraries" || echo "000")
code_didrank_guides=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/api/v1/did-rank/guides" || echo "000")
code_didrank_travelers=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/api/v1/did-rank/travelers" || echo "000")
code_didrank_prize_pool=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/api/v1/did-rank/prize-pool" || echo "000")
code_didrank_providers=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/api/v1/did-rank/providers" || echo "000")
code_didrank_acquisitions=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/api/v1/did-rank/acquisitions" || echo "000")

[[ "$code_health" == "200" ]]    || fail "/health returned $code_health (expected 200)"
ok "/health $code_health"

code_meta=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/meta" || echo "000")
[[ "$code_meta" == "200" ]] || fail "/meta returned $code_meta (expected 200)"
ok "/meta $code_meta"
code_meta_build=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/meta/build" || echo "000")
[[ "$code_meta_build" == "200" ]] || fail "/meta/build returned $code_meta_build (expected 200)"
ok "/meta/build $code_meta_build"
if command -v jq >/dev/null 2>&1; then
  META_BODY_FILE="${TMPDIR:-/tmp}/tt-check55-meta-$$.json"
  curl -sS --connect-timeout 3 -o "$META_BODY_FILE" "$BASE_URL/meta" || true
  mb="$(cat "$META_BODY_FILE")"
  cleanup_meta_body() { rm -f "$META_BODY_FILE"; }
  trap cleanup_meta_body EXIT
  svc=$(echo "$mb" | jq -r '.service // empty')
  [[ "$svc" == "traveltrust-api" ]] || fail "/meta JSON .service expected traveltrust-api, got \"$svc\""
  ok "/meta JSON .service"
  dw=$(echo "$mb" | jq -r '.dual_write.failure_policy // empty')
  [[ "$dw" =~ ^(log_only|strict_503|alert_only)$ ]] || fail "/meta JSON .dual_write.failure_policy expected log_only|strict_503|alert_only, got \"$dw\""
  st_any=$(echo "$mb" | jq -r '.dual_write.strict_db_write_any | type')
  [[ "$st_any" == "boolean" ]] || fail "/meta JSON .dual_write.strict_db_write_any must be boolean, got $st_any"
  ok "/meta JSON .dual_write (failure_policy, strict_db_write_any)"
  ics=$(echo "$mb" | jq -r '.indexer.checkpoint.source // empty')
  [[ "$ics" == "runtime" || "$ics" == "startup_snapshot" ]] || fail "/meta JSON .indexer.checkpoint.source expected runtime|startup_snapshot, got \"$ics\""
  ibt=$(echo "$mb" | jq -r '.indexer.checkpoint.block_number | type')
  [[ "$ibt" == "number" ]] || fail "/meta JSON .indexer.checkpoint.block_number must be number, got $ibt"
  ilt=$(echo "$mb" | jq -r '.indexer.checkpoint.log_index | type')
  [[ "$ilt" == "number" ]] || fail "/meta JSON .indexer.checkpoint.log_index must be number, got $ilt"
  ok "/meta JSON .indexer.checkpoint (source, block_number, log_index)"
  drtype=$(echo "$mb" | jq -r '.did_rank | type')
  [[ "$drtype" == "object" ]] || fail "/meta JSON .did_rank must be object, got $drtype"
  com=$(echo "$mb" | jq -r '.did_rank.guides_community_penalty_exclusion // empty')
  [[ "$com" =~ ^(db_backed|chain_off_memory_only|no_chain_off)$ ]] || fail "/meta JSON .did_rank.guides_community_penalty_exclusion invalid: \"$com\""
  mounted=$(echo "$mb" | jq -r '.did_rank.chain_off_mounted | tostring')
  pool=$(echo "$mb" | jq -r '.did_rank.chain_off_db_pool | tostring')
  if [[ "$pool" == "true" ]]; then
    [[ "$com" == "db_backed" ]] || fail "/meta .did_rank inconsistent: chain_off_db_pool true but guides_community_penalty_exclusion=$com"
  elif [[ "$mounted" == "true" ]]; then
    [[ "$com" == "chain_off_memory_only" ]] || fail "/meta .did_rank inconsistent: mounted without db_pool but guides_community_penalty_exclusion=$com"
  else
    [[ "$com" == "no_chain_off" ]] || fail "/meta .did_rank inconsistent: expected no_chain_off, got $com"
  fi
  drul=$(echo "$mb" | jq -r '.did_rank.rule // empty')
  [[ -n "$drul" ]] || fail "/meta JSON .did_rank.rule must be non-empty"
  ok "/meta JSON .did_rank (686/687 shape + penalty_exclusion vs flags)"
  prtype=$(echo "$mb" | jq -r '.product_roles | type')
  [[ "$prtype" == "object" ]] || fail "/meta JSON .product_roles must be object, got $prtype"
  echo "$mb" | jq -e '.product_roles.users_role_stored == ["admin","arbitrator","guide","provider","region_steward","super_admin","tourist","traveler"]' >/dev/null \
    || fail "/meta JSON .product_roles.users_role_stored (692/697/748)"
  echo "$mb" | jq -e '.product_roles.me_public_role_mapping == {"tourist":"traveler"}' >/dev/null \
    || fail "/meta JSON .product_roles.me_public_role_mapping (690)"
  pif=$(echo "$mb" | jq -r '.product_roles.provider_in_users_role | tostring')
  [[ "$pif" == "true" ]] || fail "/meta JSON .product_roles.provider_in_users_role expected true (692)"
  rsf=$(echo "$mb" | jq -r '.product_roles.region_steward_in_users_role | tostring')
  [[ "$rsf" == "true" ]] || fail "/meta JSON .product_roles.region_steward_in_users_role expected true (692)"
  prul=$(echo "$mb" | jq -r '.product_roles.rule // empty')
  [[ -n "$prul" ]] || fail "/meta JSON .product_roles.rule must be non-empty (690)"
  [[ "$prul" == *"748"* ]] || fail "/meta JSON product_roles.rule must mention 748 (748), got \"$prul\""
  pr748_sw=$(jq -r '.product_roles.strict_db_write | tostring' "$META_BODY_FILE")
  [[ "$pr748_sw" == "false" ]] || fail "/meta JSON product_roles.strict_db_write must be false (748), got \"$pr748_sw\""
  pr748_exp='["strict_db_write","dual_write_order","rule","users_role_stored","me_public_role_mapping","protocol_roles_target_87","provider_in_users_role","region_steward_in_users_role","product_roles_top_keys","product_roles_top_keys_contract_748"]'
  pr748_got=$(echo "$mb" | jq -c '.product_roles.product_roles_top_keys // empty')
  [[ "$pr748_got" == "$pr748_exp" ]] || fail "/meta JSON product_roles.product_roles_top_keys must equal PRODUCT_ROLES (748), got \"$pr748_got\""
  sb748pr=$(echo "$mb" | jq -r '.product_roles.product_roles_top_keys_contract_748 // empty')
  [[ "$sb748pr" == *"748"* ]] || fail "/meta JSON product_roles_top_keys_contract_748 must mention 748 (748), got \"$sb748pr\""
  [[ "$sb748pr" == *"strict_db_write"* ]] || fail "/meta JSON product_roles_top_keys_contract_748 must embed strict_db_write (748), got \"$sb748pr\""
  [[ "$sb748pr" == *"dual_write_order"* ]] || fail "/meta JSON product_roles_top_keys_contract_748 must embed dual_write_order (748), got \"$sb748pr\""
  [[ "$sb748pr" == *"users_role_stored"* ]] || fail "/meta JSON product_roles_top_keys_contract_748 must embed users_role_stored (748), got \"$sb748pr\""
  regtype=$(echo "$mb" | jq -r '.auth.registration | type')
  [[ "$regtype" == "object" ]] || fail "/meta JSON .auth.registration must be object (694)"
  echo "$mb" | jq -e '.auth.registration.self_serve_roles_allowed == ["provider","region_steward","tourist","traveler"]' >/dev/null \
    || fail "/meta JSON .auth.registration.self_serve_roles_allowed (697)"
  echo "$mb" | jq -e '.auth.registration.request_role_aliases == {}' >/dev/null \
    || fail "/meta JSON .auth.registration.request_role_aliases (697 empty)"
  ar749r=$(echo "$mb" | jq -r '.auth.registration.rule // empty')
  [[ "$ar749r" == *"749"* ]] || fail "/meta JSON auth.registration.rule must mention 749 (749), got \"$ar749r\""
  ar749_sw=$(jq -r '.auth.registration.strict_db_write | tostring' "$META_BODY_FILE")
  [[ "$ar749_sw" == "false" ]] || fail "/meta JSON auth.registration.strict_db_write must be false (749), got \"$ar749_sw\""
  ar749_exp='["strict_db_write","dual_write_order","rule","self_serve_roles_allowed","request_role_aliases","default_role","invalid_role_error_key","arbitrator_seed_env","guide_via_separate_flow_only","auth_registration_top_keys","auth_registration_top_keys_contract_749"]'
  ar749_got=$(echo "$mb" | jq -c '.auth.registration.auth_registration_top_keys // empty')
  [[ "$ar749_got" == "$ar749_exp" ]] || fail "/meta JSON auth.registration.auth_registration_top_keys must equal AUTH_REGISTRATION (749), got \"$ar749_got\""
  sb749ar=$(echo "$mb" | jq -r '.auth.registration.auth_registration_top_keys_contract_749 // empty')
  [[ "$sb749ar" == *"749"* ]] || fail "/meta JSON auth_registration_top_keys_contract_749 must mention 749 (749), got \"$sb749ar\""
  [[ "$sb749ar" == *"strict_db_write"* ]] || fail "/meta JSON auth_registration_top_keys_contract_749 must embed strict_db_write (749), got \"$sb749ar\""
  [[ "$sb749ar" == *"self_serve_roles_allowed"* ]] || fail "/meta JSON auth_registration_top_keys_contract_749 must embed self_serve_roles_allowed (749), got \"$sb749ar\""
  au750r=$(echo "$mb" | jq -r '.auth.rule // empty')
  [[ "$au750r" == *"750"* ]] || fail "/meta JSON auth.rule must mention 750 (750), got \"$au750r\""
  au750_sw=$(echo "$mb" | jq -c '.auth.strict_db_write | type')
  [[ "$au750_sw" == '"boolean"' ]] || fail "/meta JSON auth.strict_db_write must be boolean (750), got \"$au750_sw\""
  au750_exp='["strict_db_write","registration","rule","auth_top_keys","auth_top_keys_contract_750"]'
  au750_got=$(echo "$mb" | jq -c '.auth.auth_top_keys // empty')
  [[ "$au750_got" == "$au750_exp" ]] || fail "/meta JSON auth.auth_top_keys must equal AUTH_META (750), got \"$au750_got\""
  sb750au=$(echo "$mb" | jq -r '.auth.auth_top_keys_contract_750 // empty')
  [[ "$sb750au" == *"750"* ]] || fail "/meta JSON auth_top_keys_contract_750 must mention 750 (750), got \"$sb750au\""
  [[ "$sb750au" == *"strict_db_write"* ]] || fail "/meta JSON auth_top_keys_contract_750 must embed strict_db_write (750), got \"$sb750au\""
  [[ "$sb750au" == *"registration"* ]] || fail "/meta JSON auth_top_keys_contract_750 must embed registration (750), got \"$sb750au\""
  sta751r=$(echo "$mb" | jq -r '.seed_test_accounts.rule // empty')
  [[ "$sta751r" == *"751"* ]] || fail "/meta JSON seed_test_accounts.rule must mention 751 (751), got \"$sta751r\""
  sta751_sw=$(echo "$mb" | jq -c '.seed_test_accounts.strict_db_write | type')
  [[ "$sta751_sw" == '"boolean"' ]] || fail "/meta JSON seed_test_accounts.strict_db_write must be boolean (751), got \"$sta751_sw\""
  sta751_exp='["strict_db_write","rule","seed_test_accounts_top_keys","seed_test_accounts_top_keys_contract_751"]'
  sta751_got=$(echo "$mb" | jq -c '.seed_test_accounts.seed_test_accounts_top_keys // empty')
  [[ "$sta751_got" == "$sta751_exp" ]] || fail "/meta JSON seed_test_accounts.seed_test_accounts_top_keys must equal SEED_TEST_ACCOUNTS (751), got \"$sta751_got\""
  sb751sta=$(echo "$mb" | jq -r '.seed_test_accounts.seed_test_accounts_top_keys_contract_751 // empty')
  [[ "$sb751sta" == *"751"* ]] || fail "/meta JSON seed_test_accounts_top_keys_contract_751 must mention 751 (751), got \"$sb751sta\""
  [[ "$sb751sta" == *"strict_db_write"* ]] || fail "/meta JSON seed_test_accounts_top_keys_contract_751 must embed strict_db_write (751), got \"$sb751sta\""
  [[ "$sb751sta" == *"rule"* ]] || fail "/meta JSON seed_test_accounts_top_keys_contract_751 must embed rule (751), got \"$sb751sta\""
  gu752r=$(echo "$mb" | jq -r '.guides.rule // empty')
  [[ "$gu752r" == *"752"* ]] || fail "/meta JSON guides.rule must mention 752 (752), got \"$gu752r\""
  gu752_sw=$(echo "$mb" | jq -c '.guides.strict_db_write | type')
  [[ "$gu752_sw" == '"boolean"' ]] || fail "/meta JSON guides.strict_db_write must be boolean (752), got \"$gu752_sw\""
  gu752_exp='["strict_db_write","rule","guides_top_keys","guides_top_keys_contract_752"]'
  gu752_got=$(echo "$mb" | jq -c '.guides.guides_top_keys // empty')
  [[ "$gu752_got" == "$gu752_exp" ]] || fail "/meta JSON guides.guides_top_keys must equal GUIDES_META (752), got \"$gu752_got\""
  sb752gu=$(echo "$mb" | jq -r '.guides.guides_top_keys_contract_752 // empty')
  [[ "$sb752gu" == *"752"* ]] || fail "/meta JSON guides_top_keys_contract_752 must mention 752 (752), got \"$sb752gu\""
  [[ "$sb752gu" == *"strict_db_write"* ]] || fail "/meta JSON guides_top_keys_contract_752 must embed strict_db_write (752), got \"$sb752gu\""
  [[ "$sb752gu" == *"rule"* ]] || fail "/meta JSON guides_top_keys_contract_752 must embed rule (752), got \"$sb752gu\""
  ic753r=$(echo "$mb" | jq -r '.idempotency_cache.rule // empty')
  [[ "$ic753r" == *"753"* ]] || fail "/meta JSON idempotency_cache.rule must mention 753 (753), got \"$ic753r\""
  ic753_mem=$(echo "$mb" | jq -c '.idempotency_cache.memory_max_entries | type')
  [[ "$ic753_mem" == '"number"' ]] || fail "/meta JSON idempotency_cache.memory_max_entries must be number (753), got \"$ic753_mem\""
  ic753_db=$(echo "$mb" | jq -c '.idempotency_cache.db_projection | type')
  [[ "$ic753_db" == '"string"' ]] || fail "/meta JSON idempotency_cache.db_projection must be string (753), got \"$ic753_db\""
  ic753_exp='["memory_max_entries","db_projection","rule","idempotency_cache_top_keys","idempotency_cache_top_keys_contract_753"]'
  ic753_got=$(echo "$mb" | jq -c '.idempotency_cache.idempotency_cache_top_keys // empty')
  [[ "$ic753_got" == "$ic753_exp" ]] || fail "/meta JSON idempotency_cache.idempotency_cache_top_keys must equal IDEMPOTENCY_CACHE (753), got \"$ic753_got\""
  sb753ic=$(echo "$mb" | jq -r '.idempotency_cache.idempotency_cache_top_keys_contract_753 // empty')
  [[ "$sb753ic" == *"753"* ]] || fail "/meta JSON idempotency_cache_top_keys_contract_753 must mention 753 (753), got \"$sb753ic\""
  [[ "$sb753ic" == *"memory_max_entries"* ]] || fail "/meta JSON idempotency_cache_top_keys_contract_753 must embed memory_max_entries (753), got \"$sb753ic\""
  [[ "$sb753ic" == *"db_projection"* ]] || fail "/meta JSON idempotency_cache_top_keys_contract_753 must embed db_projection (753), got \"$sb753ic\""
  [[ "$sb753ic" == *"rule"* ]] || fail "/meta JSON idempotency_cache_top_keys_contract_753 must embed rule (753), got \"$sb753ic\""
  df754r=$(echo "$mb" | jq -r '.defaults.rule // empty')
  [[ "$df754r" == *"754"* ]] || fail "/meta JSON defaults.rule must mention 754 (754), got \"$df754r\""
  df754_to=$(echo "$mb" | jq -c '.defaults.request_timeout_secs | type')
  [[ "$df754_to" == '"number"' ]] || fail "/meta JSON defaults.request_timeout_secs must be number (754), got \"$df754_to\""
  df754_bl=$(echo "$mb" | jq -c '.defaults.request_body_limit_bytes | type')
  [[ "$df754_bl" == '"number"' ]] || fail "/meta JSON defaults.request_body_limit_bytes must be number (754), got \"$df754_bl\""
  df754_ic=$(echo "$mb" | jq -c '.defaults.idempotency_cache_max | type')
  [[ "$df754_ic" == '"number"' ]] || fail "/meta JSON defaults.idempotency_cache_max must be number (754), got \"$df754_ic\""
  df754_exp='["request_timeout_secs","request_body_limit_bytes","idempotency_cache_max","rule","defaults_top_keys","defaults_top_keys_contract_754"]'
  df754_got=$(echo "$mb" | jq -c '.defaults.defaults_top_keys // empty')
  [[ "$df754_got" == "$df754_exp" ]] || fail "/meta JSON defaults.defaults_top_keys must equal DEFAULTS_META (754), got \"$df754_got\""
  sb754df=$(echo "$mb" | jq -r '.defaults.defaults_top_keys_contract_754 // empty')
  [[ "$sb754df" == *"754"* ]] || fail "/meta JSON defaults_top_keys_contract_754 must mention 754 (754), got \"$sb754df\""
  [[ "$sb754df" == *"request_timeout_secs"* ]] || fail "/meta JSON defaults_top_keys_contract_754 must embed request_timeout_secs (754), got \"$sb754df\""
  [[ "$sb754df" == *"request_body_limit_bytes"* ]] || fail "/meta JSON defaults_top_keys_contract_754 must embed request_body_limit_bytes (754), got \"$sb754df\""
  [[ "$sb754df" == *"idempotency_cache_max"* ]] || fail "/meta JSON defaults_top_keys_contract_754 must embed idempotency_cache_max (754), got \"$sb754df\""
  [[ "$sb754df" == *"rule"* ]] || fail "/meta JSON defaults_top_keys_contract_754 must embed rule (754), got \"$sb754df\""
  ob755r=$(echo "$mb" | jq -r '.outbox.rule // empty')
  [[ "$ob755r" == *"755"* ]] || fail "/meta JSON outbox.rule must mention 755 (755), got \"$ob755r\""
  ob755_dir=$(echo "$mb" | jq -c '.outbox.dir | type')
  [[ "$ob755_dir" == '"string"' ]] || fail "/meta JSON outbox.dir must be string (755), got \"$ob755_dir\""
  ob755_we=$(echo "$mb" | jq -c '.outbox.worker_enabled | type')
  [[ "$ob755_we" == '"boolean"' ]] || fail "/meta JSON outbox.worker_enabled must be boolean (755), got \"$ob755_we\""
  ob755_ls=$(echo "$mb" | jq -c '.outbox.lease_secs | type')
  [[ "$ob755_ls" == '"number"' ]] || fail "/meta JSON outbox.lease_secs must be number (755), got \"$ob755_ls\""
  ob755_pm=$(echo "$mb" | jq -c '.outbox.poll_ms | type')
  [[ "$ob755_pm" == '"number"' ]] || fail "/meta JSON outbox.poll_ms must be number (755), got \"$ob755_pm\""
  ob755_ma=$(echo "$mb" | jq -c '.outbox.max_attempts | type')
  [[ "$ob755_ma" == '"number"' ]] || fail "/meta JSON outbox.max_attempts must be number (755), got \"$ob755_ma\""
  ob755_exp='["dir","worker_enabled","lease_secs","poll_ms","max_attempts","rule","outbox_top_keys","outbox_top_keys_contract_755"]'
  ob755_got=$(echo "$mb" | jq -c '.outbox.outbox_top_keys // empty')
  [[ "$ob755_got" == "$ob755_exp" ]] || fail "/meta JSON outbox.outbox_top_keys must equal OUTBOX_META (755), got \"$ob755_got\""
  sb755ob=$(echo "$mb" | jq -r '.outbox.outbox_top_keys_contract_755 // empty')
  [[ "$sb755ob" == *"755"* ]] || fail "/meta JSON outbox_top_keys_contract_755 must mention 755 (755), got \"$sb755ob\""
  [[ "$sb755ob" == *"dir"* ]] || fail "/meta JSON outbox_top_keys_contract_755 must embed dir (755), got \"$sb755ob\""
  [[ "$sb755ob" == *"worker_enabled"* ]] || fail "/meta JSON outbox_top_keys_contract_755 must embed worker_enabled (755), got \"$sb755ob\""
  [[ "$sb755ob" == *"lease_secs"* ]] || fail "/meta JSON outbox_top_keys_contract_755 must embed lease_secs (755), got \"$sb755ob\""
  [[ "$sb755ob" == *"poll_ms"* ]] || fail "/meta JSON outbox_top_keys_contract_755 must embed poll_ms (755), got \"$sb755ob\""
  [[ "$sb755ob" == *"max_attempts"* ]] || fail "/meta JSON outbox_top_keys_contract_755 must embed max_attempts (755), got \"$sb755ob\""
  [[ "$sb755ob" == *"rule"* ]] || fail "/meta JSON outbox_top_keys_contract_755 must embed rule (755), got \"$sb755ob\""
  rl756r=$(echo "$mb" | jq -r '.rate_limits.rule // empty')
  [[ "$rl756r" == *"756"* ]] || fail "/meta JSON rate_limits.rule must mention 756 (756), got \"$rl756r\""
  rl756_ws=$(echo "$mb" | jq -c '.rate_limits.window_seconds | type')
  [[ "$rl756_ws" == '"number"' ]] || fail "/meta JSON rate_limits.window_seconds must be number (756), got \"$rl756_ws\""
  rl756_api=$(echo "$mb" | jq -c '.rate_limits.api_limit_disabled | type')
  [[ "$rl756_api" == '"boolean"' ]] || fail "/meta JSON rate_limits.api_limit_disabled must be boolean (756), got \"$rl756_api\""
  rl756_gu=$(echo "$mb" | jq -c '.rate_limits.guide_upload | type')
  [[ "$rl756_gu" == '"object"' ]] || fail "/meta JSON rate_limits.guide_upload must be object (756), got \"$rl756_gu\""
  rl756_exp='["window_seconds","api_requests_per_minute_per_client","api_limit_disabled","critical_writes_per_minute_per_client","critical_limit_disabled","evidence_posts_per_minute_per_order_user","evidence_limit_disabled","review_submits_per_minute_per_order_reviewer","review_limit_disabled","review_low_score_min_comment_chars","review_low_score_rule_disabled","guide_upload","rule","rate_limits_top_keys","rate_limits_top_keys_contract_756"]'
  rl756_got=$(echo "$mb" | jq -c '.rate_limits.rate_limits_top_keys // empty')
  [[ "$rl756_got" == "$rl756_exp" ]] || fail "/meta JSON rate_limits.rate_limits_top_keys must equal RATE_LIMITS_META (756), got \"$rl756_got\""
  sb756rl=$(echo "$mb" | jq -r '.rate_limits.rate_limits_top_keys_contract_756 // empty')
  [[ "$sb756rl" == *"756"* ]] || fail "/meta JSON rate_limits_top_keys_contract_756 must mention 756 (756), got \"$sb756rl\""
  [[ "$sb756rl" == *"window_seconds"* ]] || fail "/meta JSON rate_limits_top_keys_contract_756 must embed window_seconds (756), got \"$sb756rl\""
  [[ "$sb756rl" == *"guide_upload"* ]] || fail "/meta JSON rate_limits_top_keys_contract_756 must embed guide_upload (756), got \"$sb756rl\""
  [[ "$sb756rl" == *"rate_limits_top_keys"* ]] || fail "/meta JSON rate_limits_top_keys_contract_756 must embed rate_limits_top_keys (756), got \"$sb756rl\""
  im757r=$(echo "$mb" | jq -r '.indexer.memory.rule // empty')
  [[ "$im757r" == *"757"* ]] || fail "/meta JSON indexer.memory.rule must mention 757 (757), got \"$im757r\""
  im757_av=$(echo "$mb" | jq -c '.indexer.memory.available | type')
  [[ "$im757_av" == '"boolean"' ]] || fail "/meta JSON indexer.memory.available must be boolean (757), got \"$im757_av\""
  im757_exp='["available","last_block","last_log_index","last_block_hash_prefix","events_cached","rule","indexer_memory_top_keys","indexer_memory_top_keys_contract_757"]'
  im757_got=$(echo "$mb" | jq -c '.indexer.memory.indexer_memory_top_keys // empty')
  [[ "$im757_got" == "$im757_exp" ]] || fail "/meta JSON indexer.memory.indexer_memory_top_keys must equal INDEXER_MEMORY_META (757), got \"$im757_got\""
  sb757im=$(echo "$mb" | jq -r '.indexer.memory.indexer_memory_top_keys_contract_757 // empty')
  [[ "$sb757im" == *"757"* ]] || fail "/meta JSON indexer_memory_top_keys_contract_757 must mention 757 (757), got \"$sb757im\""
  [[ "$sb757im" == *"available"* ]] || fail "/meta JSON indexer_memory_top_keys_contract_757 must embed available (757), got \"$sb757im\""
  [[ "$sb757im" == *"events_cached"* ]] || fail "/meta JSON indexer_memory_top_keys_contract_757 must embed events_cached (757), got \"$sb757im\""
  idx757r=$(echo "$mb" | jq -r '.indexer.rule // empty')
  [[ "$idx757r" == *"757"* ]] || fail "/meta JSON indexer.rule must mention 757 (757), got \"$idx757r\""
  [[ "$idx757r" == *"758"* ]] || fail "/meta JSON indexer.rule must mention 758 (758), got \"$idx757r\""
  cp758r=$(echo "$mb" | jq -r '.indexer.checkpoint.rule // empty')
  [[ "$cp758r" == *"758"* ]] || fail "/meta JSON indexer.checkpoint.rule must mention 758 (758), got \"$cp758r\""
  cp758_exp='["block_number","log_index","source","rule","indexer_checkpoint_top_keys","indexer_checkpoint_top_keys_contract_758"]'
  cp758_got=$(echo "$mb" | jq -c '.indexer.checkpoint.indexer_checkpoint_top_keys // empty')
  [[ "$cp758_got" == "$cp758_exp" ]] || fail "/meta JSON indexer.checkpoint.indexer_checkpoint_top_keys must equal INDEXER_CHECKPOINT_META (758), got \"$cp758_got\""
  sb758cp=$(echo "$mb" | jq -r '.indexer.checkpoint.indexer_checkpoint_top_keys_contract_758 // empty')
  [[ "$sb758cp" == *"758"* ]] || fail "/meta JSON indexer_checkpoint_top_keys_contract_758 must mention 758 (758), got \"$sb758cp\""
  [[ "$sb758cp" == *"block_number"* ]] || fail "/meta JSON indexer_checkpoint_top_keys_contract_758 must embed block_number (758), got \"$sb758cp\""
  [[ "$sb758cp" == *"source"* ]] || fail "/meta JSON indexer_checkpoint_top_keys_contract_758 must embed source (758), got \"$sb758cp\""
  fdtype=$(echo "$mb" | jq -r '.indexer.finality_discipline | type')
  [[ "$fdtype" == "object" ]] || fail "/meta JSON .indexer.finality_discipline must be object (704)"
  ocstype=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status | type')
  [[ "$ocstype" == "object" ]] || fail "/meta JSON .indexer.finality_discipline.order_chain_sync_status must be object (704)"
  oar704=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.optional_event_log_snapshot_absent_reason // empty')
  [[ "$oar704" == *"703"* ]] || fail "/meta JSON order_chain_sync_status.optional_event_log_snapshot_absent_reason must mention 703 (704), got \"$oar704\""
  oelog702=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.optional_event_log_snapshot // empty')
  [[ "$oelog702" == *"702"* ]] || fail "/meta JSON order_chain_sync_status.optional_event_log_snapshot must mention 702 (705), got \"$oelog702\""
  [[ "$oelog702" == *"722"* ]] || fail "/meta JSON order_chain_sync_status.optional_event_log_snapshot must mention 722 (722), got \"$oelog702\""
  ole706=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.optional_last_event // empty')
  [[ "$ole706" == *"706"* ]] || fail "/meta JSON order_chain_sync_status.optional_last_event must mention 706 (706), got \"$ole706\""
  oid707=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.success_body_order_id // empty')
  [[ "$oid707" == *"707"* ]] || fail "/meta JSON order_chain_sync_status.success_body_order_id must mention 707 (707), got \"$oid707\""
  req708=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.minimal_body_requester // empty')
  [[ "$req708" == *"708"* ]] || fail "/meta JSON order_chain_sync_status.minimal_body_requester must mention 708 (708), got \"$req708\""
  mbs709=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.minimal_body_chain_sync_status_unknown // empty')
  [[ "$mbs709" == *"709"* ]] || fail "/meta JSON order_chain_sync_status.minimal_body_chain_sync_status_unknown must mention 709 (709), got \"$mbs709\""
  cp710=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.chain_sync_checkpoint // empty')
  [[ "$cp710" == *"710"* ]] || fail "/meta JSON order_chain_sync_status.chain_sync_checkpoint must mention 710 (710), got \"$cp710\""
  [[ "$cp710" == *"723"* ]] || fail "/meta JSON order_chain_sync_status.chain_sync_checkpoint must mention 723 (723), got \"$cp710\""
  [[ "$cp710" == *"block_number"* ]] || fail "/meta JSON chain_sync_checkpoint must embed block_number (723), got \"$cp710\""
  [[ "$cp710" == *"log_index"* ]] || fail "/meta JSON chain_sync_checkpoint must embed log_index (723), got \"$cp710\""
  [[ "$cp710" == *"source"* ]] || fail "/meta JSON chain_sync_checkpoint must embed source (723), got \"$cp710\""
  fn711=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.chain_sync_finality_n // empty')
  [[ "$fn711" == *"711"* ]] || fail "/meta JSON order_chain_sync_status.chain_sync_finality_n must mention 711 (711), got \"$fn711\""
  se713=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.chain_sync_status_enum // empty')
  [[ "$se713" == *"713"* ]] || fail "/meta JSON order_chain_sync_status.chain_sync_status_enum must mention 713 (713), got \"$se713\""
  mn714=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.minimal_body_note_stable // empty')
  [[ "$mn714" == *"714"* ]] || fail "/meta JSON order_chain_sync_status.minimal_body_note_stable must mention 714 (714), got \"$mn714\""
  [[ "$mn714" == *"minimal runtime snapshot when order projection backend is unavailable"* ]] || fail "/meta JSON minimal_body_note_stable must embed stable note sentence (714), got \"$mn714\""
  sb715=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.success_body_envelope_status // empty')
  [[ "$sb715" == *"715"* ]] || fail "/meta JSON order_chain_sync_status.success_body_envelope_status must mention 715 (715), got \"$sb715\""
  [[ "$sb715" == *"ok"* ]] || fail "/meta JSON success_body_envelope_status must embed envelope literal ok (715), got \"$sb715\""
  sb716=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.chain_sync_required_top_keys // empty')
  [[ "$sb716" == *"716"* ]] || fail "/meta JSON order_chain_sync_status.chain_sync_required_top_keys must mention 716 (716), got \"$sb716\""
  [[ "$sb716" == *"status"* ]] || fail "/meta JSON chain_sync_required_top_keys must mention status (716), got \"$sb716\""
  [[ "$sb716" == *"finality_n"* ]] || fail "/meta JSON chain_sync_required_top_keys must mention finality_n (716), got \"$sb716\""
  [[ "$sb716" == *"checkpoint"* ]] || fail "/meta JSON chain_sync_required_top_keys must mention checkpoint (716), got \"$sb716\""
  [[ "$sb716" == *"last_event"* ]] || fail "/meta JSON chain_sync_required_top_keys must mention last_event (716), got \"$sb716\""
  mp717_expect="GET /api/v1/orders/:id/chain-sync-status"
  mp717_got=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.method_path // empty')
  [[ "$mp717_got" == "$mp717_expect" ]] || fail "/meta JSON order_chain_sync_status.method_path must equal SSOT (717), got \"$mp717_got\""
  sb717=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.method_path_contract_717 // empty')
  [[ "$sb717" == *"717"* ]] || fail "/meta JSON method_path_contract_717 must mention 717 (717), got \"$sb717\""
  [[ "$sb717" == *"$mp717_expect"* ]] || fail "/meta JSON method_path_contract_717 must embed method_path (717), got \"$sb717\""
  [[ "$sb717" == *"/api/v1/orders/:id/chain-sync-status"* ]] || fail "/meta JSON method_path_contract_717 must embed route path (717), got \"$sb717\""
  c718_expect="crates/api/src/routes/orders/mod.rs get_order_chain_sync_status"
  c718_got=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.code // empty')
  [[ "$c718_got" == "$c718_expect" ]] || fail "/meta JSON order_chain_sync_status.code must equal SSOT (718), got \"$c718_got\""
  sb718=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.code_contract_718 // empty')
  [[ "$sb718" == *"718"* ]] || fail "/meta JSON code_contract_718 must mention 718 (718), got \"$sb718\""
  [[ "$sb718" == *"crates/api/src/routes/orders/mod.rs"* ]] || fail "/meta JSON code_contract_718 must embed mod path (718), got \"$sb718\""
  [[ "$sb718" == *"get_order_chain_sync_status"* ]] || fail "/meta JSON code_contract_718 must embed handler symbol (718), got \"$sb718\""
  sv719_exp='["pending","confirmed","unknown"]'
  sv719_got=$(echo "$mb" | jq -c '.indexer.finality_discipline.order_chain_sync_status.status_values // empty')
  [[ "$sv719_got" == "$sv719_exp" ]] || fail "/meta JSON order_chain_sync_status.status_values must equal SSOT (719), got \"$sv719_got\""
  sb719=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.status_values_contract_719 // empty')
  [[ "$sb719" == *"719"* ]] || fail "/meta JSON status_values_contract_719 must mention 719 (719), got \"$sb719\""
  [[ "$sb719" == *"pending"* ]] || fail "/meta JSON status_values_contract_719 must embed pending (719), got \"$sb719\""
  [[ "$sb719" == *"confirmed"* ]] || fail "/meta JSON status_values_contract_719 must embed confirmed (719), got \"$sb719\""
  [[ "$sb719" == *"unknown"* ]] || fail "/meta JSON status_values_contract_719 must embed unknown (719), got \"$sb719\""
  ar720_exp='["no_database","no_chain_context","no_row","read_failed","projection_backend_unavailable"]'
  ar720_got=$(echo "$mb" | jq -c '.indexer.finality_discipline.order_chain_sync_status.absent_reason_values // empty')
  [[ "$ar720_got" == "$ar720_exp" ]] || fail "/meta JSON order_chain_sync_status.absent_reason_values must equal SSOT (720), got \"$ar720_got\""
  sb720=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.absent_reason_values_contract_720 // empty')
  [[ "$sb720" == *"720"* ]] || fail "/meta JSON absent_reason_values_contract_720 must mention 720 (720), got \"$sb720\""
  [[ "$sb720" == *"no_database"* ]] || fail "/meta JSON absent_reason_values_contract_720 must embed no_database (720), got \"$sb720\""
  [[ "$sb720" == *"no_chain_context"* ]] || fail "/meta JSON absent_reason_values_contract_720 must embed no_chain_context (720), got \"$sb720\""
  [[ "$sb720" == *"no_row"* ]] || fail "/meta JSON absent_reason_values_contract_720 must embed no_row (720), got \"$sb720\""
  [[ "$sb720" == *"read_failed"* ]] || fail "/meta JSON absent_reason_values_contract_720 must embed read_failed (720), got \"$sb720\""
  [[ "$sb720" == *"projection_backend_unavailable"* ]] || fail "/meta JSON absent_reason_values_contract_720 must embed projection_backend_unavailable (720), got \"$sb720\""
  le721_exp='["state","updated_at","escrow_address"]'
  le721_got=$(echo "$mb" | jq -c '.indexer.finality_discipline.order_chain_sync_status.last_event_top_keys // empty')
  [[ "$le721_got" == "$le721_exp" ]] || fail "/meta JSON order_chain_sync_status.last_event_top_keys must equal SSOT (721), got \"$le721_got\""
  sb721=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.last_event_keys_contract_721 // empty')
  [[ "$sb721" == *"721"* ]] || fail "/meta JSON last_event_keys_contract_721 must mention 721 (721), got \"$sb721\""
  [[ "$sb721" == *"state"* ]] || fail "/meta JSON last_event_keys_contract_721 must embed state (721), got \"$sb721\""
  [[ "$sb721" == *"updated_at"* ]] || fail "/meta JSON last_event_keys_contract_721 must embed updated_at (721), got \"$sb721\""
  [[ "$sb721" == *"escrow_address"* ]] || fail "/meta JSON last_event_keys_contract_721 must embed escrow_address (721), got \"$sb721\""
  el722_exp='["finality_n_used","block_number","log_index","event_type","tx_hash","block_hash"]'
  el722_got=$(echo "$mb" | jq -c '.indexer.finality_discipline.order_chain_sync_status.event_log_snapshot_top_keys // empty')
  [[ "$el722_got" == "$el722_exp" ]] || fail "/meta JSON order_chain_sync_status.event_log_snapshot_top_keys must equal SSOT (722), got \"$el722_got\""
  sb722=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.event_log_snapshot_keys_contract_722 // empty')
  [[ "$sb722" == *"722"* ]] || fail "/meta JSON event_log_snapshot_keys_contract_722 must mention 722 (722), got \"$sb722\""
  [[ "$sb722" == *"finality_n_used"* ]] || fail "/meta JSON event_log_snapshot_keys_contract_722 must embed finality_n_used (722), got \"$sb722\""
  [[ "$sb722" == *"block_number"* ]] || fail "/meta JSON event_log_snapshot_keys_contract_722 must embed block_number (722), got \"$sb722\""
  [[ "$sb722" == *"log_index"* ]] || fail "/meta JSON event_log_snapshot_keys_contract_722 must embed log_index (722), got \"$sb722\""
  [[ "$sb722" == *"event_type"* ]] || fail "/meta JSON event_log_snapshot_keys_contract_722 must embed event_type (722), got \"$sb722\""
  [[ "$sb722" == *"tx_hash"* ]] || fail "/meta JSON event_log_snapshot_keys_contract_722 must embed tx_hash (722), got \"$sb722\""
  [[ "$sb722" == *"block_hash"* ]] || fail "/meta JSON event_log_snapshot_keys_contract_722 must embed block_hash (722), got \"$sb722\""
  cp723_exp='["block_number","log_index","source"]'
  cp723_got=$(echo "$mb" | jq -c '.indexer.finality_discipline.order_chain_sync_status.checkpoint_top_keys // empty')
  [[ "$cp723_got" == "$cp723_exp" ]] || fail "/meta JSON order_chain_sync_status.checkpoint_top_keys must equal SSOT (723), got \"$cp723_got\""
  sb723=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.checkpoint_keys_contract_723 // empty')
  [[ "$sb723" == *"723"* ]] || fail "/meta JSON checkpoint_keys_contract_723 must mention 723 (723), got \"$sb723\""
  [[ "$sb723" == *"block_number"* ]] || fail "/meta JSON checkpoint_keys_contract_723 must embed block_number (723), got \"$sb723\""
  [[ "$sb723" == *"log_index"* ]] || fail "/meta JSON checkpoint_keys_contract_723 must embed log_index (723), got \"$sb723\""
  [[ "$sb723" == *"source"* ]] || fail "/meta JSON checkpoint_keys_contract_723 must embed source (723), got \"$sb723\""
  cs724_exp='["runtime","startup_snapshot"]'
  cs724_got=$(echo "$mb" | jq -c '.indexer.finality_discipline.order_chain_sync_status.checkpoint_source_values // empty')
  [[ "$cs724_got" == "$cs724_exp" ]] || fail "/meta JSON order_chain_sync_status.checkpoint_source_values must equal SSOT (724), got \"$cs724_got\""
  sb724=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.checkpoint_source_values_contract_724 // empty')
  [[ "$sb724" == *"724"* ]] || fail "/meta JSON checkpoint_source_values_contract_724 must mention 724 (724), got \"$sb724\""
  [[ "$sb724" == *"runtime"* ]] || fail "/meta JSON checkpoint_source_values_contract_724 must embed runtime (724), got \"$sb724\""
  [[ "$sb724" == *"startup_snapshot"* ]] || fail "/meta JSON checkpoint_source_values_contract_724 must embed startup_snapshot (724), got \"$sb724\""
  cs712=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.chain_sync_checkpoint_source // empty')
  [[ "$cs712" == *"712"* ]] || fail "/meta JSON chain_sync_checkpoint_source must mention 712 (712), got \"$cs712\""
  [[ "$cs712" == *"724"* ]] || fail "/meta JSON chain_sync_checkpoint_source must mention 724 (724), got \"$cs712\""
  [[ "$cs712" == *"runtime"* ]] || fail "/meta JSON chain_sync_checkpoint_source must embed runtime (724), got \"$cs712\""
  [[ "$cs712" == *"startup_snapshot"* ]] || fail "/meta JSON chain_sync_checkpoint_source must embed startup_snapshot (724), got \"$cs712\""
  ocs725_exp='["method_path","method_path_contract_717","status_values","status_values_contract_719","absent_reason_values","absent_reason_values_contract_720","code","code_contract_718","event_log_snapshot_top_keys","event_log_snapshot_keys_contract_722","optional_event_log_snapshot","optional_event_log_snapshot_absent_reason","last_event_top_keys","last_event_keys_contract_721","checkpoint_top_keys","checkpoint_keys_contract_723","checkpoint_source_values","checkpoint_source_values_contract_724","optional_last_event","success_body_order_id","success_body_envelope_status","chain_sync_required_top_keys","minimal_body_requester","minimal_body_chain_sync_status_unknown","chain_sync_checkpoint","chain_sync_finality_n","chain_sync_checkpoint_source","chain_sync_status_enum","minimal_body_note_stable","order_chain_sync_status_top_keys","order_chain_sync_status_top_keys_contract_725","rule"]'
  ocs725_got=$(echo "$mb" | jq -c '.indexer.finality_discipline.order_chain_sync_status.order_chain_sync_status_top_keys // empty')
  [[ "$ocs725_got" == "$ocs725_exp" ]] || fail "/meta JSON order_chain_sync_status.order_chain_sync_status_top_keys must equal SSOT (725), got \"$ocs725_got\""
  sb725=$(echo "$mb" | jq -r '.indexer.finality_discipline.order_chain_sync_status.order_chain_sync_status_top_keys_contract_725 // empty')
  [[ "$sb725" == *"725"* ]] || fail "/meta JSON order_chain_sync_status_top_keys_contract_725 must mention 725 (725), got \"$sb725\""
  [[ "$sb725" == *"method_path"* ]] || fail "/meta JSON order_chain_sync_status_top_keys_contract_725 must embed method_path (725), got \"$sb725\""
  [[ "$sb725" == *"rule"* ]] || fail "/meta JSON order_chain_sync_status_top_keys_contract_725 must embed rule (725), got \"$sb725\""
  fd726_exp='["tick_logs_upper_bound","postgres_event_log_has_finality_n_used","order_chain_sync_status","chain_tip_not_in_meta","chain_tip_hint","finality_discipline_top_keys","finality_discipline_top_keys_contract_726"]'
  fd726_got=$(echo "$mb" | jq -c '.indexer.finality_discipline.finality_discipline_top_keys // empty')
  [[ "$fd726_got" == "$fd726_exp" ]] || fail "/meta JSON finality_discipline.finality_discipline_top_keys must equal SSOT (726), got \"$fd726_got\""
  sb726=$(echo "$mb" | jq -r '.indexer.finality_discipline.finality_discipline_top_keys_contract_726 // empty')
  [[ "$sb726" == *"726"* ]] || fail "/meta JSON finality_discipline_top_keys_contract_726 must mention 726 (726), got \"$sb726\""
  [[ "$sb726" == *"tick_logs_upper_bound"* ]] || fail "/meta JSON finality_discipline_top_keys_contract_726 must embed tick_logs_upper_bound (726), got \"$sb726\""
  [[ "$sb726" == *"order_chain_sync_status"* ]] || fail "/meta JSON finality_discipline_top_keys_contract_726 must embed order_chain_sync_status (726), got \"$sb726\""
  idxrule=$(echo "$mb" | jq -r '.indexer.rule // empty')
  [[ "$idxrule" == *"726"* ]] || fail "/meta JSON indexer.rule must mention 726 (726), got \"$idxrule\""
  [[ "$idxrule" == *"727"* ]] || fail "/meta JSON indexer.rule must mention 727 (727), got \"$idxrule\""
  ix727_exp='["state_path","checkpoint","last_seen_finality_n","replay_required","lag_blocks","lag_max_blocks","reorg_detected","finality_n","memory","finality_discipline","rule","indexer_top_keys","indexer_top_keys_contract_727"]'
  ix727_got=$(echo "$mb" | jq -c '.indexer.indexer_top_keys // empty')
  [[ "$ix727_got" == "$ix727_exp" ]] || fail "/meta JSON indexer.indexer_top_keys must equal SSOT (727), got \"$ix727_got\""
  sb727=$(echo "$mb" | jq -r '.indexer.indexer_top_keys_contract_727 // empty')
  [[ "$sb727" == *"727"* ]] || fail "/meta JSON indexer_top_keys_contract_727 must mention 727 (727), got \"$sb727\""
  [[ "$sb727" == *"state_path"* ]] || fail "/meta JSON indexer_top_keys_contract_727 must embed state_path (727), got \"$sb727\""
  [[ "$sb727" == *"finality_discipline"* ]] || fail "/meta JSON indexer_top_keys_contract_727 must embed finality_discipline (727), got \"$sb727\""
  chr728=$(echo "$mb" | jq -r '.chain.rule // empty')
  [[ "$chr728" == *"728"* ]] || fail "/meta JSON chain.rule must mention 728 (728), got \"$chr728\""
  [[ "$chr728" == *"729"* ]] || fail "/meta JSON chain.rule must mention 729 (729), got \"$chr728\""
  [[ "$chr728" == *"759"* ]] || fail "/meta JSON chain.rule must mention 759 (759), got \"$chr728\""
  [[ "$chr728" == *"760"* ]] || fail "/meta JSON chain.rule must mention 760 (760), got \"$chr728\""
  [[ "$chr728" == *"762"* ]] || fail "/meta JSON chain.rule must mention 762 (762), got \"$chr728\""
  [[ "$chr728" == *"763"* ]] || fail "/meta JSON chain.rule must mention 763 (763), got \"$chr728\""
  [[ "$chr728" == *"765"* ]] || fail "/meta JSON chain.rule must mention 765 (765), got \"$chr728\""
  [[ "$chr728" == *"766"* ]] || fail "/meta JSON chain.rule must mention 766 (766), got \"$chr728\""
  [[ "$chr728" == *"767"* ]] || fail "/meta JSON chain.rule must mention 767 (767), got \"$chr728\""
  [[ "$chr728" == *"768"* ]] || fail "/meta JSON chain.rule must mention 768 (768), got \"$chr728\""
  [[ "$chr728" == *"769"* ]] || fail "/meta JSON chain.rule must mention 769 (769), got \"$chr728\""
  [[ "$chr728" == *"770"* ]] || fail "/meta JSON chain.rule must mention 770 (770), got \"$chr728\""
  [[ "$chr728" == *"771"* ]] || fail "/meta JSON chain.rule must mention 771 (771), got \"$chr728\""
  [[ "$chr728" == *"772"* ]] || fail "/meta JSON chain.rule must mention 772 (772), got \"$chr728\""
  [[ "$chr728" == *"773"* ]] || fail "/meta JSON chain.rule must mention 773 (773), got \"$chr728\""
  [[ "$chr728" == *"774"* ]] || fail "/meta JSON chain.rule must mention 774 (774), got \"$chr728\""
  [[ "$chr728" == *"775"* ]] || fail "/meta JSON chain.rule must mention 775 (775), got \"$chr728\""
  [[ "$chr728" == *"776"* ]] || fail "/meta JSON chain.rule must mention 776 (776), got \"$chr728\""
  [[ "$chr728" == *"777"* ]] || fail "/meta JSON chain.rule must mention 777 (777), got \"$chr728\""
  [[ "$chr728" == *"778"* ]] || fail "/meta JSON chain.rule must mention 778 (778), got \"$chr728\""
  [[ "$chr728" == *"779"* ]] || fail "/meta JSON chain.rule must mention 779 (779), got \"$chr728\""
  [[ "$chr728" == *"780"* ]] || fail "/meta JSON chain.rule must mention 780 (780), got \"$chr728\""
  [[ "$chr728" == *"781"* ]] || fail "/meta JSON chain.rule must mention 781 (781), got \"$chr728\""
  [[ "$chr728" == *"782"* ]] || fail "/meta JSON chain.rule must mention 782 (782), got \"$chr728\""
  [[ "$chr728" == *"783"* ]] || fail "/meta JSON chain.rule must mention 783 (783), got \"$chr728\""
  [[ "$chr728" == *"784"* ]] || fail "/meta JSON chain.rule must mention 784 (784), got \"$chr728\""
  [[ "$chr728" == *"785"* ]] || fail "/meta JSON chain.rule must mention 785 (785), got \"$chr728\""
  [[ "$chr728" == *"786"* ]] || fail "/meta JSON chain.rule must mention 786 (786), got \"$chr728\""
  [[ "$chr728" == *"787"* ]] || fail "/meta JSON chain.rule must mention 787 (787), got \"$chr728\""
  [[ "$chr728" == *"788"* ]] || fail "/meta JSON chain.rule must mention 788 (788), got \"$chr728\""
  [[ "$chr728" == *"789"* ]] || fail "/meta JSON chain.rule must mention 789 (789), got \"$chr728\""
  [[ "$chr728" == *"790"* ]] || fail "/meta JSON chain.rule must mention 790 (790), got \"$chr728\""
  [[ "$chr728" == *"791"* ]] || fail "/meta JSON chain.rule must mention 791 (791), got \"$chr728\""
  [[ "$chr728" == *"792"* ]] || fail "/meta JSON chain.rule must mention 792 (792), got \"$chr728\""
  [[ "$chr728" == *"793"* ]] || fail "/meta JSON chain.rule must mention 793 (793), got \"$chr728\""
  [[ "$chr728" == *"794"* ]] || fail "/meta JSON chain.rule must mention 794 (794), got \"$chr728\""
  [[ "$chr728" == *"795"* ]] || fail "/meta JSON chain.rule must mention 795 (795), got \"$chr728\""
  [[ "$chr728" == *"796"* ]] || fail "/meta JSON chain.rule must mention 796 (796), got \"$chr728\""
  [[ "$chr728" == *"797"* ]] || fail "/meta JSON chain.rule must mention 797 (797), got \"$chr728\""
  [[ "$chr728" == *"798"* ]] || fail "/meta JSON chain.rule must mention 798 (798), got \"$chr728\""
  [[ "$chr728" == *"799"* ]] || fail "/meta JSON chain.rule must mention 799 (799), got \"$chr728\""
  [[ "$chr728" == *"800"* ]] || fail "/meta JSON chain.rule must mention 800 (800), got \"$chr728\""
  [[ "$chr728" == *"801"* ]] || fail "/meta JSON chain.rule must mention 801 (801), got \"$chr728\""
  [[ "$chr728" == *"802"* ]] || fail "/meta JSON chain.rule must mention 802 (802), got \"$chr728\""
  [[ "$chr728" == *"803"* ]] || fail "/meta JSON chain.rule must mention 803 (803), got \"$chr728\""
  [[ "$chr728" == *"804"* ]] || fail "/meta JSON chain.rule must mention 804 (804), got \"$chr728\""
  [[ "$chr728" == *"805"* ]] || fail "/meta JSON chain.rule must mention 805 (805), got \"$chr728\""
  [[ "$chr728" == *"806"* ]] || fail "/meta JSON chain.rule must mention 806 (806), got \"$chr728\""
  c729_exp='["chain_id","contracts","rule","chain_top_keys","chain_top_keys_contract_729"]'
  c729_got=$(echo "$mb" | jq -c '.chain.chain_top_keys // empty')
  [[ "$c729_got" == "$c729_exp" ]] || fail "/meta JSON chain.chain_top_keys must equal SSOT (729), got \"$c729_got\""
  sb729=$(echo "$mb" | jq -r '.chain.chain_top_keys_contract_729 // empty')
  [[ "$sb729" == *"729"* ]] || fail "/meta JSON chain_top_keys_contract_729 must mention 729 (729), got \"$sb729\""
  [[ "$sb729" == *"chain_id"* ]] || fail "/meta JSON chain_top_keys_contract_729 must embed chain_id (729), got \"$sb729\""
  [[ "$sb729" == *"contracts"* ]] || fail "/meta JSON chain_top_keys_contract_729 must embed contracts (729), got \"$sb729\""
  ct=$(echo "$mb" | jq -r '.chain.contracts | type')
  if [[ "$ct" == "object" ]]; then
    cc759r=$(echo "$mb" | jq -r '.chain.contracts.rule // empty')
    [[ "$cc759r" == *"759"* ]] || fail "/meta JSON chain.contracts.rule must mention 759 (759), got \"$cc759r\""
    c759_exp='["guide_staking_address","staking_provider_address","governor_address","timelock_address","governance_token_address","fee_router_address","treasury_address","registry_address","escrow_factory_address","region_steward_stake_pool_address","rule","chain_contracts_top_keys","chain_contracts_top_keys_contract_759"]'
    c759_got=$(jq -c '.chain.contracts.chain_contracts_top_keys' "$META_BODY_FILE")
    [[ "$c759_got" == "$c759_exp" ]] || fail "/meta JSON chain.contracts.chain_contracts_top_keys must equal CHAIN_CONTRACTS_META (759), got \"$c759_got\""
    sb759cc=$(jq -r '.chain.contracts.chain_contracts_top_keys_contract_759' "$META_BODY_FILE")
    [[ "$sb759cc" == *"759"* ]] || fail "/meta JSON chain_contracts_top_keys_contract_759 must mention 759 (759), got \"$sb759cc\""
    [[ "$sb759cc" == *"escrow_factory_address"* ]] || fail "/meta JSON chain_contracts_top_keys_contract_759 must embed escrow_factory_address (759), got \"$sb759cc\""
    [[ "$sb759cc" == *"registry_address"* ]] || fail "/meta JSON chain_contracts_top_keys_contract_759 must embed registry_address (759), got \"$sb759cc\""
  fi
  br730=$(echo "$mb" | jq -r '.build.rule // empty')
  [[ "$br730" == *"730"* ]] || fail "/meta JSON build.rule must mention 730 (730), got \"$br730\""
  b730_exp='["git_sha","deployed_at","rule","build_top_keys","build_top_keys_contract_730"]'
  b730_got=$(echo "$mb" | jq -c '.build.build_top_keys // empty')
  [[ "$b730_got" == "$b730_exp" ]] || fail "/meta JSON build.build_top_keys must equal SSOT (730), got \"$b730_got\""
  sb730=$(echo "$mb" | jq -r '.build.build_top_keys_contract_730 // empty')
  [[ "$sb730" == *"730"* ]] || fail "/meta JSON build_top_keys_contract_730 must mention 730 (730), got \"$sb730\""
  [[ "$sb730" == *"git_sha"* ]] || fail "/meta JSON build_top_keys_contract_730 must embed git_sha (730), got \"$sb730\""
  [[ "$sb730" == *"deployed_at"* ]] || fail "/meta JSON build_top_keys_contract_730 must embed deployed_at (730), got \"$sb730\""
  dw732r=$(echo "$mb" | jq -r '.dual_write.rule // empty')
  [[ "$dw732r" == *"732"* ]] || fail "/meta JSON dual_write.rule must mention 732 (732), got \"$dw732r\""
  dw732_exp='["failure_policy","strict_db_write_any","rule","dual_write_top_keys","dual_write_top_keys_contract_732"]'
  dw732_got=$(echo "$mb" | jq -c '.dual_write.dual_write_top_keys // empty')
  [[ "$dw732_got" == "$dw732_exp" ]] || fail "/meta JSON dual_write.dual_write_top_keys must equal SSOT (732), got \"$dw732_got\""
  sb732dw=$(echo "$mb" | jq -r '.dual_write.dual_write_top_keys_contract_732 // empty')
  [[ "$sb732dw" == *"732"* ]] || fail "/meta JSON dual_write_top_keys_contract_732 must mention 732 (732), got \"$sb732dw\""
  [[ "$sb732dw" == *"failure_policy"* ]] || fail "/meta JSON dual_write_top_keys_contract_732 must embed failure_policy (732), got \"$sb732dw\""
  [[ "$sb732dw" == *"strict_db_write_any"* ]] || fail "/meta JSON dual_write_top_keys_contract_732 must embed strict_db_write_any (732), got \"$sb732dw\""
  sm731r=$(echo "$mb" | jq -r '.strict_mode.rule // empty')
  [[ "$sm731r" == *"731"* ]] || fail "/meta JSON strict_mode.rule must mention 731 (731), got \"$sm731r\""
  sm731_exp='["strict_ssot","require_idempotency_key","strict_session_gate","internal_api_secret_configured","rule","strict_mode_top_keys","strict_mode_top_keys_contract_731"]'
  sm731_got=$(echo "$mb" | jq -c '.strict_mode.strict_mode_top_keys // empty')
  [[ "$sm731_got" == "$sm731_exp" ]] || fail "/meta JSON strict_mode.strict_mode_top_keys must equal SSOT (731), got \"$sm731_got\""
  sb731=$(echo "$mb" | jq -r '.strict_mode.strict_mode_top_keys_contract_731 // empty')
  [[ "$sb731" == *"731"* ]] || fail "/meta JSON strict_mode_top_keys_contract_731 must mention 731 (731), got \"$sb731\""
  [[ "$sb731" == *"strict_ssot"* ]] || fail "/meta JSON strict_mode_top_keys_contract_731 must embed strict_ssot (731), got \"$sb731\""
  [[ "$sb731" == *"internal_api_secret_configured"* ]] || fail "/meta JSON strict_mode_top_keys_contract_731 must embed internal_api_secret_configured (731), got \"$sb731\""
  ss733r=$(echo "$mb" | jq -r '.ssot.rule // empty')
  [[ "$ss733r" == *"733"* ]] || fail "/meta JSON ssot.rule must mention 733 (733), got \"$ss733r\""
  ss733_exp='["expected_sha256","computed_sha256","match","file","rule","ssot_top_keys","ssot_top_keys_contract_733"]'
  ss733_got=$(echo "$mb" | jq -c '.ssot.ssot_top_keys // empty')
  [[ "$ss733_got" == "$ss733_exp" ]] || fail "/meta JSON ssot.ssot_top_keys must equal SSOT (733), got \"$ss733_got\""
  sb733ss=$(echo "$mb" | jq -r '.ssot.ssot_top_keys_contract_733 // empty')
  [[ "$sb733ss" == *"733"* ]] || fail "/meta JSON ssot_top_keys_contract_733 must mention 733 (733), got \"$sb733ss\""
  [[ "$sb733ss" == *"expected_sha256"* ]] || fail "/meta JSON ssot_top_keys_contract_733 must embed expected_sha256 (733), got \"$sb733ss\""
  [[ "$sb733ss" == *"computed_sha256"* ]] || fail "/meta JSON ssot_top_keys_contract_733 must embed computed_sha256 (733), got \"$sb733ss\""
  ae734r=$(echo "$mb" | jq -r '.admin_exports.rule // empty')
  [[ "$ae734r" == *"734"* ]] || fail "/meta JSON admin_exports.rule must mention 734 (734), got \"$ae734r\""
  ae734_exp='["reconcile_ed25519_public_key_hex","reconcile_ed25519_response_header","rule","admin_exports_top_keys","admin_exports_top_keys_contract_734"]'
  ae734_got=$(echo "$mb" | jq -c '.admin_exports.admin_exports_top_keys // empty')
  [[ "$ae734_got" == "$ae734_exp" ]] || fail "/meta JSON admin_exports.admin_exports_top_keys must equal ADMIN_EXPORTS (734), got \"$ae734_got\""
  sb734ae=$(echo "$mb" | jq -r '.admin_exports.admin_exports_top_keys_contract_734 // empty')
  [[ "$sb734ae" == *"734"* ]] || fail "/meta JSON admin_exports_top_keys_contract_734 must mention 734 (734), got \"$sb734ae\""
  [[ "$sb734ae" == *"reconcile_ed25519_public_key_hex"* ]] || fail "/meta JSON admin_exports_top_keys_contract_734 must embed reconcile_ed25519_public_key_hex (734), got \"$sb734ae\""
  [[ "$sb734ae" == *"reconcile_ed25519_response_header"* ]] || fail "/meta JSON admin_exports_top_keys_contract_734 must embed reconcile_ed25519_response_header (734), got \"$sb734ae\""
  cb735r=$(echo "$mb" | jq -r '.chargeback_policy.rule // empty')
  [[ "$cb735r" == *"735"* ]] || fail "/meta JSON chargeback_policy.rule must mention 735 (735), got \"$cb735r\""
  cb735_exp='["value","rule","chargeback_policy_top_keys","chargeback_policy_top_keys_contract_735"]'
  cb735_got=$(echo "$mb" | jq -c '.chargeback_policy.chargeback_policy_top_keys // empty')
  [[ "$cb735_got" == "$cb735_exp" ]] || fail "/meta JSON chargeback_policy.chargeback_policy_top_keys must equal CHARGEBACK_POLICY (735), got \"$cb735_got\""
  sb735cb=$(echo "$mb" | jq -r '.chargeback_policy.chargeback_policy_top_keys_contract_735 // empty')
  [[ "$sb735cb" == *"735"* ]] || fail "/meta JSON chargeback_policy_top_keys_contract_735 must mention 735 (735), got \"$sb735cb\""
  [[ "$sb735cb" == *"value"* ]] || fail "/meta JSON chargeback_policy_top_keys_contract_735 must embed value (735), got \"$sb735cb\""
  [[ "$sb735cb" == *"rule"* ]] || fail "/meta JSON chargeback_policy_top_keys_contract_735 must embed rule (735), got \"$sb735cb\""
  au736r=$(echo "$mb" | jq -r '.authority.rule // empty')
  [[ "$au736r" == *"736"* ]] || fail "/meta JSON authority.rule must mention 736 (736), got \"$au736r\""
  au736_exp='["source","degraded_mode","rule","authority_top_keys","authority_top_keys_contract_736"]'
  au736_got=$(echo "$mb" | jq -c '.authority.authority_top_keys // empty')
  [[ "$au736_got" == "$au736_exp" ]] || fail "/meta JSON authority.authority_top_keys must equal AUTHORITY (736), got \"$au736_got\""
  sb736au=$(echo "$mb" | jq -r '.authority.authority_top_keys_contract_736 // empty')
  [[ "$sb736au" == *"736"* ]] || fail "/meta JSON authority_top_keys_contract_736 must mention 736 (736), got \"$sb736au\""
  [[ "$sb736au" == *"source"* ]] || fail "/meta JSON authority_top_keys_contract_736 must embed source (736), got \"$sb736au\""
  [[ "$sb736au" == *"degraded_mode"* ]] || fail "/meta JSON authority_top_keys_contract_736 must embed degraded_mode (736), got \"$sb736au\""
  pu737r=$(echo "$mb" | jq -r '.pause.rule // empty')
  [[ "$pu737r" == *"737"* ]] || fail "/meta JSON pause.rule must mention 737 (737), got \"$pu737r\""
  pu737_exp='["enabled","api_allowlist","factory_paused","distribute_paused","chain_pause_read","rule","pause_top_keys","pause_top_keys_contract_737"]'
  pu737_got=$(echo "$mb" | jq -c '.pause.pause_top_keys // empty')
  [[ "$pu737_got" == "$pu737_exp" ]] || fail "/meta JSON pause.pause_top_keys must equal PAUSE (737), got \"$pu737_got\""
  sb737pu=$(echo "$mb" | jq -r '.pause.pause_top_keys_contract_737 // empty')
  [[ "$sb737pu" == *"737"* ]] || fail "/meta JSON pause_top_keys_contract_737 must mention 737 (737), got \"$sb737pu\""
  [[ "$sb737pu" == *"enabled"* ]] || fail "/meta JSON pause_top_keys_contract_737 must embed enabled (737), got \"$sb737pu\""
  [[ "$sb737pu" == *"api_allowlist"* ]] || fail "/meta JSON pause_top_keys_contract_737 must embed api_allowlist (737), got \"$sb737pu\""
  ev738r=$(echo "$mb" | jq -r '.evidence.rule // empty')
  [[ "$ev738r" == *"738"* ]] || fail "/meta JSON evidence.rule must mention 738 (738), got \"$ev738r\""
  ev738_exp='["timestamp_policy","time_state_path","receipt_signature","rollback_detection","strict_db_write","dual_write_order","rule","evidence_top_keys","evidence_top_keys_contract_738"]'
  ev738_got=$(echo "$mb" | jq -c '.evidence.evidence_top_keys // empty')
  [[ "$ev738_got" == "$ev738_exp" ]] || fail "/meta JSON evidence.evidence_top_keys must equal EVIDENCE (738), got \"$ev738_got\""
  sb738ev=$(echo "$mb" | jq -r '.evidence.evidence_top_keys_contract_738 // empty')
  [[ "$sb738ev" == *"738"* ]] || fail "/meta JSON evidence_top_keys_contract_738 must mention 738 (738), got \"$sb738ev\""
  [[ "$sb738ev" == *"timestamp_policy"* ]] || fail "/meta JSON evidence_top_keys_contract_738 must embed timestamp_policy (738), got \"$sb738ev\""
  [[ "$sb738ev" == *"rule"* ]] || fail "/meta JSON evidence_top_keys_contract_738 must embed rule (738), got \"$sb738ev\""
  om739r=$(echo "$mb" | jq -r '.order_messages.rule // empty')
  [[ "$om739r" == *"739"* ]] || fail "/meta JSON order_messages.rule must mention 739 (739), got \"$om739r\""
  om739_exp='["chain_off_mounted","strict_db_write","dual_write_order","http_rule","rule","order_messages_top_keys","order_messages_top_keys_contract_739"]'
  om739_got=$(echo "$mb" | jq -c '.order_messages.order_messages_top_keys // empty')
  [[ "$om739_got" == "$om739_exp" ]] || fail "/meta JSON order_messages.order_messages_top_keys must equal ORDER_MESSAGES (739), got \"$om739_got\""
  sb739om=$(echo "$mb" | jq -r '.order_messages.order_messages_top_keys_contract_739 // empty')
  [[ "$sb739om" == *"739"* ]] || fail "/meta JSON order_messages_top_keys_contract_739 must mention 739 (739), got \"$sb739om\""
  [[ "$sb739om" == *"chain_off_mounted"* ]] || fail "/meta JSON order_messages_top_keys_contract_739 must embed chain_off_mounted (739), got \"$sb739om\""
  [[ "$sb739om" == *"http_rule"* ]] || fail "/meta JSON order_messages_top_keys_contract_739 must embed http_rule (739), got \"$sb739om\""
  rv740r=$(echo "$mb" | jq -r '.reviews.rule // empty')
  [[ "$rv740r" == *"740"* ]] || fail "/meta JSON reviews.rule must mention 740 (740), got \"$rv740r\""
  rv740_exp='["strict_db_write","dual_write_order","rule","reviews_top_keys","reviews_top_keys_contract_740"]'
  rv740_got=$(echo "$mb" | jq -c '.reviews.reviews_top_keys // empty')
  [[ "$rv740_got" == "$rv740_exp" ]] || fail "/meta JSON reviews.reviews_top_keys must equal REVIEWS (740), got \"$rv740_got\""
  sb740rv=$(echo "$mb" | jq -r '.reviews.reviews_top_keys_contract_740 // empty')
  [[ "$sb740rv" == *"740"* ]] || fail "/meta JSON reviews_top_keys_contract_740 must mention 740 (740), got \"$sb740rv\""
  [[ "$sb740rv" == *"strict_db_write"* ]] || fail "/meta JSON reviews_top_keys_contract_740 must embed strict_db_write (740), got \"$sb740rv\""
  [[ "$sb740rv" == *"dual_write_order"* ]] || fail "/meta JSON reviews_top_keys_contract_740 must embed dual_write_order (740), got \"$sb740rv\""
  do741r=$(echo "$mb" | jq -r '.dispute_open.rule // empty')
  [[ "$do741r" == *"741"* ]] || fail "/meta JSON dispute_open.rule must mention 741 (741), got \"$do741r\""
  do741_exp='["strict_db_write","dual_write_order","rule","dispute_open_top_keys","dispute_open_top_keys_contract_741"]'
  do741_got=$(echo "$mb" | jq -c '.dispute_open.dispute_open_top_keys // empty')
  [[ "$do741_got" == "$do741_exp" ]] || fail "/meta JSON dispute_open.dispute_open_top_keys must equal DISPUTE_OPEN (741), got \"$do741_got\""
  sb741do=$(echo "$mb" | jq -r '.dispute_open.dispute_open_top_keys_contract_741 // empty')
  [[ "$sb741do" == *"741"* ]] || fail "/meta JSON dispute_open_top_keys_contract_741 must mention 741 (741), got \"$sb741do\""
  [[ "$sb741do" == *"strict_db_write"* ]] || fail "/meta JSON dispute_open_top_keys_contract_741 must embed strict_db_write (741), got \"$sb741do\""
  [[ "$sb741do" == *"dual_write_order"* ]] || fail "/meta JSON dispute_open_top_keys_contract_741 must embed dual_write_order (741), got \"$sb741do\""
  dr742r=$(echo "$mb" | jq -r '.dispute_resolve.rule // empty')
  [[ "$dr742r" == *"742"* ]] || fail "/meta JSON dispute_resolve.rule must mention 742 (742), got \"$dr742r\""
  dr742_exp='["strict_db_write","dual_write_order","rule","dispute_resolve_top_keys","dispute_resolve_top_keys_contract_742"]'
  dr742_got=$(echo "$mb" | jq -c '.dispute_resolve.dispute_resolve_top_keys // empty')
  [[ "$dr742_got" == "$dr742_exp" ]] || fail "/meta JSON dispute_resolve.dispute_resolve_top_keys must equal DISPUTE_RESOLVE (742), got \"$dr742_got\""
  sb742dr=$(echo "$mb" | jq -r '.dispute_resolve.dispute_resolve_top_keys_contract_742 // empty')
  [[ "$sb742dr" == *"742"* ]] || fail "/meta JSON dispute_resolve_top_keys_contract_742 must mention 742 (742), got \"$sb742dr\""
  [[ "$sb742dr" == *"strict_db_write"* ]] || fail "/meta JSON dispute_resolve_top_keys_contract_742 must embed strict_db_write (742), got \"$sb742dr\""
  [[ "$sb742dr" == *"dual_write_order"* ]] || fail "/meta JSON dispute_resolve_top_keys_contract_742 must embed dual_write_order (742), got \"$sb742dr\""
  it743r=$(echo "$mb" | jq -r '.itineraries.rule // empty')
  [[ "$it743r" == *"743"* ]] || fail "/meta JSON itineraries.rule must mention 743 (743), got \"$it743r\""
  it743_exp='["strict_db_write","dual_write_order","rule","itineraries_top_keys","itineraries_top_keys_contract_743"]'
  it743_got=$(echo "$mb" | jq -c '.itineraries.itineraries_top_keys // empty')
  [[ "$it743_got" == "$it743_exp" ]] || fail "/meta JSON itineraries.itineraries_top_keys must equal ITINERARIES (743), got \"$it743_got\""
  sb743it=$(echo "$mb" | jq -r '.itineraries.itineraries_top_keys_contract_743 // empty')
  [[ "$sb743it" == *"743"* ]] || fail "/meta JSON itineraries_top_keys_contract_743 must mention 743 (743), got \"$sb743it\""
  [[ "$sb743it" == *"strict_db_write"* ]] || fail "/meta JSON itineraries_top_keys_contract_743 must embed strict_db_write (743), got \"$sb743it\""
  [[ "$sb743it" == *"dual_write_order"* ]] || fail "/meta JSON itineraries_top_keys_contract_743 must embed dual_write_order (743), got \"$sb743it\""
  ord744r=$(echo "$mb" | jq -r '.orders.rule // empty')
  [[ "$ord744r" == *"744"* ]] || fail "/meta JSON orders.rule must mention 744 (744), got \"$ord744r\""
  ord744_exp='["strict_db_write","dual_write_order","rule","list_pagination","fee_route_country_ssot","deadline_rating_observability","orders_top_keys","orders_top_keys_contract_744"]'
  ord744_got=$(jq -c '.orders.orders_top_keys' "$META_BODY_FILE")
  [[ "$ord744_got" == "$ord744_exp" ]] || fail "/meta JSON orders.orders_top_keys must equal ORDERS (744), got \"$ord744_got\""
  sb744ord=$(jq -r '.orders.orders_top_keys_contract_744' "$META_BODY_FILE")
  [[ "$sb744ord" == *"744"* ]] || fail "/meta JSON orders_top_keys_contract_744 must mention 744 (744), got \"$sb744ord\""
  [[ "$sb744ord" == *"strict_db_write"* ]] || fail "/meta JSON orders_top_keys_contract_744 must embed strict_db_write (744), got \"$sb744ord\""
  [[ "$sb744ord" == *"dual_write_order"* ]] || fail "/meta JSON orders_top_keys_contract_744 must embed dual_write_order (744), got \"$sb744ord\""
  [[ "$sb744ord" == *"list_pagination"* ]] || fail "/meta JSON orders_top_keys_contract_744 must embed list_pagination (744), got \"$sb744ord\""
  [[ "$sb744ord" == *"fee_route_country_ssot"* ]] || fail "/meta JSON orders_top_keys_contract_744 must embed fee_route_country_ssot (744), got \"$sb744ord\""
  disc745r=$(echo "$mb" | jq -r '.discover.rule // empty')
  [[ "$disc745r" == *"745"* ]] || fail "/meta JSON discover.rule must mention 745 (745), got \"$disc745r\""
  disc745_sw=$(jq -r '.discover.strict_db_write | tostring' "$META_BODY_FILE")
  [[ "$disc745_sw" == "false" ]] || fail "/meta JSON discover.strict_db_write must be false (745), got \"$disc745_sw\""
  disc745_exp='["strict_db_write","dual_write_order","rule","orders_pagination","discover_top_keys","discover_top_keys_contract_745"]'
  disc745_got=$(echo "$mb" | jq -c '.discover.discover_top_keys // empty')
  [[ "$disc745_got" == "$disc745_exp" ]] || fail "/meta JSON discover.discover_top_keys must equal DISCOVER (745), got \"$disc745_got\""
  sb745disc=$(echo "$mb" | jq -r '.discover.discover_top_keys_contract_745 // empty')
  [[ "$sb745disc" == *"745"* ]] || fail "/meta JSON discover_top_keys_contract_745 must mention 745 (745), got \"$sb745disc\""
  [[ "$sb745disc" == *"strict_db_write"* ]] || fail "/meta JSON discover_top_keys_contract_745 must embed strict_db_write (745), got \"$sb745disc\""
  [[ "$sb745disc" == *"dual_write_order"* ]] || fail "/meta JSON discover_top_keys_contract_745 must embed dual_write_order (745), got \"$sb745disc\""
  [[ "$sb745disc" == *"orders_pagination"* ]] || fail "/meta JSON discover_top_keys_contract_745 must embed orders_pagination (745), got \"$sb745disc\""
  pc746r=$(echo "$mb" | jq -r '.product_countries.rule // empty')
  [[ "$pc746r" == *"746"* ]] || fail "/meta JSON product_countries.rule must mention 746 (746), got \"$pc746r\""
  pc746_sw=$(jq -r '.product_countries.strict_db_write | tostring' "$META_BODY_FILE")
  [[ "$pc746_sw" == "false" ]] || fail "/meta JSON product_countries.strict_db_write must be false (746), got \"$pc746_sw\""
  pc746_exp='["strict_db_write","dual_write_order","rule","iso3166_alpha2","name_zh","product_countries_top_keys","product_countries_top_keys_contract_746"]'
  pc746_got=$(echo "$mb" | jq -c '.product_countries.product_countries_top_keys // empty')
  [[ "$pc746_got" == "$pc746_exp" ]] || fail "/meta JSON product_countries.product_countries_top_keys must equal PRODUCT_COUNTRIES (746), got \"$pc746_got\""
  sb746pc=$(echo "$mb" | jq -r '.product_countries.product_countries_top_keys_contract_746 // empty')
  [[ "$sb746pc" == *"746"* ]] || fail "/meta JSON product_countries_top_keys_contract_746 must mention 746 (746), got \"$sb746pc\""
  [[ "$sb746pc" == *"strict_db_write"* ]] || fail "/meta JSON product_countries_top_keys_contract_746 must embed strict_db_write (746), got \"$sb746pc\""
  [[ "$sb746pc" == *"dual_write_order"* ]] || fail "/meta JSON product_countries_top_keys_contract_746 must embed dual_write_order (746), got \"$sb746pc\""
  [[ "$sb746pc" == *"iso3166_alpha2"* ]] || fail "/meta JSON product_countries_top_keys_contract_746 must embed iso3166_alpha2 (746), got \"$sb746pc\""
  [[ "$sb746pc" == *"name_zh"* ]] || fail "/meta JSON product_countries_top_keys_contract_746 must embed name_zh (746), got \"$sb746pc\""
  dr747r=$(echo "$mb" | jq -r '.did_rank.rule // empty')
  [[ "$dr747r" == *"747"* ]] || fail "/meta JSON did_rank.rule must mention 747 (747), got \"$dr747r\""
  dr747_sw=$(jq -r '.did_rank.strict_db_write | tostring' "$META_BODY_FILE")
  [[ "$dr747_sw" == "false" ]] || fail "/meta JSON did_rank.strict_db_write must be false (747), got \"$dr747_sw\""
  dr747_exp='["strict_db_write","dual_write_order","rule","chain_off_mounted","chain_off_db_pool","guides_community_penalty_exclusion","did_rank_top_keys","did_rank_top_keys_contract_747"]'
  dr747_got=$(echo "$mb" | jq -c '.did_rank.did_rank_top_keys // empty')
  [[ "$dr747_got" == "$dr747_exp" ]] || fail "/meta JSON did_rank.did_rank_top_keys must equal DID_RANK (747), got \"$dr747_got\""
  sb747dr=$(echo "$mb" | jq -r '.did_rank.did_rank_top_keys_contract_747 // empty')
  [[ "$sb747dr" == *"747"* ]] || fail "/meta JSON did_rank_top_keys_contract_747 must mention 747 (747), got \"$sb747dr\""
  [[ "$sb747dr" == *"strict_db_write"* ]] || fail "/meta JSON did_rank_top_keys_contract_747 must embed strict_db_write (747), got \"$sb747dr\""
  [[ "$sb747dr" == *"dual_write_order"* ]] || fail "/meta JSON did_rank_top_keys_contract_747 must embed dual_write_order (747), got \"$sb747dr\""
  [[ "$sb747dr" == *"chain_off_mounted"* ]] || fail "/meta JSON did_rank_top_keys_contract_747 must embed chain_off_mounted (747), got \"$sb747dr\""
  [[ "$sb747dr" == *"chain_off_db_pool"* ]] || fail "/meta JSON did_rank_top_keys_contract_747 must embed chain_off_db_pool (747), got \"$sb747dr\""
  [[ "$sb747dr" == *"guides_community_penalty_exclusion"* ]] || fail "/meta JSON did_rank_top_keys_contract_747 must embed guides_community_penalty_exclusion (747), got \"$sb747dr\""
  m728_exp='["service","api_version","build","chain","rate_limits","database_connected","database","dual_write","strict_mode","ssot_version","ssot","admin_exports","chargeback_policy","finality_n","indexer","authority","pause","evidence","order_messages","reviews","dispute_open","dispute_resolve","itineraries","orders","discover","product_countries","did_rank","product_roles","auth","seed_test_accounts","guides","governance","idempotency_cache","defaults","outbox","meta_top_keys","meta_top_keys_contract_728"]'
  m728_got=$(echo "$mb" | jq -c '.meta_top_keys // empty')
  [[ "$m728_got" == "$m728_exp" ]] || fail "/meta JSON meta_top_keys must equal SSOT (728), got \"$m728_got\""
  sb728=$(echo "$mb" | jq -r '.meta_top_keys_contract_728 // empty')
  [[ "$sb728" == *"728"* ]] || fail "/meta JSON meta_top_keys_contract_728 must mention 728 (728), got \"$sb728\""
  [[ "$sb728" == *"service"* ]] || fail "/meta JSON meta_top_keys_contract_728 must embed service (728), got \"$sb728\""
  [[ "$sb728" == *"indexer"* ]] || fail "/meta JSON meta_top_keys_contract_728 must embed indexer (728), got \"$sb728\""
  [[ "$sb728" == *"database"* ]] || fail "/meta JSON meta_top_keys_contract_728 must embed database (760), got \"$sb728\""
  db760_exp='["connected","rule","database_top_keys","database_top_keys_contract_760"]'
  db760_got=$(echo "$mb" | jq -c '.database.database_top_keys // empty')
  [[ "$db760_got" == "$db760_exp" ]] || fail "/meta JSON .database.database_top_keys must equal SSOT (760), got \"$db760_got\""
  sb760=$(echo "$mb" | jq -r '.database.database_top_keys_contract_760 // empty')
  [[ "$sb760" == *"760"* ]] || fail "/meta JSON database_top_keys_contract_760 must mention 760 (760), got \"$sb760\""
  [[ "$sb760" == *"connected"* ]] || fail "/meta JSON database_top_keys_contract_760 must embed connected (760), got \"$sb760\""
  rl761=$(echo "$mb" | jq -r '.rate_limits.rule // empty')
  [[ "$rl761" == *"761"* ]] || fail "/meta JSON rate_limits.rule must mention 761 (761), got \"$rl761\""
  gu761_exp='["max_per_window","window_seconds","rule","guide_upload_top_keys","guide_upload_top_keys_contract_761"]'
  gu761_got=$(echo "$mb" | jq -c '.rate_limits.guide_upload.guide_upload_top_keys // empty')
  [[ "$gu761_got" == "$gu761_exp" ]] || fail "/meta JSON .rate_limits.guide_upload.guide_upload_top_keys must equal SSOT (761), got \"$gu761_got\""
  sb761gu=$(echo "$mb" | jq -r '.rate_limits.guide_upload.guide_upload_top_keys_contract_761 // empty')
  [[ "$sb761gu" == *"761"* ]] || fail "/meta JSON guide_upload_top_keys_contract_761 must mention 761 (761), got \"$sb761gu\""
  [[ "$sb761gu" == *"max_per_window"* ]] || fail "/meta JSON guide_upload_top_keys_contract_761 must embed max_per_window (761), got \"$sb761gu\""
  ok "/meta JSON .product_roles (692/748 top_keys) + .auth.registration (694/697/749 top_keys) + .auth (750 top_keys) + .seed_test_accounts (751 top_keys) + .guides (752 top_keys) + .idempotency_cache (753 top_keys) + .defaults (754 top_keys) + .outbox (755 top_keys) + .rate_limits (756 top_keys) + .rate_limits.guide_upload (761 top_keys) + .chain.rule (762/763/765/766/767/768/769/770/771/772/773/774/775/776/777/778/779/780/781/782/783/784/785/786/787/788/789/790/791/792/793/794/795/796/797/798/799/800/801/802/803/804/805/806) + .indexer.finality_discipline.order_chain_sync_status (704/705/706/707/708/709/710/711/712/713/714/715/716/717/718/719/720/721/722/723/724/725) + .indexer.finality_discipline (726) + .indexer (727) + .indexer.memory (757 top_keys) + .indexer.checkpoint (758 top_keys) + .database (760 top_keys) + .build (730) + .dual_write (732) + .strict_mode (731) + .ssot (733) + .admin_exports (734) + .chargeback_policy (735) + .authority (736) + .pause (737) + .evidence (738) + .order_messages (739) + .reviews (740) + .dispute_open (741) + .dispute_resolve (742) + .itineraries (743) + .orders (744) + .discover (745) + .product_countries (746) + .did_rank (747) + .chain (729) + .chain.contracts (759 top_keys when object) + root (728)"
  bb=$(curl -sS --connect-timeout 3 "$BASE_URL/meta/build" || true)
  exp=$(echo "$mb" | jq -c '.build')
  got=$(echo "$bb" | jq -c '.')
  [[ "$exp" == "$got" ]] || fail "/meta/build JSON must equal /meta .build (688)"
  ok "/meta/build JSON equals /meta .build"
else
  echo "55-QUICK-VERIFY: jq not in PATH; skipped /meta JSON shape check"
fi

code_metrics=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/metrics" || echo "000")
[[ "$code_metrics" == "200" ]] || fail "/metrics returned $code_metrics (expected 200)"
ok "/metrics $code_metrics"

# discover/orders、did-rank/* 无登录可访问，期望 200（无 DB 时可能 200+空列表或 503，此处仅要求非 5xx 连接失败）
[[ "$code_discover" =~ ^(200|503)$ ]] || fail "/api/v1/discover/orders returned $code_discover"
ok "/api/v1/discover/orders $code_discover"

# 55-S12：分页 query（与 04 §3.4 一致）；仅 discover 为 200 时验收（503 无链下 store 时跳过）
if [[ "$code_discover" == "200" ]]; then
  code_disc_p=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/api/v1/discover/orders?limit=1" || echo "000")
  [[ "$code_disc_p" == "200" ]] || fail "/api/v1/discover/orders?limit=1 returned $code_disc_p"
  ok "/api/v1/discover/orders?limit=1 200"
  if command -v jq >/dev/null 2>&1; then
    db=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/discover/orders?limit=1" || true)
    st=$(echo "$db" | jq -r '.status // empty')
    plim=$(echo "$db" | jq -r '.page.limit | tostring // empty')
    [[ "$st" == "ok" ]] || fail "discover paginated JSON .status expected ok, got \"$st\""
    [[ "$plim" == "1" ]] || fail "discover paginated JSON .page.limit expected 1, got \"$plim\""
    itype=$(echo "$db" | jq -r '.items | type')
    [[ "$itype" == "array" ]] || fail "discover paginated JSON .items must be array, got $itype"
    hm=$(echo "$db" | jq -r '.page.has_more | tostring // empty')
    [[ "$hm" == "true" || "$hm" == "false" ]] || fail "discover paginated JSON .page.has_more must be boolean"
    ok "discover paginated JSON shape (limit=1, page.*)"
  else
    echo "55-QUICK-VERIFY: jq not in PATH; skipped discover pagination JSON shape check"
  fi
fi

[[ "$code_didrank" =~ ^(200|503)$ ]] || fail "/api/v1/did-rank/itineraries returned $code_didrank"
ok "/api/v1/did-rank/itineraries $code_didrank"
[[ "$code_didrank_guides" =~ ^(200|503)$ ]] || fail "/api/v1/did-rank/guides returned $code_didrank_guides"
ok "/api/v1/did-rank/guides $code_didrank_guides"
[[ "$code_didrank_travelers" =~ ^(200|503)$ ]] || fail "/api/v1/did-rank/travelers returned $code_didrank_travelers"
ok "/api/v1/did-rank/travelers $code_didrank_travelers"
[[ "$code_didrank_prize_pool" =~ ^(200|503)$ ]] || fail "/api/v1/did-rank/prize-pool returned $code_didrank_prize_pool"
ok "/api/v1/did-rank/prize-pool $code_didrank_prize_pool"
[[ "$code_didrank_providers" =~ ^(200|503)$ ]] || fail "/api/v1/did-rank/providers returned $code_didrank_providers"
ok "/api/v1/did-rank/providers $code_didrank_providers"
[[ "$code_didrank_acquisitions" =~ ^(200|503)$ ]] || fail "/api/v1/did-rank/acquisitions returned $code_didrank_acquisitions"
ok "/api/v1/did-rank/acquisitions $code_didrank_acquisitions"

# 31 / 04 §3.4：社区话题帖子数（公开只读，无 DB 时亦 200 + post_count）
code_tagstats=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE_URL/api/v1/community/stats/posts-by-tag?tag=smoke" || echo "000")
[[ "$code_tagstats" == "200" ]] || fail "/api/v1/community/stats/posts-by-tag?tag=smoke returned $code_tagstats"
ok "/api/v1/community/stats/posts-by-tag?tag=smoke 200"
if command -v jq >/dev/null 2>&1; then
  ts=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/community/stats/posts-by-tag?tag=smoke" || true)
  tst=$(echo "$ts" | jq -r '.status // empty')
  [[ "$tst" == "ok" ]] || fail "community stats JSON .status expected ok, got \"$tst\""
  tpc=$(echo "$ts" | jq -r '.post_count | type')
  [[ "$tpc" == "number" ]] || fail "community stats JSON .post_count must be number, got $tpc"
  ok "community stats JSON shape (tag=smoke)"
fi

# did-rank 响应形状（period/since/limit）：仅 200 且本机有 jq 时校验（itineraries + guides + travelers **rank_basis** 与 30 §3 / 04 附录 §2）
if [[ "$code_didrank" == "200" ]]; then
  body=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/did-rank/itineraries?period=week" || true)
  if command -v jq >/dev/null 2>&1; then
    st=$(echo "$body" | jq -r '.status // empty')
    lim=$(echo "$body" | jq -r '.limit | tostring // empty')
    per=$(echo "$body" | jq -r '.period // empty')
    [[ "$st" == "ok" ]] || fail "did-rank itineraries JSON .status expected ok, got \"$st\""
    [[ "$lim" == "100" ]] || fail "did-rank itineraries JSON .limit expected 100, got \"$lim\""
    [[ "$per" == "week" ]] || fail "did-rank itineraries JSON .period expected week, got \"$per\""
    since_type=$(echo "$body" | jq -r '.since | type')
    [[ "$since_type" == "string" ]] || fail "did-rank itineraries JSON .since for period=week must be string, got $since_type"
    [[ $(echo "$body" | jq -r '.since | length') -gt 10 ]] || fail "did-rank itineraries JSON .since looks empty"
    rb=$(echo "$body" | jq -r '.rank_basis // empty')
    [[ -n "$rb" ]] || fail "did-rank itineraries JSON .rank_basis expected non-empty"
    [[ "$rb" =~ ^(order_completed_at|itinerary_created_at_fallback|itinerary_created_at_proxy)$ ]] || fail "did-rank itineraries JSON .rank_basis unexpected: \"$rb\" (expected order_completed_at|itinerary_created_at_fallback|itinerary_created_at_proxy)"
    itype=$(echo "$body" | jq -r '.itineraries | type')
    [[ "$itype" == "array" ]] || fail "did-rank itineraries JSON .itineraries must be array, got $itype"
    ok "did-rank itineraries JSON shape (period=week, since/limit/rank_basis, itineraries[])"
  else
    echo "55-QUICK-VERIFY: jq not in PATH; skipped did-rank JSON shape check"
  fi
fi
if [[ "$code_didrank_guides" == "200" ]]; then
  gbody=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/did-rank/guides?period=week" || true)
  if command -v jq >/dev/null 2>&1; then
    gst=$(echo "$gbody" | jq -r '.status // empty')
    glim=$(echo "$gbody" | jq -r '.limit | tostring // empty')
    gper=$(echo "$gbody" | jq -r '.period // empty')
    [[ "$gst" == "ok" ]] || fail "did-rank guides JSON .status expected ok, got \"$gst\""
    [[ "$glim" == "100" ]] || fail "did-rank guides JSON .limit expected 100, got \"$glim\""
    [[ "$gper" == "week" ]] || fail "did-rank guides JSON .period expected week, got \"$gper\""
    grb=$(echo "$gbody" | jq -r '.rank_basis // empty')
    [[ "$grb" == "guide_reception_gross_total_then_completed_count" ]] || fail "did-rank guides JSON .rank_basis expected guide_reception_gross_total_then_completed_count, got \"$grb\""
    gtype=$(echo "$gbody" | jq -r '.guides | type')
    [[ "$gtype" == "array" ]] || fail "did-rank guides JSON .guides must be array, got $gtype"
    ok "did-rank guides JSON shape (period=week, rank_basis, guides[])"
    gbody_rev=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/did-rank/guides?period=week&sort=reviews" || true)
    grb_rev=$(echo "$gbody_rev" | jq -r '.rank_basis // empty')
    [[ "$grb_rev" == "guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_3" ]] || fail "did-rank guides ?sort=reviews .rank_basis expected guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_3, got \"$grb_rev\""
    ok "did-rank guides JSON shape (period=week, sort=reviews, rank_basis)"
    gbody_w=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/did-rank/guides?period=week&sort=weighted" || true)
    grb_w=$(echo "$gbody_w" | jq -r '.rank_basis // empty')
    [[ "$grb_w" == "guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_3" ]] || fail "did-rank guides ?sort=weighted .rank_basis expected guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_3, got \"$grb_w\""
    ok "did-rank guides JSON shape (period=week, sort=weighted, rank_basis)"
  fi
fi
if [[ "$code_didrank_travelers" == "200" ]]; then
  tbody=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/did-rank/travelers?period=week" || true)
  if command -v jq >/dev/null 2>&1; then
    tst=$(echo "$tbody" | jq -r '.status // empty')
    tlim=$(echo "$tbody" | jq -r '.limit | tostring // empty')
    tper=$(echo "$tbody" | jq -r '.period // empty')
    [[ "$tst" == "ok" ]] || fail "did-rank travelers JSON .status expected ok, got \"$tst\""
    [[ "$tlim" == "100" ]] || fail "did-rank travelers JSON .limit expected 100, got \"$tlim\""
    [[ "$tper" == "week" ]] || fail "did-rank travelers JSON .period expected week, got \"$tper\""
    trb=$(echo "$tbody" | jq -r '.rank_basis // empty')
    [[ "$trb" == "tourist_completed_orders_in_window" ]] || fail "did-rank travelers JSON .rank_basis expected tourist_completed_orders_in_window, got \"$trb\""
    ttype=$(echo "$tbody" | jq -r '.travelers | type')
    [[ "$ttype" == "array" ]] || fail "did-rank travelers JSON .travelers must be array, got $ttype"
    ok "did-rank travelers JSON shape (period=week, rank_basis, travelers[])"
  fi
fi
if [[ "$code_didrank_prize_pool" == "200" ]] && command -v jq >/dev/null 2>&1; then
  poolbody=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/did-rank/prize-pool" || true)
  psrc=$(echo "$poolbody" | jq -r '.source // empty')
  [[ "$psrc" =~ ^(env|governance_pool_db|default)$ ]] || fail "did-rank prize-pool JSON .source expected env|governance_pool_db|default, got \"$psrc\""
  ptype=$(echo "$poolbody" | jq -r '.monthly_amount | type')
  [[ "$ptype" == "number" ]] || fail "did-rank prize-pool JSON .monthly_amount must be number, got $ptype"
  pill=$(echo "$poolbody" | jq -r '.illustrative | type')
  [[ "$pill" == "boolean" ]] || fail "did-rank prize-pool JSON .illustrative must be boolean, got $pill"
  ok "did-rank prize-pool JSON (.source, .monthly_amount, .illustrative)"
fi
if [[ "$code_didrank_providers" == "200" ]] && command -v jq >/dev/null 2>&1; then
  provbody=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/did-rank/providers?period=week" || true)
  prb=$(echo "$provbody" | jq -r '.rank_basis // empty')
  [[ "$prb" == "provider_fulfillment_orders_then_gross_then_published_listings_in_window" ]] || fail "did-rank providers .rank_basis expected provider_fulfillment_orders_then_gross_then_published_listings_in_window, got \"$prb\""
  porf=$(echo "$provbody" | jq -r '.owner_role_filter // empty')
  [[ "$porf" == "provider" ]] || fail "did-rank providers .owner_role_filter expected provider, got \"$porf\""
  ptype=$(echo "$provbody" | jq -r '.providers | type')
  [[ "$ptype" == "array" ]] || fail "did-rank providers JSON .providers must be array, got $ptype"
  ok "did-rank providers JSON shape (period=week, rank_basis, providers[])"
  provbody2=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/did-rank/providers?period=week" || true)
  plen=$(echo "$provbody2" | jq -r '.providers | length')
  if [[ "$plen" =~ ^[1-9][0-9]*$ ]]; then
    pdelta_ok=$(echo "$provbody2" | jq -r 'if (.providers | length) > 0 then (.providers | all(.rank_delta == null or (.rank_delta | type) == "number")) else true end')
    [[ "$pdelta_ok" == "true" ]] || fail "did-rank providers 2nd fetch .rank_delta must be number or absent"
    ok "did-rank providers 2nd fetch rank_delta field shape"
  fi
fi
if [[ "$code_didrank_acquisitions" == "200" ]] && command -v jq >/dev/null 2>&1; then
  acqbody=$(curl -sS --connect-timeout 3 "$BASE_URL/api/v1/did-rank/acquisitions?period=week" || true)
  arb=$(echo "$acqbody" | jq -r '.rank_basis // empty')
  [[ "$arb" == "acquisition_fulfillment_orders_then_gross_then_published_listings_in_window" ]] || fail "did-rank acquisitions .rank_basis expected acquisition_fulfillment_orders_then_gross_then_published_listings_in_window, got \"$arb\""
  aorf=$(echo "$acqbody" | jq -r '.owner_role_filter // empty')
  [[ "$aorf" == "region_steward" ]] || fail "did-rank acquisitions .owner_role_filter expected region_steward, got \"$aorf\""
  atype=$(echo "$acqbody" | jq -r '.acquisitions | type')
  [[ "$atype" == "array" ]] || fail "did-rank acquisitions JSON .acquisitions must be array, got $atype"
  ok "did-rank acquisitions JSON shape (period=week, rank_basis, acquisitions[])"
fi

echo ""
echo "55 阶段运行时快速验收通过（BASE_URL=$BASE_URL）。"
