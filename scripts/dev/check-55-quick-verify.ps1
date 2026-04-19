# 55 阶段运行时快速验收（Windows PowerShell 版）：请求关键 API，确认服务与 55 能力可用（§九附续.6）。
# 用法：API 已启动时在项目根执行 .\scripts\check-55-quick-verify.ps1
# 环境变量：$env:BASE_URL 优先；否则 $env:PORT（默认 8080）→ http://localhost:$PORT

$ErrorActionPreference = "Stop"
$port = if ($env:PORT) { $env:PORT } else { "8080" }
$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:$port" }
function fail { param($msg) Write-Error "55-QUICK-VERIFY FAIL: $msg"; exit 1 }
function ok { param($msg) Write-Host "55-QUICK-VERIFY OK: $msg" }

try {
    $r1 = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing -TimeoutSec 3
} catch { $r1 = $null }
if (-not $r1 -or $r1.StatusCode -ne 200) { fail "/health returned $($r1.StatusCode)" }
ok "/health 200"

try {
    $rm = Invoke-WebRequest -Uri "$BaseUrl/meta" -UseBasicParsing -TimeoutSec 3
} catch { $rm = $null }
if (-not $rm -or $rm.StatusCode -ne 200) { fail "/meta returned $(if ($rm) { $rm.StatusCode } else { 'no response' })" }
ok "/meta 200"
try {
    $rmb = Invoke-WebRequest -Uri "$BaseUrl/meta/build" -UseBasicParsing -TimeoutSec 3
} catch { $rmb = $null }
if (-not $rmb -or $rmb.StatusCode -ne 200) {
    fail "/meta/build returned $(if ($rmb) { $rmb.StatusCode } else { 'no response' })"
}
ok "/meta/build 200"
try {
    $jm = $rm.Content | ConvertFrom-Json
} catch {
    fail "/meta JSON parse failed: $_"
}
if ($jm.service -ne "traveltrust-api") { fail "/meta JSON .service expected traveltrust-api, got $($jm.service)" }
ok "/meta JSON .service"
if (-not $jm.dual_write) { fail "/meta JSON .dual_write missing" }
$fp = $jm.dual_write.failure_policy
if ($fp -notin @("log_only", "strict_503", "alert_only")) { fail "/meta JSON .dual_write.failure_policy invalid: $fp" }
if ($jm.dual_write.strict_db_write_any -isnot [bool]) { fail "/meta JSON .dual_write.strict_db_write_any must be boolean" }
ok "/meta JSON .dual_write (failure_policy, strict_db_write_any)"
if ($null -eq $jm.indexer) { fail "/meta JSON .indexer missing" }
$icp = $jm.indexer.checkpoint
if ($null -eq $icp) { fail "/meta JSON .indexer.checkpoint missing" }
if ($icp.source -notin @("runtime", "startup_snapshot")) {
    fail "/meta JSON .indexer.checkpoint.source invalid: $($icp.source)"
}
function Test-MetaJsonNumber([object]$v) {
    return ($v -is [int]) -or ($v -is [long]) -or ($v -is [double]) -or ($v -is [decimal])
}
if (-not (Test-MetaJsonNumber $icp.block_number)) { fail "/meta JSON .indexer.checkpoint.block_number must be numeric" }
if (-not (Test-MetaJsonNumber $icp.log_index)) { fail "/meta JSON .indexer.checkpoint.log_index must be numeric" }
ok "/meta JSON .indexer.checkpoint (source, block_number, log_index)"
if ($null -eq $jm.did_rank) { fail "/meta JSON .did_rank missing" }
$dr = $jm.did_rank
if ($dr.chain_off_mounted -isnot [bool]) { fail "/meta JSON .did_rank.chain_off_mounted must be boolean" }
if ($dr.chain_off_db_pool -isnot [bool]) { fail "/meta JSON .did_rank.chain_off_db_pool must be boolean" }
$ex = [string]$dr.guides_community_penalty_exclusion
if ($ex -notin @("db_backed", "chain_off_memory_only", "no_chain_off")) {
    fail "/meta JSON .did_rank.guides_community_penalty_exclusion invalid: $ex"
}
if ($dr.chain_off_db_pool -eq $true) {
    if ($ex -ne "db_backed") { fail "/meta .did_rank inconsistent: chain_off_db_pool true but guides_community_penalty_exclusion=$ex" }
} elseif ($dr.chain_off_mounted -eq $true) {
    if ($ex -ne "chain_off_memory_only") { fail "/meta .did_rank inconsistent: mounted without db_pool but guides_community_penalty_exclusion=$ex" }
} else {
    if ($ex -ne "no_chain_off") { fail "/meta .did_rank inconsistent: expected no_chain_off, got $ex" }
}
if ([string]::IsNullOrWhiteSpace([string]$dr.rule)) { fail "/meta JSON .did_rank.rule must be non-empty" }
ok "/meta JSON .did_rank (686/687 shape + penalty_exclusion vs flags)"
if ($null -eq $jm.product_roles) { fail "/meta JSON .product_roles missing (690)" }
$pr = $jm.product_roles
$urs = $pr.users_role_stored
$ursExp = @("admin", "arbitrator", "guide", "provider", "region_steward", "super_admin", "tourist", "traveler")
if ($null -eq $urs -or @($urs).Count -ne 8) { fail "/meta JSON .product_roles.users_role_stored must be length 8 (692/697/748)" }
for ($i = 0; $i -lt 8; $i++) {
    if ([string]$urs[$i] -ne $ursExp[$i]) { fail "/meta JSON .product_roles.users_role_stored[$i] expected $($ursExp[$i]) (748), got $($urs[$i])" }
}
if ($pr.provider_in_users_role -isnot [bool]) { fail "/meta JSON .product_roles.provider_in_users_role must be boolean" }
if ($pr.region_steward_in_users_role -isnot [bool]) { fail "/meta JSON .product_roles.region_steward_in_users_role must be boolean" }
if ($pr.provider_in_users_role -ne $true) { fail "/meta JSON .product_roles.provider_in_users_role expected true (692)" }
if ($pr.region_steward_in_users_role -ne $true) { fail "/meta JSON .product_roles.region_steward_in_users_role expected true (692)" }
$mapT = [string]$pr.me_public_role_mapping.tourist
if ($mapT -ne "traveler") { fail "/meta JSON .product_roles.me_public_role_mapping.tourist expected traveler, got $mapT" }
if ([string]::IsNullOrWhiteSpace([string]$pr.rule)) { fail "/meta JSON .product_roles.rule must be non-empty (690)" }
$pr748r = [string]$pr.rule
if ($pr748r -notlike '*748*') { fail "/meta JSON product_roles.rule must mention 748 (748)" }
if ($pr.strict_db_write -ne $false) { fail "/meta JSON product_roles.strict_db_write must be false (748)" }
$pr748Exp = @("strict_db_write", "dual_write_order", "rule", "users_role_stored", "me_public_role_mapping", "protocol_roles_target_87", "provider_in_users_role", "region_steward_in_users_role", "product_roles_top_keys", "product_roles_top_keys_contract_748")
$pr748 = $pr.product_roles_top_keys
if ($null -eq $pr748 -or @($pr748).Count -ne 10) { fail "/meta JSON product_roles.product_roles_top_keys must be length 10 (748)" }
for ($i = 0; $i -lt 10; $i++) {
    if ([string]$pr748[$i] -ne $pr748Exp[$i]) { fail "/meta JSON product_roles.product_roles_top_keys[$i] expected $($pr748Exp[$i]) (748), got $($pr748[$i])" }
}
$sb748pr = [string]$pr.product_roles_top_keys_contract_748
if ($sb748pr -notlike '*748*') { fail "/meta JSON product_roles_top_keys_contract_748 must mention 748 (748)" }
if ($sb748pr -notlike '*strict_db_write*') { fail "/meta JSON product_roles_top_keys_contract_748 must embed strict_db_write (748)" }
if ($sb748pr -notlike '*dual_write_order*') { fail "/meta JSON product_roles_top_keys_contract_748 must embed dual_write_order (748)" }
if ($sb748pr -notlike '*users_role_stored*') { fail "/meta JSON product_roles_top_keys_contract_748 must embed users_role_stored (748)" }
if ($null -eq $jm.auth.registration) { fail "/meta JSON .auth.registration missing (694)" }
$reg = $jm.auth.registration
$arr = $reg.self_serve_roles_allowed
if ($null -eq $arr -or $arr.Count -ne 4) { fail "/meta JSON .auth.registration.self_serve_roles_allowed must be length 4 (697)" }
$exp = @("provider", "region_steward", "tourist", "traveler")
for ($i = 0; $i -lt 4; $i++) {
    if ([string]$arr[$i] -ne $exp[$i]) { fail "/meta JSON .auth.registration.self_serve_roles_allowed[$i] expected $($exp[$i]) (697)" }
}
if ($null -eq $reg.request_role_aliases) { fail "/meta JSON .auth.registration.request_role_aliases missing (697)" }
$aliasProps = @($reg.request_role_aliases.PSObject.Properties)
if ($aliasProps.Count -ne 0) { fail "/meta JSON .auth.registration.request_role_aliases must be empty object (697)" }
$ar749r = [string]$reg.rule
if ($ar749r -notlike '*749*') { fail "/meta JSON auth.registration.rule must mention 749 (749)" }
if ($reg.strict_db_write -ne $false) { fail "/meta JSON auth.registration.strict_db_write must be false (749)" }
$ar749Exp = @("strict_db_write", "dual_write_order", "rule", "self_serve_roles_allowed", "request_role_aliases", "default_role", "invalid_role_error_key", "arbitrator_seed_env", "guide_via_separate_flow_only", "auth_registration_top_keys", "auth_registration_top_keys_contract_749")
$ar749 = $reg.auth_registration_top_keys
if ($null -eq $ar749 -or @($ar749).Count -ne 11) { fail "/meta JSON auth.registration.auth_registration_top_keys must be length 11 (749)" }
for ($i = 0; $i -lt 11; $i++) {
    if ([string]$ar749[$i] -ne $ar749Exp[$i]) { fail "/meta JSON auth.registration.auth_registration_top_keys[$i] expected $($ar749Exp[$i]) (749), got $($ar749[$i])" }
}
$sb749ar = [string]$reg.auth_registration_top_keys_contract_749
if ($sb749ar -notlike '*749*') { fail "/meta JSON auth_registration_top_keys_contract_749 must mention 749 (749)" }
if ($sb749ar -notlike '*strict_db_write*') { fail "/meta JSON auth_registration_top_keys_contract_749 must embed strict_db_write (749)" }
if ($sb749ar -notlike '*self_serve_roles_allowed*') { fail "/meta JSON auth_registration_top_keys_contract_749 must embed self_serve_roles_allowed (749)" }
$au750r = [string]$jm.auth.rule
if ($au750r -notlike '*750*') { fail "/meta JSON auth.rule must mention 750 (750)" }
if ($jm.auth.strict_db_write -isnot [bool]) { fail "/meta JSON auth.strict_db_write must be boolean (750)" }
$au750Exp = @("strict_db_write", "registration", "rule", "auth_top_keys", "auth_top_keys_contract_750")
$au750 = $jm.auth.auth_top_keys
if ($null -eq $au750 -or @($au750).Count -ne 5) { fail "/meta JSON auth.auth_top_keys must be length 5 (750)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$au750[$i] -ne $au750Exp[$i]) { fail "/meta JSON auth.auth_top_keys[$i] expected $($au750Exp[$i]) (750), got $($au750[$i])" }
}
$sb750au = [string]$jm.auth.auth_top_keys_contract_750
if ($sb750au -notlike '*750*') { fail "/meta JSON auth_top_keys_contract_750 must mention 750 (750)" }
if ($sb750au -notlike '*strict_db_write*') { fail "/meta JSON auth_top_keys_contract_750 must embed strict_db_write (750)" }
if ($sb750au -notlike '*registration*') { fail "/meta JSON auth_top_keys_contract_750 must embed registration (750)" }
$sta751r = [string]$jm.seed_test_accounts.rule
if ($sta751r -notlike '*751*') { fail "/meta JSON seed_test_accounts.rule must mention 751 (751)" }
if ($jm.seed_test_accounts.strict_db_write -isnot [bool]) { fail "/meta JSON seed_test_accounts.strict_db_write must be boolean (751)" }
$sta751Exp = @("strict_db_write", "rule", "seed_test_accounts_top_keys", "seed_test_accounts_top_keys_contract_751")
$sta751 = $jm.seed_test_accounts.seed_test_accounts_top_keys
if ($null -eq $sta751 -or @($sta751).Count -ne 4) { fail "/meta JSON seed_test_accounts.seed_test_accounts_top_keys must be length 4 (751)" }
for ($i = 0; $i -lt 4; $i++) {
    if ([string]$sta751[$i] -ne $sta751Exp[$i]) { fail "/meta JSON seed_test_accounts.seed_test_accounts_top_keys[$i] expected $($sta751Exp[$i]) (751), got $($sta751[$i])" }
}
$sb751sta = [string]$jm.seed_test_accounts.seed_test_accounts_top_keys_contract_751
if ($sb751sta -notlike '*751*') { fail "/meta JSON seed_test_accounts_top_keys_contract_751 must mention 751 (751)" }
if ($sb751sta -notlike '*strict_db_write*') { fail "/meta JSON seed_test_accounts_top_keys_contract_751 must embed strict_db_write (751)" }
if ($sb751sta -notlike '*rule*') { fail "/meta JSON seed_test_accounts_top_keys_contract_751 must embed rule (751)" }
$gu752r = [string]$jm.guides.rule
if ($gu752r -notlike '*752*') { fail "/meta JSON guides.rule must mention 752 (752)" }
if ($jm.guides.strict_db_write -isnot [bool]) { fail "/meta JSON guides.strict_db_write must be boolean (752)" }
$gu752Exp = @("strict_db_write", "rule", "guides_top_keys", "guides_top_keys_contract_752")
$gu752 = $jm.guides.guides_top_keys
if ($null -eq $gu752 -or @($gu752).Count -ne 4) { fail "/meta JSON guides.guides_top_keys must be length 4 (752)" }
for ($i = 0; $i -lt 4; $i++) {
    if ([string]$gu752[$i] -ne $gu752Exp[$i]) { fail "/meta JSON guides.guides_top_keys[$i] expected $($gu752Exp[$i]) (752), got $($gu752[$i])" }
}
$sb752gu = [string]$jm.guides.guides_top_keys_contract_752
if ($sb752gu -notlike '*752*') { fail "/meta JSON guides_top_keys_contract_752 must mention 752 (752)" }
if ($sb752gu -notlike '*strict_db_write*') { fail "/meta JSON guides_top_keys_contract_752 must embed strict_db_write (752)" }
if ($sb752gu -notlike '*rule*') { fail "/meta JSON guides_top_keys_contract_752 must embed rule (752)" }
$ic753r = [string]$jm.idempotency_cache.rule
if ($ic753r -notlike '*753*') { fail "/meta JSON idempotency_cache.rule must mention 753 (753)" }
$icMm = $jm.idempotency_cache.memory_max_entries
if ($null -eq $icMm) { fail "/meta JSON idempotency_cache.memory_max_entries missing (753)" }
if ($icMm -is [string]) { fail "/meta JSON idempotency_cache.memory_max_entries must be number (753)" }
if ($jm.idempotency_cache.db_projection -isnot [string]) { fail "/meta JSON idempotency_cache.db_projection must be string (753)" }
$ic753Exp = @("memory_max_entries", "db_projection", "rule", "idempotency_cache_top_keys", "idempotency_cache_top_keys_contract_753")
$ic753 = $jm.idempotency_cache.idempotency_cache_top_keys
if ($null -eq $ic753 -or @($ic753).Count -ne 5) { fail "/meta JSON idempotency_cache.idempotency_cache_top_keys must be length 5 (753)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$ic753[$i] -ne $ic753Exp[$i]) { fail "/meta JSON idempotency_cache.idempotency_cache_top_keys[$i] expected $($ic753Exp[$i]) (753), got $($ic753[$i])" }
}
$sb753ic = [string]$jm.idempotency_cache.idempotency_cache_top_keys_contract_753
if ($sb753ic -notlike '*753*') { fail "/meta JSON idempotency_cache_top_keys_contract_753 must mention 753 (753)" }
if ($sb753ic -notlike '*memory_max_entries*') { fail "/meta JSON idempotency_cache_top_keys_contract_753 must embed memory_max_entries (753)" }
if ($sb753ic -notlike '*db_projection*') { fail "/meta JSON idempotency_cache_top_keys_contract_753 must embed db_projection (753)" }
if ($sb753ic -notlike '*rule*') { fail "/meta JSON idempotency_cache_top_keys_contract_753 must embed rule (753)" }
$df754r = [string]$jm.defaults.rule
if ($df754r -notlike '*754*') { fail "/meta JSON defaults.rule must mention 754 (754)" }
$dfTo = $jm.defaults.request_timeout_secs
if ($null -eq $dfTo) { fail "/meta JSON defaults.request_timeout_secs missing (754)" }
if ($dfTo -is [string]) { fail "/meta JSON defaults.request_timeout_secs must be number (754)" }
$dfBl = $jm.defaults.request_body_limit_bytes
if ($null -eq $dfBl) { fail "/meta JSON defaults.request_body_limit_bytes missing (754)" }
if ($dfBl -is [string]) { fail "/meta JSON defaults.request_body_limit_bytes must be number (754)" }
$dfIc = $jm.defaults.idempotency_cache_max
if ($null -eq $dfIc) { fail "/meta JSON defaults.idempotency_cache_max missing (754)" }
if ($dfIc -is [string]) { fail "/meta JSON defaults.idempotency_cache_max must be number (754)" }
$df754Exp = @("request_timeout_secs", "request_body_limit_bytes", "idempotency_cache_max", "rule", "defaults_top_keys", "defaults_top_keys_contract_754")
$df754 = $jm.defaults.defaults_top_keys
if ($null -eq $df754 -or @($df754).Count -ne 6) { fail "/meta JSON defaults.defaults_top_keys must be length 6 (754)" }
for ($i = 0; $i -lt 6; $i++) {
    if ([string]$df754[$i] -ne $df754Exp[$i]) { fail "/meta JSON defaults.defaults_top_keys[$i] expected $($df754Exp[$i]) (754), got $($df754[$i])" }
}
$sb754df = [string]$jm.defaults.defaults_top_keys_contract_754
if ($sb754df -notlike '*754*') { fail "/meta JSON defaults_top_keys_contract_754 must mention 754 (754)" }
if ($sb754df -notlike '*request_timeout_secs*') { fail "/meta JSON defaults_top_keys_contract_754 must embed request_timeout_secs (754)" }
if ($sb754df -notlike '*request_body_limit_bytes*') { fail "/meta JSON defaults_top_keys_contract_754 must embed request_body_limit_bytes (754)" }
if ($sb754df -notlike '*idempotency_cache_max*') { fail "/meta JSON defaults_top_keys_contract_754 must embed idempotency_cache_max (754)" }
if ($sb754df -notlike '*rule*') { fail "/meta JSON defaults_top_keys_contract_754 must embed rule (754)" }
$ob755r = [string]$jm.outbox.rule
if ($ob755r -notlike '*755*') { fail "/meta JSON outbox.rule must mention 755 (755)" }
if ($jm.outbox.dir -isnot [string]) { fail "/meta JSON outbox.dir must be string (755)" }
if ($jm.outbox.worker_enabled -isnot [bool]) { fail "/meta JSON outbox.worker_enabled must be boolean (755)" }
$obLs = $jm.outbox.lease_secs
if ($null -eq $obLs) { fail "/meta JSON outbox.lease_secs missing (755)" }
if ($obLs -is [string]) { fail "/meta JSON outbox.lease_secs must be number (755)" }
$obPm = $jm.outbox.poll_ms
if ($null -eq $obPm) { fail "/meta JSON outbox.poll_ms missing (755)" }
if ($obPm -is [string]) { fail "/meta JSON outbox.poll_ms must be number (755)" }
$obMa = $jm.outbox.max_attempts
if ($null -eq $obMa) { fail "/meta JSON outbox.max_attempts missing (755)" }
if ($obMa -is [string]) { fail "/meta JSON outbox.max_attempts must be number (755)" }
$ob755Exp = @("dir", "worker_enabled", "lease_secs", "poll_ms", "max_attempts", "rule", "outbox_top_keys", "outbox_top_keys_contract_755")
$ob755 = $jm.outbox.outbox_top_keys
if ($null -eq $ob755 -or @($ob755).Count -ne 8) { fail "/meta JSON outbox.outbox_top_keys must be length 8 (755)" }
for ($i = 0; $i -lt 8; $i++) {
    if ([string]$ob755[$i] -ne $ob755Exp[$i]) { fail "/meta JSON outbox.outbox_top_keys[$i] expected $($ob755Exp[$i]) (755), got $($ob755[$i])" }
}
$sb755ob = [string]$jm.outbox.outbox_top_keys_contract_755
if ($sb755ob -notlike '*755*') { fail "/meta JSON outbox_top_keys_contract_755 must mention 755 (755)" }
if ($sb755ob -notlike '*dir*') { fail "/meta JSON outbox_top_keys_contract_755 must embed dir (755)" }
if ($sb755ob -notlike '*worker_enabled*') { fail "/meta JSON outbox_top_keys_contract_755 must embed worker_enabled (755)" }
if ($sb755ob -notlike '*lease_secs*') { fail "/meta JSON outbox_top_keys_contract_755 must embed lease_secs (755)" }
if ($sb755ob -notlike '*poll_ms*') { fail "/meta JSON outbox_top_keys_contract_755 must embed poll_ms (755)" }
if ($sb755ob -notlike '*max_attempts*') { fail "/meta JSON outbox_top_keys_contract_755 must embed max_attempts (755)" }
if ($sb755ob -notlike '*rule*') { fail "/meta JSON outbox_top_keys_contract_755 must embed rule (755)" }
$rl756r = [string]$jm.rate_limits.rule
if ($rl756r -notlike '*756*') { fail "/meta JSON rate_limits.rule must mention 756 (756)" }
$rlWs = $jm.rate_limits.window_seconds
if ($null -eq $rlWs) { fail "/meta JSON rate_limits.window_seconds missing (756)" }
if ($rlWs -is [string]) { fail "/meta JSON rate_limits.window_seconds must be number (756)" }
if ($jm.rate_limits.api_limit_disabled -isnot [bool]) { fail "/meta JSON rate_limits.api_limit_disabled must be boolean (756)" }
if ($null -eq $jm.rate_limits.guide_upload) { fail "/meta JSON rate_limits.guide_upload missing (756)" }
$rl756Exp = @("window_seconds", "api_requests_per_minute_per_client", "api_limit_disabled", "critical_writes_per_minute_per_client", "critical_limit_disabled", "evidence_posts_per_minute_per_order_user", "evidence_limit_disabled", "review_submits_per_minute_per_order_reviewer", "review_limit_disabled", "review_low_score_min_comment_chars", "review_low_score_rule_disabled", "guide_upload", "rule", "rate_limits_top_keys", "rate_limits_top_keys_contract_756")
$rl756 = $jm.rate_limits.rate_limits_top_keys
if ($null -eq $rl756 -or @($rl756).Count -ne 15) { fail "/meta JSON rate_limits.rate_limits_top_keys must be length 15 (756)" }
for ($i = 0; $i -lt 15; $i++) {
    if ([string]$rl756[$i] -ne $rl756Exp[$i]) { fail "/meta JSON rate_limits.rate_limits_top_keys[$i] expected $($rl756Exp[$i]) (756), got $($rl756[$i])" }
}
$sb756rl = [string]$jm.rate_limits.rate_limits_top_keys_contract_756
if ($sb756rl -notlike '*756*') { fail "/meta JSON rate_limits_top_keys_contract_756 must mention 756 (756)" }
if ($sb756rl -notlike '*window_seconds*') { fail "/meta JSON rate_limits_top_keys_contract_756 must embed window_seconds (756)" }
if ($sb756rl -notlike '*guide_upload*') { fail "/meta JSON rate_limits_top_keys_contract_756 must embed guide_upload (756)" }
if ($sb756rl -notlike '*rate_limits_top_keys*') { fail "/meta JSON rate_limits_top_keys_contract_756 must embed rate_limits_top_keys (756)" }
$im757r = [string]$jm.indexer.memory.rule
if ($im757r -notlike '*757*') { fail "/meta JSON indexer.memory.rule must mention 757 (757)" }
if ($jm.indexer.memory.available -isnot [bool]) { fail "/meta JSON indexer.memory.available must be boolean (757)" }
$im757Exp = @("available", "last_block", "last_log_index", "last_block_hash_prefix", "events_cached", "rule", "indexer_memory_top_keys", "indexer_memory_top_keys_contract_757")
$im757 = $jm.indexer.memory.indexer_memory_top_keys
if ($null -eq $im757 -or @($im757).Count -ne 8) { fail "/meta JSON indexer.memory.indexer_memory_top_keys must be length 8 (757)" }
for ($i = 0; $i -lt 8; $i++) {
    if ([string]$im757[$i] -ne $im757Exp[$i]) { fail "/meta JSON indexer.memory.indexer_memory_top_keys[$i] expected $($im757Exp[$i]) (757), got $($im757[$i])" }
}
$sb757im = [string]$jm.indexer.memory.indexer_memory_top_keys_contract_757
if ($sb757im -notlike '*757*') { fail "/meta JSON indexer_memory_top_keys_contract_757 must mention 757 (757)" }
if ($sb757im -notlike '*available*') { fail "/meta JSON indexer_memory_top_keys_contract_757 must embed available (757)" }
if ($sb757im -notlike '*events_cached*') { fail "/meta JSON indexer_memory_top_keys_contract_757 must embed events_cached (757)" }
$idx757r = [string]$jm.indexer.rule
if ($idx757r -notlike '*757*') { fail "/meta JSON indexer.rule must mention 757 (757)" }
if ($idx757r -notlike '*758*') { fail "/meta JSON indexer.rule must mention 758 (758)" }
$cp758r = [string]$jm.indexer.checkpoint.rule
if ($cp758r -notlike '*758*') { fail "/meta JSON indexer.checkpoint.rule must mention 758 (758)" }
$cp758Exp = @("block_number", "log_index", "source", "rule", "indexer_checkpoint_top_keys", "indexer_checkpoint_top_keys_contract_758")
$cp758 = $jm.indexer.checkpoint.indexer_checkpoint_top_keys
if ($null -eq $cp758 -or @($cp758).Count -ne 6) { fail "/meta JSON indexer.checkpoint.indexer_checkpoint_top_keys must be length 6 (758)" }
for ($i = 0; $i -lt 6; $i++) {
    if ([string]$cp758[$i] -ne $cp758Exp[$i]) { fail "/meta JSON indexer.checkpoint.indexer_checkpoint_top_keys[$i] expected $($cp758Exp[$i]) (758), got $($cp758[$i])" }
}
$sb758cp = [string]$jm.indexer.checkpoint.indexer_checkpoint_top_keys_contract_758
if ($sb758cp -notlike '*758*') { fail "/meta JSON indexer_checkpoint_top_keys_contract_758 must mention 758 (758)" }
if ($sb758cp -notlike '*block_number*') { fail "/meta JSON indexer_checkpoint_top_keys_contract_758 must embed block_number (758)" }
if ($sb758cp -notlike '*source*') { fail "/meta JSON indexer_checkpoint_top_keys_contract_758 must embed source (758)" }
if ($null -eq $jm.indexer.finality_discipline) { fail "/meta JSON .indexer.finality_discipline missing (704)" }
$fd704 = $jm.indexer.finality_discipline
if ($null -eq $fd704.order_chain_sync_status) { fail "/meta JSON .indexer.finality_discipline.order_chain_sync_status missing (704)" }
$ocs704 = $fd704.order_chain_sync_status
$ar704 = [string]$ocs704.optional_event_log_snapshot_absent_reason
if ($ar704 -notlike '*703*') { fail "/meta JSON order_chain_sync_status.optional_event_log_snapshot_absent_reason must mention 703 (704)" }
$elog702 = [string]$ocs704.optional_event_log_snapshot
if ($elog702 -notlike '*702*') { fail "/meta JSON order_chain_sync_status.optional_event_log_snapshot must mention 702 (705)" }
if ($elog702 -notlike '*722*') { fail "/meta JSON order_chain_sync_status.optional_event_log_snapshot must mention 722 (722)" }
$ole706 = [string]$ocs704.optional_last_event
if ($ole706 -notlike '*706*') { fail "/meta JSON order_chain_sync_status.optional_last_event must mention 706 (706)" }
$oid707 = [string]$ocs704.success_body_order_id
if ($oid707 -notlike '*707*') { fail "/meta JSON order_chain_sync_status.success_body_order_id must mention 707 (707)" }
$req708 = [string]$ocs704.minimal_body_requester
if ($req708 -notlike '*708*') { fail "/meta JSON order_chain_sync_status.minimal_body_requester must mention 708 (708)" }
$mbs709 = [string]$ocs704.minimal_body_chain_sync_status_unknown
if ($mbs709 -notlike '*709*') { fail "/meta JSON order_chain_sync_status.minimal_body_chain_sync_status_unknown must mention 709 (709)" }
$cp710 = [string]$ocs704.chain_sync_checkpoint
if ($cp710 -notlike '*710*') { fail "/meta JSON order_chain_sync_status.chain_sync_checkpoint must mention 710 (710)" }
if ($cp710 -notlike '*723*') { fail "/meta JSON order_chain_sync_status.chain_sync_checkpoint must mention 723 (723)" }
if ($cp710 -notlike '*block_number*') { fail "/meta JSON chain_sync_checkpoint must embed block_number (723)" }
if ($cp710 -notlike '*log_index*') { fail "/meta JSON chain_sync_checkpoint must embed log_index (723)" }
if ($cp710 -notlike '*source*') { fail "/meta JSON chain_sync_checkpoint must embed source (723)" }
$fn711 = [string]$ocs704.chain_sync_finality_n
if ($fn711 -notlike '*711*') { fail "/meta JSON order_chain_sync_status.chain_sync_finality_n must mention 711 (711)" }
$se713 = [string]$ocs704.chain_sync_status_enum
if ($se713 -notlike '*713*') { fail "/meta JSON order_chain_sync_status.chain_sync_status_enum must mention 713 (713)" }
$mn714 = [string]$ocs704.minimal_body_note_stable
if ($mn714 -notlike '*714*') { fail "/meta JSON order_chain_sync_status.minimal_body_note_stable must mention 714 (714)" }
if ($mn714 -notlike '*minimal runtime snapshot when order projection backend is unavailable*') { fail "/meta JSON minimal_body_note_stable must embed stable note sentence (714)" }
$sb715 = [string]$ocs704.success_body_envelope_status
if ($sb715 -notlike '*715*') { fail "/meta JSON order_chain_sync_status.success_body_envelope_status must mention 715 (715)" }
if ($sb715 -notlike '*ok*') { fail "/meta JSON success_body_envelope_status must embed envelope literal ok (715)" }
$sb716 = [string]$ocs704.chain_sync_required_top_keys
if ($sb716 -notlike '*716*') { fail "/meta JSON order_chain_sync_status.chain_sync_required_top_keys must mention 716 (716)" }
if ($sb716 -notlike '*status*') { fail "/meta JSON chain_sync_required_top_keys must mention status (716)" }
if ($sb716 -notlike '*finality_n*') { fail "/meta JSON chain_sync_required_top_keys must mention finality_n (716)" }
if ($sb716 -notlike '*checkpoint*') { fail "/meta JSON chain_sync_required_top_keys must mention checkpoint (716)" }
if ($sb716 -notlike '*last_event*') { fail "/meta JSON chain_sync_required_top_keys must mention last_event (716)" }
$mp717Expect = 'GET /api/v1/orders/:id/chain-sync-status'
$mp717Got = [string]$ocs704.method_path
if ($mp717Got -ne $mp717Expect) { fail "/meta JSON order_chain_sync_status.method_path must equal SSOT (717), got '$mp717Got'" }
$sb717 = [string]$ocs704.method_path_contract_717
if ($sb717 -notlike '*717*') { fail "/meta JSON method_path_contract_717 must mention 717 (717)" }
if ($sb717 -notlike "*$mp717Expect*") { fail "/meta JSON method_path_contract_717 must embed method_path (717)" }
if ($sb717 -notlike '*/api/v1/orders/:id/chain-sync-status*') { fail "/meta JSON method_path_contract_717 must embed route path (717)" }
$c718Expect = 'crates/api/src/routes/orders/mod.rs get_order_chain_sync_status'
$c718Got = [string]$ocs704.code
if ($c718Got -ne $c718Expect) { fail "/meta JSON order_chain_sync_status.code must equal SSOT (718), got '$c718Got'" }
$sb718 = [string]$ocs704.code_contract_718
if ($sb718 -notlike '*718*') { fail "/meta JSON code_contract_718 must mention 718 (718)" }
if ($sb718 -notlike '*crates/api/src/routes/orders/mod.rs*') { fail "/meta JSON code_contract_718 must embed mod path (718)" }
if ($sb718 -notlike '*get_order_chain_sync_status*') { fail "/meta JSON code_contract_718 must embed handler symbol (718)" }
$sv719 = $ocs704.status_values
if ($null -eq $sv719 -or @($sv719).Count -ne 3) { fail "/meta JSON order_chain_sync_status.status_values must be length 3 (719)" }
$sv719Exp = @("pending", "confirmed", "unknown")
for ($i = 0; $i -lt 3; $i++) {
    if ([string]$sv719[$i] -ne $sv719Exp[$i]) { fail "/meta JSON status_values[$i] expected $($sv719Exp[$i]) (719), got $($sv719[$i])" }
}
$sb719 = [string]$ocs704.status_values_contract_719
if ($sb719 -notlike '*719*') { fail "/meta JSON status_values_contract_719 must mention 719 (719)" }
if ($sb719 -notlike '*pending*') { fail "/meta JSON status_values_contract_719 must embed pending (719)" }
if ($sb719 -notlike '*confirmed*') { fail "/meta JSON status_values_contract_719 must embed confirmed (719)" }
if ($sb719 -notlike '*unknown*') { fail "/meta JSON status_values_contract_719 must embed unknown (719)" }
$ar720 = $ocs704.absent_reason_values
if ($null -eq $ar720 -or @($ar720).Count -ne 5) { fail "/meta JSON order_chain_sync_status.absent_reason_values must be length 5 (720)" }
$ar720Exp = @("no_database", "no_chain_context", "no_row", "read_failed", "projection_backend_unavailable")
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$ar720[$i] -ne $ar720Exp[$i]) { fail "/meta JSON absent_reason_values[$i] expected $($ar720Exp[$i]) (720), got $($ar720[$i])" }
}
$sb720 = [string]$ocs704.absent_reason_values_contract_720
if ($sb720 -notlike '*720*') { fail "/meta JSON absent_reason_values_contract_720 must mention 720 (720)" }
if ($sb720 -notlike '*no_database*') { fail "/meta JSON absent_reason_values_contract_720 must embed no_database (720)" }
if ($sb720 -notlike '*no_chain_context*') { fail "/meta JSON absent_reason_values_contract_720 must embed no_chain_context (720)" }
if ($sb720 -notlike '*no_row*') { fail "/meta JSON absent_reason_values_contract_720 must embed no_row (720)" }
if ($sb720 -notlike '*read_failed*') { fail "/meta JSON absent_reason_values_contract_720 must embed read_failed (720)" }
if ($sb720 -notlike '*projection_backend_unavailable*') { fail "/meta JSON absent_reason_values_contract_720 must embed projection_backend_unavailable (720)" }
$le721 = $ocs704.last_event_top_keys
if ($null -eq $le721 -or @($le721).Count -ne 3) { fail "/meta JSON order_chain_sync_status.last_event_top_keys must be length 3 (721)" }
$le721Exp = @("state", "updated_at", "escrow_address")
for ($i = 0; $i -lt 3; $i++) {
    if ([string]$le721[$i] -ne $le721Exp[$i]) { fail "/meta JSON last_event_top_keys[$i] expected $($le721Exp[$i]) (721), got $($le721[$i])" }
}
$sb721 = [string]$ocs704.last_event_keys_contract_721
if ($sb721 -notlike '*721*') { fail "/meta JSON last_event_keys_contract_721 must mention 721 (721)" }
if ($sb721 -notlike '*state*') { fail "/meta JSON last_event_keys_contract_721 must embed state (721)" }
if ($sb721 -notlike '*updated_at*') { fail "/meta JSON last_event_keys_contract_721 must embed updated_at (721)" }
if ($sb721 -notlike '*escrow_address*') { fail "/meta JSON last_event_keys_contract_721 must embed escrow_address (721)" }
$el722 = $ocs704.event_log_snapshot_top_keys
if ($null -eq $el722 -or @($el722).Count -ne 6) { fail "/meta JSON order_chain_sync_status.event_log_snapshot_top_keys must be length 6 (722)" }
$el722Exp = @("finality_n_used", "block_number", "log_index", "event_type", "tx_hash", "block_hash")
for ($i = 0; $i -lt 6; $i++) {
    if ([string]$el722[$i] -ne $el722Exp[$i]) { fail "/meta JSON event_log_snapshot_top_keys[$i] expected $($el722Exp[$i]) (722), got $($el722[$i])" }
}
$sb722 = [string]$ocs704.event_log_snapshot_keys_contract_722
if ($sb722 -notlike '*722*') { fail "/meta JSON event_log_snapshot_keys_contract_722 must mention 722 (722)" }
if ($sb722 -notlike '*finality_n_used*') { fail "/meta JSON event_log_snapshot_keys_contract_722 must embed finality_n_used (722)" }
if ($sb722 -notlike '*block_number*') { fail "/meta JSON event_log_snapshot_keys_contract_722 must embed block_number (722)" }
if ($sb722 -notlike '*log_index*') { fail "/meta JSON event_log_snapshot_keys_contract_722 must embed log_index (722)" }
if ($sb722 -notlike '*event_type*') { fail "/meta JSON event_log_snapshot_keys_contract_722 must embed event_type (722)" }
if ($sb722 -notlike '*tx_hash*') { fail "/meta JSON event_log_snapshot_keys_contract_722 must embed tx_hash (722)" }
if ($sb722 -notlike '*block_hash*') { fail "/meta JSON event_log_snapshot_keys_contract_722 must embed block_hash (722)" }
$cp723 = $ocs704.checkpoint_top_keys
if ($null -eq $cp723 -or @($cp723).Count -ne 3) { fail "/meta JSON order_chain_sync_status.checkpoint_top_keys must be length 3 (723)" }
$cp723Exp = @("block_number", "log_index", "source")
for ($i = 0; $i -lt 3; $i++) {
    if ([string]$cp723[$i] -ne $cp723Exp[$i]) { fail "/meta JSON checkpoint_top_keys[$i] expected $($cp723Exp[$i]) (723), got $($cp723[$i])" }
}
$sb723 = [string]$ocs704.checkpoint_keys_contract_723
if ($sb723 -notlike '*723*') { fail "/meta JSON checkpoint_keys_contract_723 must mention 723 (723)" }
if ($sb723 -notlike '*block_number*') { fail "/meta JSON checkpoint_keys_contract_723 must embed block_number (723)" }
if ($sb723 -notlike '*log_index*') { fail "/meta JSON checkpoint_keys_contract_723 must embed log_index (723)" }
if ($sb723 -notlike '*source*') { fail "/meta JSON checkpoint_keys_contract_723 must embed source (723)" }
$cs724 = $ocs704.checkpoint_source_values
if ($null -eq $cs724 -or @($cs724).Count -ne 2) { fail "/meta JSON order_chain_sync_status.checkpoint_source_values must be length 2 (724)" }
$cs724Exp = @("runtime", "startup_snapshot")
for ($i = 0; $i -lt 2; $i++) {
    if ([string]$cs724[$i] -ne $cs724Exp[$i]) { fail "/meta JSON checkpoint_source_values[$i] expected $($cs724Exp[$i]) (724), got $($cs724[$i])" }
}
$sb724 = [string]$ocs704.checkpoint_source_values_contract_724
if ($sb724 -notlike '*724*') { fail "/meta JSON checkpoint_source_values_contract_724 must mention 724 (724)" }
if ($sb724 -notlike '*runtime*') { fail "/meta JSON checkpoint_source_values_contract_724 must embed runtime (724)" }
if ($sb724 -notlike '*startup_snapshot*') { fail "/meta JSON checkpoint_source_values_contract_724 must embed startup_snapshot (724)" }
$cs712 = [string]$ocs704.chain_sync_checkpoint_source
if ($cs712 -notlike '*712*') { fail "/meta JSON chain_sync_checkpoint_source must mention 712 (712)" }
if ($cs712 -notlike '*724*') { fail "/meta JSON chain_sync_checkpoint_source must mention 724 (724)" }
if ($cs712 -notlike '*runtime*') { fail "/meta JSON chain_sync_checkpoint_source must embed runtime (724)" }
if ($cs712 -notlike '*startup_snapshot*') { fail "/meta JSON chain_sync_checkpoint_source must embed startup_snapshot (724)" }
$ocs725 = $ocs704.order_chain_sync_status_top_keys
$ocs725Exp = @(
    "method_path", "method_path_contract_717", "status_values", "status_values_contract_719",
    "absent_reason_values", "absent_reason_values_contract_720", "code", "code_contract_718",
    "event_log_snapshot_top_keys", "event_log_snapshot_keys_contract_722", "optional_event_log_snapshot",
    "optional_event_log_snapshot_absent_reason", "last_event_top_keys", "last_event_keys_contract_721",
    "checkpoint_top_keys", "checkpoint_keys_contract_723", "checkpoint_source_values", "checkpoint_source_values_contract_724",
    "optional_last_event", "success_body_order_id", "success_body_envelope_status", "chain_sync_required_top_keys",
    "minimal_body_requester", "minimal_body_chain_sync_status_unknown", "chain_sync_checkpoint", "chain_sync_finality_n",
    "chain_sync_checkpoint_source", "chain_sync_status_enum", "minimal_body_note_stable",
    "order_chain_sync_status_top_keys", "order_chain_sync_status_top_keys_contract_725", "rule"
)
if ($null -eq $ocs725 -or @($ocs725).Count -ne 32) { fail "/meta JSON order_chain_sync_status.order_chain_sync_status_top_keys must be length 32 (725)" }
for ($i = 0; $i -lt 32; $i++) {
    if ([string]$ocs725[$i] -ne $ocs725Exp[$i]) { fail "/meta JSON order_chain_sync_status_top_keys[$i] expected $($ocs725Exp[$i]) (725), got $($ocs725[$i])" }
}
$sb725 = [string]$ocs704.order_chain_sync_status_top_keys_contract_725
if ($sb725 -notlike '*725*') { fail "/meta JSON order_chain_sync_status_top_keys_contract_725 must mention 725 (725)" }
if ($sb725 -notlike '*method_path*') { fail "/meta JSON order_chain_sync_status_top_keys_contract_725 must embed method_path (725)" }
if ($sb725 -notlike '*rule*') { fail "/meta JSON order_chain_sync_status_top_keys_contract_725 must embed rule (725)" }
$fd726 = $fd704.finality_discipline_top_keys
$fd726Exp = @(
    "tick_logs_upper_bound", "postgres_event_log_has_finality_n_used", "order_chain_sync_status",
    "chain_tip_not_in_meta", "chain_tip_hint", "finality_discipline_top_keys", "finality_discipline_top_keys_contract_726"
)
if ($null -eq $fd726 -or @($fd726).Count -ne 7) { fail "/meta JSON finality_discipline.finality_discipline_top_keys must be length 7 (726)" }
for ($i = 0; $i -lt 7; $i++) {
    if ([string]$fd726[$i] -ne $fd726Exp[$i]) { fail "/meta JSON finality_discipline_top_keys[$i] expected $($fd726Exp[$i]) (726), got $($fd726[$i])" }
}
$sb726 = [string]$fd704.finality_discipline_top_keys_contract_726
if ($sb726 -notlike '*726*') { fail "/meta JSON finality_discipline_top_keys_contract_726 must mention 726 (726)" }
if ($sb726 -notlike '*tick_logs_upper_bound*') { fail "/meta JSON finality_discipline_top_keys_contract_726 must embed tick_logs_upper_bound (726)" }
if ($sb726 -notlike '*order_chain_sync_status*') { fail "/meta JSON finality_discipline_top_keys_contract_726 must embed order_chain_sync_status (726)" }
$idxrule726 = [string]$jm.indexer.rule
if ($idxrule726 -notlike '*726*') { fail "/meta JSON indexer.rule must mention 726 (726)" }
if ($idxrule726 -notlike '*727*') { fail "/meta JSON indexer.rule must mention 727 (727)" }
$ix727 = $jm.indexer.indexer_top_keys
$ix727Exp = @(
    "state_path", "checkpoint", "last_seen_finality_n", "replay_required", "lag_blocks", "lag_max_blocks",
    "reorg_detected", "finality_n", "memory", "finality_discipline", "rule", "indexer_top_keys", "indexer_top_keys_contract_727"
)
if ($null -eq $ix727 -or @($ix727).Count -ne 13) { fail "/meta JSON indexer.indexer_top_keys must be length 13 (727)" }
for ($i = 0; $i -lt 13; $i++) {
    if ([string]$ix727[$i] -ne $ix727Exp[$i]) { fail "/meta JSON indexer_top_keys[$i] expected $($ix727Exp[$i]) (727), got $($ix727[$i])" }
}
$sb727 = [string]$jm.indexer.indexer_top_keys_contract_727
if ($sb727 -notlike '*727*') { fail "/meta JSON indexer_top_keys_contract_727 must mention 727 (727)" }
if ($sb727 -notlike '*state_path*') { fail "/meta JSON indexer_top_keys_contract_727 must embed state_path (727)" }
if ($sb727 -notlike '*finality_discipline*') { fail "/meta JSON indexer_top_keys_contract_727 must embed finality_discipline (727)" }
$chr728 = [string]$jm.chain.rule
if ($chr728 -notlike '*728*') { fail "/meta JSON chain.rule must mention 728 (728)" }
if ($chr728 -notlike '*729*') { fail "/meta JSON chain.rule must mention 729 (729)" }
if ($chr728 -notlike '*759*') { fail "/meta JSON chain.rule must mention 759 (759)" }
if ($chr728 -notlike '*760*') { fail "/meta JSON chain.rule must mention 760 (760)" }
if ($chr728 -notlike '*762*') { fail "/meta JSON chain.rule must mention 762 (762)" }
if ($chr728 -notlike '*763*') { fail "/meta JSON chain.rule must mention 763 (763)" }
if ($chr728 -notlike '*765*') { fail "/meta JSON chain.rule must mention 765 (765)" }
if ($chr728 -notlike '*766*') { fail "/meta JSON chain.rule must mention 766 (766)" }
if ($chr728 -notlike '*767*') { fail "/meta JSON chain.rule must mention 767 (767)" }
if ($chr728 -notlike '*768*') { fail "/meta JSON chain.rule must mention 768 (768)" }
if ($chr728 -notlike '*769*') { fail "/meta JSON chain.rule must mention 769 (769)" }
if ($chr728 -notlike '*770*') { fail "/meta JSON chain.rule must mention 770 (770)" }
if ($chr728 -notlike '*771*') { fail "/meta JSON chain.rule must mention 771 (771)" }
if ($chr728 -notlike '*772*') { fail "/meta JSON chain.rule must mention 772 (772)" }
if ($chr728 -notlike '*773*') { fail "/meta JSON chain.rule must mention 773 (773)" }
if ($chr728 -notlike '*774*') { fail "/meta JSON chain.rule must mention 774 (774)" }
if ($chr728 -notlike '*775*') { fail "/meta JSON chain.rule must mention 775 (775)" }
if ($chr728 -notlike '*776*') { fail "/meta JSON chain.rule must mention 776 (776)" }
if ($chr728 -notlike '*777*') { fail "/meta JSON chain.rule must mention 777 (777)" }
if ($chr728 -notlike '*778*') { fail "/meta JSON chain.rule must mention 778 (778)" }
if ($chr728 -notlike '*779*') { fail "/meta JSON chain.rule must mention 779 (779)" }
if ($chr728 -notlike '*780*') { fail "/meta JSON chain.rule must mention 780 (780)" }
if ($chr728 -notlike '*781*') { fail "/meta JSON chain.rule must mention 781 (781)" }
if ($chr728 -notlike '*782*') { fail "/meta JSON chain.rule must mention 782 (782)" }
if ($chr728 -notlike '*783*') { fail "/meta JSON chain.rule must mention 783 (783)" }
if ($chr728 -notlike '*784*') { fail "/meta JSON chain.rule must mention 784 (784)" }
if ($chr728 -notlike '*785*') { fail "/meta JSON chain.rule must mention 785 (785)" }
if ($chr728 -notlike '*786*') { fail "/meta JSON chain.rule must mention 786 (786)" }
if ($chr728 -notlike '*787*') { fail "/meta JSON chain.rule must mention 787 (787)" }
if ($chr728 -notlike '*788*') { fail "/meta JSON chain.rule must mention 788 (788)" }
if ($chr728 -notlike '*789*') { fail "/meta JSON chain.rule must mention 789 (789)" }
if ($chr728 -notlike '*790*') { fail "/meta JSON chain.rule must mention 790 (790)" }
if ($chr728 -notlike '*791*') { fail "/meta JSON chain.rule must mention 791 (791)" }
if ($chr728 -notlike '*792*') { fail "/meta JSON chain.rule must mention 792 (792)" }
if ($chr728 -notlike '*793*') { fail "/meta JSON chain.rule must mention 793 (793)" }
if ($chr728 -notlike '*794*') { fail "/meta JSON chain.rule must mention 794 (794)" }
if ($chr728 -notlike '*795*') { fail "/meta JSON chain.rule must mention 795 (795)" }
if ($chr728 -notlike '*796*') { fail "/meta JSON chain.rule must mention 796 (796)" }
if ($chr728 -notlike '*797*') { fail "/meta JSON chain.rule must mention 797 (797)" }
if ($chr728 -notlike '*798*') { fail "/meta JSON chain.rule must mention 798 (798)" }
if ($chr728 -notlike '*799*') { fail "/meta JSON chain.rule must mention 799 (799)" }
if ($chr728 -notlike '*800*') { fail "/meta JSON chain.rule must mention 800 (800)" }
if ($chr728 -notlike '*801*') { fail "/meta JSON chain.rule must mention 801 (801)" }
if ($chr728 -notlike '*802*') { fail "/meta JSON chain.rule must mention 802 (802)" }
if ($chr728 -notlike '*803*') { fail "/meta JSON chain.rule must mention 803 (803)" }
if ($chr728 -notlike '*804*') { fail "/meta JSON chain.rule must mention 804 (804)" }
if ($chr728 -notlike '*805*') { fail "/meta JSON chain.rule must mention 805 (805)" }
if ($chr728 -notlike '*806*') { fail "/meta JSON chain.rule must mention 806 (806)" }
$c729 = $jm.chain.chain_top_keys
$c729Exp = @("chain_id", "contracts", "rule", "chain_top_keys", "chain_top_keys_contract_729")
if ($null -eq $c729 -or @($c729).Count -ne 5) { fail "/meta JSON chain.chain_top_keys must be length 5 (729)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$c729[$i] -ne $c729Exp[$i]) { fail "/meta JSON chain.chain_top_keys[$i] expected $($c729Exp[$i]) (729), got $($c729[$i])" }
}
$sb729 = [string]$jm.chain.chain_top_keys_contract_729
if ($sb729 -notlike '*729*') { fail "/meta JSON chain_top_keys_contract_729 must mention 729 (729)" }
if ($sb729 -notlike '*chain_id*') { fail "/meta JSON chain_top_keys_contract_729 must embed chain_id (729)" }
if ($sb729 -notlike '*contracts*') { fail "/meta JSON chain_top_keys_contract_729 must embed contracts (729)" }
if ($null -ne $jm.chain.contracts -and $jm.chain.contracts -is [System.Management.Automation.PSCustomObject]) {
    $cc759r = [string]$jm.chain.contracts.rule
    if ($cc759r -notlike '*759*') { fail "/meta JSON chain.contracts.rule must mention 759 (759)" }
    $c759Exp = @("guide_staking_address", "staking_provider_address", "governor_address", "timelock_address", "governance_token_address", "fee_router_address", "treasury_address", "rule", "chain_contracts_top_keys", "chain_contracts_top_keys_contract_759")
    $c759 = $jm.chain.contracts.chain_contracts_top_keys
    if ($null -eq $c759 -or @($c759).Count -ne 10) { fail "/meta JSON chain.contracts.chain_contracts_top_keys must be length 10 (759)" }
    for ($i = 0; $i -lt 10; $i++) {
        if ([string]$c759[$i] -ne $c759Exp[$i]) { fail "/meta JSON chain.contracts.chain_contracts_top_keys[$i] expected $($c759Exp[$i]) (759), got $($c759[$i])" }
    }
    $sb759cc = [string]$jm.chain.contracts.chain_contracts_top_keys_contract_759
    if ($sb759cc -notlike '*759*') { fail "/meta JSON chain_contracts_top_keys_contract_759 must mention 759 (759)" }
    if ($sb759cc -notlike '*escrow_factory_address*') { fail "/meta JSON chain_contracts_top_keys_contract_759 must embed escrow_factory_address (759)" }
    if ($sb759cc -notlike '*chain_id_configured*') { fail "/meta JSON chain_contracts_top_keys_contract_759 must embed chain_id_configured (759)" }
}
$br730 = [string]$jm.build.rule
if ($br730 -notlike '*730*') { fail "/meta JSON build.rule must mention 730 (730)" }
$b730 = $jm.build.build_top_keys
$b730Exp = @("git_sha", "deployed_at", "rule", "build_top_keys", "build_top_keys_contract_730")
if ($null -eq $b730 -or @($b730).Count -ne 5) { fail "/meta JSON build.build_top_keys must be length 5 (730)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$b730[$i] -ne $b730Exp[$i]) { fail "/meta JSON build.build_top_keys[$i] expected $($b730Exp[$i]) (730), got $($b730[$i])" }
}
$sb730 = [string]$jm.build.build_top_keys_contract_730
if ($sb730 -notlike '*730*') { fail "/meta JSON build_top_keys_contract_730 must mention 730 (730)" }
if ($sb730 -notlike '*git_sha*') { fail "/meta JSON build_top_keys_contract_730 must embed git_sha (730)" }
if ($sb730 -notlike '*deployed_at*') { fail "/meta JSON build_top_keys_contract_730 must embed deployed_at (730)" }
$dw732r = [string]$jm.dual_write.rule
if ($dw732r -notlike '*732*') { fail "/meta JSON dual_write.rule must mention 732 (732)" }
$dw732 = $jm.dual_write.dual_write_top_keys
$dw732Exp = @("failure_policy", "strict_db_write_any", "rule", "dual_write_top_keys", "dual_write_top_keys_contract_732")
if ($null -eq $dw732 -or @($dw732).Count -ne 5) { fail "/meta JSON dual_write.dual_write_top_keys must be length 5 (732)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$dw732[$i] -ne $dw732Exp[$i]) { fail "/meta JSON dual_write.dual_write_top_keys[$i] expected $($dw732Exp[$i]) (732), got $($dw732[$i])" }
}
$sb732dw = [string]$jm.dual_write.dual_write_top_keys_contract_732
if ($sb732dw -notlike '*732*') { fail "/meta JSON dual_write_top_keys_contract_732 must mention 732 (732)" }
if ($sb732dw -notlike '*failure_policy*') { fail "/meta JSON dual_write_top_keys_contract_732 must embed failure_policy (732)" }
if ($sb732dw -notlike '*strict_db_write_any*') { fail "/meta JSON dual_write_top_keys_contract_732 must embed strict_db_write_any (732)" }
$sm731r = [string]$jm.strict_mode.rule
if ($sm731r -notlike '*731*') { fail "/meta JSON strict_mode.rule must mention 731 (731)" }
$sm731 = $jm.strict_mode.strict_mode_top_keys
$sm731Exp = @("strict_ssot", "require_idempotency_key", "strict_session_gate", "internal_api_secret_configured", "rule", "strict_mode_top_keys", "strict_mode_top_keys_contract_731")
if ($null -eq $sm731 -or @($sm731).Count -ne 7) { fail "/meta JSON strict_mode.strict_mode_top_keys must be length 7 (731)" }
for ($i = 0; $i -lt 7; $i++) {
    if ([string]$sm731[$i] -ne $sm731Exp[$i]) { fail "/meta JSON strict_mode.strict_mode_top_keys[$i] expected $($sm731Exp[$i]) (731), got $($sm731[$i])" }
}
$sb731 = [string]$jm.strict_mode.strict_mode_top_keys_contract_731
if ($sb731 -notlike '*731*') { fail "/meta JSON strict_mode_top_keys_contract_731 must mention 731 (731)" }
if ($sb731 -notlike '*strict_ssot*') { fail "/meta JSON strict_mode_top_keys_contract_731 must embed strict_ssot (731)" }
if ($sb731 -notlike '*internal_api_secret_configured*') { fail "/meta JSON strict_mode_top_keys_contract_731 must embed internal_api_secret_configured (731)" }
$ss733r = [string]$jm.ssot.rule
if ($ss733r -notlike '*733*') { fail "/meta JSON ssot.rule must mention 733 (733)" }
$ss733 = $jm.ssot.ssot_top_keys
$ss733Exp = @("expected_sha256", "computed_sha256", "match", "file", "rule", "ssot_top_keys", "ssot_top_keys_contract_733")
if ($null -eq $ss733 -or @($ss733).Count -ne 7) { fail "/meta JSON ssot.ssot_top_keys must be length 7 (733)" }
for ($i = 0; $i -lt 7; $i++) {
    if ([string]$ss733[$i] -ne $ss733Exp[$i]) { fail "/meta JSON ssot.ssot_top_keys[$i] expected $($ss733Exp[$i]) (733), got $($ss733[$i])" }
}
$sb733ss = [string]$jm.ssot.ssot_top_keys_contract_733
if ($sb733ss -notlike '*733*') { fail "/meta JSON ssot_top_keys_contract_733 must mention 733 (733)" }
if ($sb733ss -notlike '*expected_sha256*') { fail "/meta JSON ssot_top_keys_contract_733 must embed expected_sha256 (733)" }
if ($sb733ss -notlike '*computed_sha256*') { fail "/meta JSON ssot_top_keys_contract_733 must embed computed_sha256 (733)" }
$ae734r = [string]$jm.admin_exports.rule
if ($ae734r -notlike '*734*') { fail "/meta JSON admin_exports.rule must mention 734 (734)" }
$ae734 = $jm.admin_exports.admin_exports_top_keys
$ae734Exp = @("reconcile_ed25519_public_key_hex", "reconcile_ed25519_response_header", "rule", "admin_exports_top_keys", "admin_exports_top_keys_contract_734")
if ($null -eq $ae734 -or @($ae734).Count -ne 5) { fail "/meta JSON admin_exports.admin_exports_top_keys must be length 5 (734)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$ae734[$i] -ne $ae734Exp[$i]) { fail "/meta JSON admin_exports.admin_exports_top_keys[$i] expected $($ae734Exp[$i]) (734), got $($ae734[$i])" }
}
$sb734ae = [string]$jm.admin_exports.admin_exports_top_keys_contract_734
if ($sb734ae -notlike '*734*') { fail "/meta JSON admin_exports_top_keys_contract_734 must mention 734 (734)" }
if ($sb734ae -notlike '*reconcile_ed25519_public_key_hex*') { fail "/meta JSON admin_exports_top_keys_contract_734 must embed reconcile_ed25519_public_key_hex (734)" }
if ($sb734ae -notlike '*reconcile_ed25519_response_header*') { fail "/meta JSON admin_exports_top_keys_contract_734 must embed reconcile_ed25519_response_header (734)" }
$cb735r = [string]$jm.chargeback_policy.rule
if ($cb735r -notlike '*735*') { fail "/meta JSON chargeback_policy.rule must mention 735 (735)" }
$cb735 = $jm.chargeback_policy.chargeback_policy_top_keys
$cb735Exp = @("value", "rule", "chargeback_policy_top_keys", "chargeback_policy_top_keys_contract_735")
if ($null -eq $cb735 -or @($cb735).Count -ne 4) { fail "/meta JSON chargeback_policy.chargeback_policy_top_keys must be length 4 (735)" }
for ($i = 0; $i -lt 4; $i++) {
    if ([string]$cb735[$i] -ne $cb735Exp[$i]) { fail "/meta JSON chargeback_policy.chargeback_policy_top_keys[$i] expected $($cb735Exp[$i]) (735), got $($cb735[$i])" }
}
$sb735cb = [string]$jm.chargeback_policy.chargeback_policy_top_keys_contract_735
if ($sb735cb -notlike '*735*') { fail "/meta JSON chargeback_policy_top_keys_contract_735 must mention 735 (735)" }
if ($sb735cb -notlike '*value*') { fail "/meta JSON chargeback_policy_top_keys_contract_735 must embed value (735)" }
if ($sb735cb -notlike '*rule*') { fail "/meta JSON chargeback_policy_top_keys_contract_735 must embed rule (735)" }
$au736r = [string]$jm.authority.rule
if ($au736r -notlike '*736*') { fail "/meta JSON authority.rule must mention 736 (736)" }
$au736 = $jm.authority.authority_top_keys
$au736Exp = @("source", "degraded_mode", "rule", "authority_top_keys", "authority_top_keys_contract_736")
if ($null -eq $au736 -or @($au736).Count -ne 5) { fail "/meta JSON authority.authority_top_keys must be length 5 (736)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$au736[$i] -ne $au736Exp[$i]) { fail "/meta JSON authority.authority_top_keys[$i] expected $($au736Exp[$i]) (736), got $($au736[$i])" }
}
$sb736au = [string]$jm.authority.authority_top_keys_contract_736
if ($sb736au -notlike '*736*') { fail "/meta JSON authority_top_keys_contract_736 must mention 736 (736)" }
if ($sb736au -notlike '*source*') { fail "/meta JSON authority_top_keys_contract_736 must embed source (736)" }
if ($sb736au -notlike '*degraded_mode*') { fail "/meta JSON authority_top_keys_contract_736 must embed degraded_mode (736)" }
$pu737r = [string]$jm.pause.rule
if ($pu737r -notlike '*737*') { fail "/meta JSON pause.rule must mention 737 (737)" }
$pu737 = $jm.pause.pause_top_keys
$pu737Exp = @("enabled", "api_allowlist", "rule", "pause_top_keys", "pause_top_keys_contract_737")
if ($null -eq $pu737 -or @($pu737).Count -ne 5) { fail "/meta JSON pause.pause_top_keys must be length 5 (737)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$pu737[$i] -ne $pu737Exp[$i]) { fail "/meta JSON pause.pause_top_keys[$i] expected $($pu737Exp[$i]) (737), got $($pu737[$i])" }
}
$sb737pu = [string]$jm.pause.pause_top_keys_contract_737
if ($sb737pu -notlike '*737*') { fail "/meta JSON pause_top_keys_contract_737 must mention 737 (737)" }
if ($sb737pu -notlike '*enabled*') { fail "/meta JSON pause_top_keys_contract_737 must embed enabled (737)" }
if ($sb737pu -notlike '*api_allowlist*') { fail "/meta JSON pause_top_keys_contract_737 must embed api_allowlist (737)" }
$ev738r = [string]$jm.evidence.rule
if ($ev738r -notlike '*738*') { fail "/meta JSON evidence.rule must mention 738 (738)" }
$ev738 = $jm.evidence.evidence_top_keys
$ev738Exp = @("timestamp_policy", "time_state_path", "receipt_signature", "rollback_detection", "strict_db_write", "dual_write_order", "rule", "evidence_top_keys", "evidence_top_keys_contract_738")
if ($null -eq $ev738 -or @($ev738).Count -ne 9) { fail "/meta JSON evidence.evidence_top_keys must be length 9 (738)" }
for ($i = 0; $i -lt 9; $i++) {
    if ([string]$ev738[$i] -ne $ev738Exp[$i]) { fail "/meta JSON evidence.evidence_top_keys[$i] expected $($ev738Exp[$i]) (738), got $($ev738[$i])" }
}
$sb738ev = [string]$jm.evidence.evidence_top_keys_contract_738
if ($sb738ev -notlike '*738*') { fail "/meta JSON evidence_top_keys_contract_738 must mention 738 (738)" }
if ($sb738ev -notlike '*timestamp_policy*') { fail "/meta JSON evidence_top_keys_contract_738 must embed timestamp_policy (738)" }
if ($sb738ev -notlike '*rule*') { fail "/meta JSON evidence_top_keys_contract_738 must embed rule (738)" }
$om739r = [string]$jm.order_messages.rule
if ($om739r -notlike '*739*') { fail "/meta JSON order_messages.rule must mention 739 (739)" }
$om739 = $jm.order_messages.order_messages_top_keys
$om739Exp = @("chain_off_mounted", "strict_db_write", "dual_write_order", "http_rule", "rule", "order_messages_top_keys", "order_messages_top_keys_contract_739")
if ($null -eq $om739 -or @($om739).Count -ne 7) { fail "/meta JSON order_messages.order_messages_top_keys must be length 7 (739)" }
for ($i = 0; $i -lt 7; $i++) {
    if ([string]$om739[$i] -ne $om739Exp[$i]) { fail "/meta JSON order_messages.order_messages_top_keys[$i] expected $($om739Exp[$i]) (739), got $($om739[$i])" }
}
$sb739om = [string]$jm.order_messages.order_messages_top_keys_contract_739
if ($sb739om -notlike '*739*') { fail "/meta JSON order_messages_top_keys_contract_739 must mention 739 (739)" }
if ($sb739om -notlike '*chain_off_mounted*') { fail "/meta JSON order_messages_top_keys_contract_739 must embed chain_off_mounted (739)" }
if ($sb739om -notlike '*http_rule*') { fail "/meta JSON order_messages_top_keys_contract_739 must embed http_rule (739)" }
$rv740r = [string]$jm.reviews.rule
if ($rv740r -notlike '*740*') { fail "/meta JSON reviews.rule must mention 740 (740)" }
$rv740 = $jm.reviews.reviews_top_keys
$rv740Exp = @("strict_db_write", "dual_write_order", "rule", "reviews_top_keys", "reviews_top_keys_contract_740")
if ($null -eq $rv740 -or @($rv740).Count -ne 5) { fail "/meta JSON reviews.reviews_top_keys must be length 5 (740)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$rv740[$i] -ne $rv740Exp[$i]) { fail "/meta JSON reviews.reviews_top_keys[$i] expected $($rv740Exp[$i]) (740), got $($rv740[$i])" }
}
$sb740rv = [string]$jm.reviews.reviews_top_keys_contract_740
if ($sb740rv -notlike '*740*') { fail "/meta JSON reviews_top_keys_contract_740 must mention 740 (740)" }
if ($sb740rv -notlike '*strict_db_write*') { fail "/meta JSON reviews_top_keys_contract_740 must embed strict_db_write (740)" }
if ($sb740rv -notlike '*dual_write_order*') { fail "/meta JSON reviews_top_keys_contract_740 must embed dual_write_order (740)" }
$do741r = [string]$jm.dispute_open.rule
if ($do741r -notlike '*741*') { fail "/meta JSON dispute_open.rule must mention 741 (741)" }
$do741 = $jm.dispute_open.dispute_open_top_keys
$do741Exp = @("strict_db_write", "dual_write_order", "rule", "dispute_open_top_keys", "dispute_open_top_keys_contract_741")
if ($null -eq $do741 -or @($do741).Count -ne 5) { fail "/meta JSON dispute_open.dispute_open_top_keys must be length 5 (741)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$do741[$i] -ne $do741Exp[$i]) { fail "/meta JSON dispute_open.dispute_open_top_keys[$i] expected $($do741Exp[$i]) (741), got $($do741[$i])" }
}
$sb741do = [string]$jm.dispute_open.dispute_open_top_keys_contract_741
if ($sb741do -notlike '*741*') { fail "/meta JSON dispute_open_top_keys_contract_741 must mention 741 (741)" }
if ($sb741do -notlike '*strict_db_write*') { fail "/meta JSON dispute_open_top_keys_contract_741 must embed strict_db_write (741)" }
if ($sb741do -notlike '*dual_write_order*') { fail "/meta JSON dispute_open_top_keys_contract_741 must embed dual_write_order (741)" }
$dr742r = [string]$jm.dispute_resolve.rule
if ($dr742r -notlike '*742*') { fail "/meta JSON dispute_resolve.rule must mention 742 (742)" }
$dr742 = $jm.dispute_resolve.dispute_resolve_top_keys
$dr742Exp = @("strict_db_write", "dual_write_order", "rule", "dispute_resolve_top_keys", "dispute_resolve_top_keys_contract_742")
if ($null -eq $dr742 -or @($dr742).Count -ne 5) { fail "/meta JSON dispute_resolve.dispute_resolve_top_keys must be length 5 (742)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$dr742[$i] -ne $dr742Exp[$i]) { fail "/meta JSON dispute_resolve.dispute_resolve_top_keys[$i] expected $($dr742Exp[$i]) (742), got $($dr742[$i])" }
}
$sb742dr = [string]$jm.dispute_resolve.dispute_resolve_top_keys_contract_742
if ($sb742dr -notlike '*742*') { fail "/meta JSON dispute_resolve_top_keys_contract_742 must mention 742 (742)" }
if ($sb742dr -notlike '*strict_db_write*') { fail "/meta JSON dispute_resolve_top_keys_contract_742 must embed strict_db_write (742)" }
if ($sb742dr -notlike '*dual_write_order*') { fail "/meta JSON dispute_resolve_top_keys_contract_742 must embed dual_write_order (742)" }
$it743r = [string]$jm.itineraries.rule
if ($it743r -notlike '*743*') { fail "/meta JSON itineraries.rule must mention 743 (743)" }
$it743 = $jm.itineraries.itineraries_top_keys
$it743Exp = @("strict_db_write", "dual_write_order", "rule", "itineraries_top_keys", "itineraries_top_keys_contract_743")
if ($null -eq $it743 -or @($it743).Count -ne 5) { fail "/meta JSON itineraries.itineraries_top_keys must be length 5 (743)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$it743[$i] -ne $it743Exp[$i]) { fail "/meta JSON itineraries.itineraries_top_keys[$i] expected $($it743Exp[$i]) (743), got $($it743[$i])" }
}
$sb743it = [string]$jm.itineraries.itineraries_top_keys_contract_743
if ($sb743it -notlike '*743*') { fail "/meta JSON itineraries_top_keys_contract_743 must mention 743 (743)" }
if ($sb743it -notlike '*strict_db_write*') { fail "/meta JSON itineraries_top_keys_contract_743 must embed strict_db_write (743)" }
if ($sb743it -notlike '*dual_write_order*') { fail "/meta JSON itineraries_top_keys_contract_743 must embed dual_write_order (743)" }
$ord744r = [string]$jm.orders.rule
if ($ord744r -notlike '*744*') { fail "/meta JSON orders.rule must mention 744 (744)" }
$ord744 = $jm.orders.orders_top_keys
$ord744Exp = @("strict_db_write", "dual_write_order", "rule", "list_pagination", "orders_top_keys", "orders_top_keys_contract_744")
if ($null -eq $ord744 -or @($ord744).Count -ne 6) { fail "/meta JSON orders.orders_top_keys must be length 6 (744)" }
for ($i = 0; $i -lt 6; $i++) {
    if ([string]$ord744[$i] -ne $ord744Exp[$i]) { fail "/meta JSON orders.orders_top_keys[$i] expected $($ord744Exp[$i]) (744), got $($ord744[$i])" }
}
$sb744ord = [string]$jm.orders.orders_top_keys_contract_744
if ($sb744ord -notlike '*744*') { fail "/meta JSON orders_top_keys_contract_744 must mention 744 (744)" }
if ($sb744ord -notlike '*strict_db_write*') { fail "/meta JSON orders_top_keys_contract_744 must embed strict_db_write (744)" }
if ($sb744ord -notlike '*dual_write_order*') { fail "/meta JSON orders_top_keys_contract_744 must embed dual_write_order (744)" }
if ($sb744ord -notlike '*list_pagination*') { fail "/meta JSON orders_top_keys_contract_744 must embed list_pagination (744)" }
$disc745r = [string]$jm.discover.rule
if ($disc745r -notlike '*745*') { fail "/meta JSON discover.rule must mention 745 (745)" }
$disc745Sw = $jm.discover.strict_db_write
if ($disc745Sw -ne $false) { fail "/meta JSON discover.strict_db_write must be false (745)" }
$disc745 = $jm.discover.discover_top_keys
$disc745Exp = @("strict_db_write", "dual_write_order", "rule", "orders_pagination", "discover_top_keys", "discover_top_keys_contract_745")
if ($null -eq $disc745 -or @($disc745).Count -ne 6) { fail "/meta JSON discover.discover_top_keys must be length 6 (745)" }
for ($i = 0; $i -lt 6; $i++) {
    if ([string]$disc745[$i] -ne $disc745Exp[$i]) { fail "/meta JSON discover.discover_top_keys[$i] expected $($disc745Exp[$i]) (745), got $($disc745[$i])" }
}
$sb745disc = [string]$jm.discover.discover_top_keys_contract_745
if ($sb745disc -notlike '*745*') { fail "/meta JSON discover_top_keys_contract_745 must mention 745 (745)" }
if ($sb745disc -notlike '*strict_db_write*') { fail "/meta JSON discover_top_keys_contract_745 must embed strict_db_write (745)" }
if ($sb745disc -notlike '*dual_write_order*') { fail "/meta JSON discover_top_keys_contract_745 must embed dual_write_order (745)" }
if ($sb745disc -notlike '*orders_pagination*') { fail "/meta JSON discover_top_keys_contract_745 must embed orders_pagination (745)" }
$pc746r = [string]$jm.product_countries.rule
if ($pc746r -notlike '*746*') { fail "/meta JSON product_countries.rule must mention 746 (746)" }
$pc746Sw = $jm.product_countries.strict_db_write
if ($pc746Sw -ne $false) { fail "/meta JSON product_countries.strict_db_write must be false (746)" }
$pc746 = $jm.product_countries.product_countries_top_keys
$pc746Exp = @("strict_db_write", "dual_write_order", "rule", "iso3166_alpha2", "name_zh", "product_countries_top_keys", "product_countries_top_keys_contract_746")
if ($null -eq $pc746 -or @($pc746).Count -ne 7) { fail "/meta JSON product_countries.product_countries_top_keys must be length 7 (746)" }
for ($i = 0; $i -lt 7; $i++) {
    if ([string]$pc746[$i] -ne $pc746Exp[$i]) { fail "/meta JSON product_countries.product_countries_top_keys[$i] expected $($pc746Exp[$i]) (746), got $($pc746[$i])" }
}
$sb746pc = [string]$jm.product_countries.product_countries_top_keys_contract_746
if ($sb746pc -notlike '*746*') { fail "/meta JSON product_countries_top_keys_contract_746 must mention 746 (746)" }
if ($sb746pc -notlike '*strict_db_write*') { fail "/meta JSON product_countries_top_keys_contract_746 must embed strict_db_write (746)" }
if ($sb746pc -notlike '*dual_write_order*') { fail "/meta JSON product_countries_top_keys_contract_746 must embed dual_write_order (746)" }
if ($sb746pc -notlike '*iso3166_alpha2*') { fail "/meta JSON product_countries_top_keys_contract_746 must embed iso3166_alpha2 (746)" }
if ($sb746pc -notlike '*name_zh*') { fail "/meta JSON product_countries_top_keys_contract_746 must embed name_zh (746)" }
$dr747r = [string]$jm.did_rank.rule
if ($dr747r -notlike '*747*') { fail "/meta JSON did_rank.rule must mention 747 (747)" }
$dr747Sw = $jm.did_rank.strict_db_write
if ($dr747Sw -ne $false) { fail "/meta JSON did_rank.strict_db_write must be false (747)" }
$dr747 = $jm.did_rank.did_rank_top_keys
$dr747Exp = @("strict_db_write", "dual_write_order", "rule", "chain_off_mounted", "chain_off_db_pool", "guides_community_penalty_exclusion", "did_rank_top_keys", "did_rank_top_keys_contract_747")
if ($null -eq $dr747 -or @($dr747).Count -ne 8) { fail "/meta JSON did_rank.did_rank_top_keys must be length 8 (747)" }
for ($i = 0; $i -lt 8; $i++) {
    if ([string]$dr747[$i] -ne $dr747Exp[$i]) { fail "/meta JSON did_rank.did_rank_top_keys[$i] expected $($dr747Exp[$i]) (747), got $($dr747[$i])" }
}
$sb747dr = [string]$jm.did_rank.did_rank_top_keys_contract_747
if ($sb747dr -notlike '*747*') { fail "/meta JSON did_rank_top_keys_contract_747 must mention 747 (747)" }
if ($sb747dr -notlike '*strict_db_write*') { fail "/meta JSON did_rank_top_keys_contract_747 must embed strict_db_write (747)" }
if ($sb747dr -notlike '*dual_write_order*') { fail "/meta JSON did_rank_top_keys_contract_747 must embed dual_write_order (747)" }
if ($sb747dr -notlike '*chain_off_mounted*') { fail "/meta JSON did_rank_top_keys_contract_747 must embed chain_off_mounted (747)" }
if ($sb747dr -notlike '*chain_off_db_pool*') { fail "/meta JSON did_rank_top_keys_contract_747 must embed chain_off_db_pool (747)" }
if ($sb747dr -notlike '*guides_community_penalty_exclusion*') { fail "/meta JSON did_rank_top_keys_contract_747 must embed guides_community_penalty_exclusion (747)" }
$m728 = $jm.meta_top_keys
$m728Exp = @(
    "service", "api_version", "build", "chain", "rate_limits", "database_connected", "database", "dual_write", "strict_mode",
    "ssot_version", "ssot", "admin_exports", "chargeback_policy", "finality_n", "indexer", "authority", "pause",
    "evidence", "order_messages", "reviews", "dispute_open", "dispute_resolve", "itineraries", "orders", "discover",
    "product_countries", "did_rank", "product_roles", "auth", "seed_test_accounts", "guides", "idempotency_cache",
    "defaults", "outbox", "meta_top_keys", "meta_top_keys_contract_728"
)
if ($null -eq $m728 -or @($m728).Count -ne 36) { fail "/meta JSON meta_top_keys must be length 36 (728/760)" }
for ($i = 0; $i -lt 36; $i++) {
    if ([string]$m728[$i] -ne $m728Exp[$i]) { fail "/meta JSON meta_top_keys[$i] expected $($m728Exp[$i]) (728), got $($m728[$i])" }
}
$sb728 = [string]$jm.meta_top_keys_contract_728
if ($sb728 -notlike '*728*') { fail "/meta JSON meta_top_keys_contract_728 must mention 728 (728)" }
if ($sb728 -notlike '*service*') { fail "/meta JSON meta_top_keys_contract_728 must embed service (728)" }
if ($sb728 -notlike '*indexer*') { fail "/meta JSON meta_top_keys_contract_728 must embed indexer (728)" }
if ($sb728 -notlike '*database*') { fail "/meta JSON meta_top_keys_contract_728 must embed database (760)" }
$db760Exp = @("connected", "rule", "database_top_keys", "database_top_keys_contract_760")
$db760 = $jm.database.database_top_keys
if ($null -eq $db760 -or @($db760).Count -ne 4) { fail "/meta JSON database.database_top_keys must be length 4 (760)" }
for ($i = 0; $i -lt 4; $i++) {
    if ([string]$db760[$i] -ne $db760Exp[$i]) { fail "/meta JSON database.database_top_keys[$i] expected $($db760Exp[$i]) (760), got $($db760[$i])" }
}
$sb760db = [string]$jm.database.database_top_keys_contract_760
if ($sb760db -notlike '*760*') { fail "/meta JSON database_top_keys_contract_760 must mention 760 (760)" }
if ($sb760db -notlike '*connected*') { fail "/meta JSON database_top_keys_contract_760 must embed connected (760)" }
$rlrule761 = [string]$jm.rate_limits.rule
if ($rlrule761 -notlike '*761*') { fail "/meta JSON rate_limits.rule must mention 761 (761)" }
$gu761Exp = @("max_per_window", "window_seconds", "rule", "guide_upload_top_keys", "guide_upload_top_keys_contract_761")
$gu761 = $jm.rate_limits.guide_upload.guide_upload_top_keys
if ($null -eq $gu761 -or @($gu761).Count -ne 5) { fail "/meta JSON rate_limits.guide_upload.guide_upload_top_keys must be length 5 (761)" }
for ($i = 0; $i -lt 5; $i++) {
    if ([string]$gu761[$i] -ne $gu761Exp[$i]) { fail "/meta JSON rate_limits.guide_upload.guide_upload_top_keys[$i] expected $($gu761Exp[$i]) (761), got $($gu761[$i])" }
}
$sb761gu = [string]$jm.rate_limits.guide_upload.guide_upload_top_keys_contract_761
if ($sb761gu -notlike '*761*') { fail "/meta JSON guide_upload_top_keys_contract_761 must mention 761 (761)" }
if ($sb761gu -notlike '*max_per_window*') { fail "/meta JSON guide_upload_top_keys_contract_761 must embed max_per_window (761)" }
ok "/meta JSON .product_roles (692/748 top_keys) + .auth.registration (694/697/749 top_keys) + .auth (750 top_keys) + .seed_test_accounts (751 top_keys) + .guides (752 top_keys) + .idempotency_cache (753 top_keys) + .defaults (754 top_keys) + .outbox (755 top_keys) + .rate_limits (756 top_keys) + .rate_limits.guide_upload (761 top_keys) + .chain.rule (762/763/765/766/767/768/769/770/771/772/773/774/775/776/777/778/779/780/781/782/783/784/785/786/787/788/789/790/791/792/793/794/795/796/797/798/799/800/801/802/803/804/805/806) + .indexer.finality_discipline.order_chain_sync_status (704/705/706/707/708/709/710/711/712/713/714/715/716/717/718/719/720/721/722/723/724/725) + .indexer.finality_discipline (726) + .indexer (727) + .indexer.memory (757 top_keys) + .indexer.checkpoint (758 top_keys) + .database (760 top_keys) + .build (730) + .dual_write (732) + .strict_mode (731) + .ssot (733) + .admin_exports (734) + .chargeback_policy (735) + .authority (736) + .pause (737) + .evidence (738) + .order_messages (739) + .reviews (740) + .dispute_open (741) + .dispute_resolve (742) + .itineraries (743) + .orders (744) + .discover (745) + .product_countries (746) + .did_rank (747) + .chain (729) + .chain.contracts (759 top_keys when object) + root (728)"
try {
    $jb = $rmb.Content | ConvertFrom-Json
} catch {
    fail "/meta/build JSON parse failed: $_"
}
$b = $jm.build
if ($jb.git_sha -ne $b.git_sha) { fail "/meta/build .git_sha must match /meta .build.git_sha" }
$jd = $jb.deployed_at
$bd = $b.deployed_at
if (($null -eq $jd) -ne ($null -eq $bd)) { fail "/meta/build .deployed_at null mismatch vs /meta .build" }
if ($null -ne $jd -and [string]$jd -ne [string]$bd) { fail "/meta/build .deployed_at must match /meta .build.deployed_at" }
if ([string]$jb.rule -ne [string]$b.rule) { fail "/meta/build .rule must match /meta .build.rule (688)" }
ok "/meta/build equals /meta .build (688)"

try {
    $rmet = Invoke-WebRequest -Uri "$BaseUrl/metrics" -UseBasicParsing -TimeoutSec 3
} catch { $rmet = $null }
if (-not $rmet -or $rmet.StatusCode -ne 200) { fail "/metrics returned $(if ($rmet) { $rmet.StatusCode } else { 'no response' })" }
ok "/metrics 200"

try {
    $r2 = Invoke-WebRequest -Uri "$BaseUrl/api/v1/discover/orders" -UseBasicParsing -TimeoutSec 3
} catch { $r2 = $null }
$code2 = if ($r2) { $r2.StatusCode } else { 0 }
if ($code2 -notin 200, 503) { fail "/api/v1/discover/orders returned $code2" }
ok "/api/v1/discover/orders $code2"

if ($code2 -eq 200) {
    $r2p = $null
    try {
        $r2p = Invoke-WebRequest -Uri "$BaseUrl/api/v1/discover/orders?limit=1" -UseBasicParsing -TimeoutSec 3
    } catch { $r2p = $null }
    if (-not $r2p -or $r2p.StatusCode -ne 200) {
        fail "/api/v1/discover/orders?limit=1 expected 200, got $(if ($r2p) { $r2p.StatusCode } else { 'no response' })"
    }
    ok "/api/v1/discover/orders?limit=1 200"
    try {
        $jp = $r2p.Content | ConvertFrom-Json
    } catch {
        fail "discover paginated JSON parse failed: $_"
    }
    if ($jp.status -ne "ok") { fail "discover paginated JSON .status expected ok, got $($jp.status)" }
    if ($null -eq $jp.page) { fail "discover paginated JSON .page missing" }
    if ($jp.page.limit -ne 1) { fail "discover paginated JSON .page.limit expected 1, got $($jp.page.limit)" }
    if ($null -eq $jp.items) { fail "discover paginated JSON .items missing" }
    if ($jp.items -isnot [System.Array]) { fail "discover paginated JSON .items must be array" }
    $hm = $jp.page.has_more
    if ($hm -isnot [bool]) { fail "discover paginated JSON .page.has_more must be boolean" }
    ok "discover paginated JSON shape (limit=1, page.*)"
}

try {
    $r3 = Invoke-WebRequest -Uri "$BaseUrl/api/v1/did-rank/itineraries" -UseBasicParsing -TimeoutSec 3
} catch { $r3 = $null }
$code3 = if ($r3) { $r3.StatusCode } else { 0 }
if ($code3 -notin 200, 503) { fail "/api/v1/did-rank/itineraries returned $code3" }
ok "/api/v1/did-rank/itineraries $code3"

try {
    $r3g = Invoke-WebRequest -Uri "$BaseUrl/api/v1/did-rank/guides" -UseBasicParsing -TimeoutSec 3
} catch { $r3g = $null }
$code3g = if ($r3g) { $r3g.StatusCode } else { 0 }
if ($code3g -notin 200, 503) { fail "/api/v1/did-rank/guides returned $code3g" }
ok "/api/v1/did-rank/guides $code3g"

try {
    $r3t = Invoke-WebRequest -Uri "$BaseUrl/api/v1/did-rank/travelers" -UseBasicParsing -TimeoutSec 3
} catch { $r3t = $null }
$code3t = if ($r3t) { $r3t.StatusCode } else { 0 }
if ($code3t -notin 200, 503) { fail "/api/v1/did-rank/travelers returned $code3t" }
ok "/api/v1/did-rank/travelers $code3t"

try {
    $rts = Invoke-WebRequest -Uri "$BaseUrl/api/v1/community/stats/posts-by-tag?tag=smoke" -UseBasicParsing -TimeoutSec 3
} catch { $rts = $null }
if (-not $rts -or $rts.StatusCode -ne 200) {
    fail "/api/v1/community/stats/posts-by-tag?tag=smoke expected 200, got $(if ($rts) { $rts.StatusCode } else { 'no response' })"
}
ok "/api/v1/community/stats/posts-by-tag?tag=smoke 200"
try {
    $jts = $rts.Content | ConvertFrom-Json
} catch {
    fail "community stats JSON parse failed: $_"
}
if ($jts.status -ne "ok") { fail "community stats JSON .status expected ok, got $($jts.status)" }
if ($null -eq $jts.post_count) { fail "community stats JSON .post_count missing" }
ok "community stats JSON shape (tag=smoke)"

if ($r3 -and $r3.StatusCode -eq 200) {
    $r4 = $null
    try {
        $r4 = Invoke-WebRequest -Uri "$BaseUrl/api/v1/did-rank/itineraries?period=week" -UseBasicParsing -TimeoutSec 3
    } catch { $r4 = $null }
    if (-not $r4 -or $r4.StatusCode -ne 200) {
        fail "did-rank shape check: GET ?period=week expected 200, got $(if ($r4) { $r4.StatusCode } else { 'no response' })"
    }
    try {
        $j = $r4.Content | ConvertFrom-Json
    } catch {
        fail "did-rank JSON parse failed: $_"
    }
    if ($j.status -ne "ok") { fail "did-rank itineraries JSON .status expected ok, got $($j.status)" }
    if ($j.limit -ne 30) { fail "did-rank itineraries JSON .limit expected 30, got $($j.limit)" }
    if ($j.period -ne "week") { fail "did-rank itineraries JSON .period expected week, got $($j.period)" }
    if (-not $j.since -or ($j.since -isnot [string]) -or ($j.since.Length -lt 10)) {
        fail "did-rank itineraries JSON .since for period=week must be non-empty RFC3339 string"
    }
    $allowedIt = @(
        "order_completed_at",
        "itinerary_created_at_fallback",
        "itinerary_created_at_proxy"
    )
    if ($allowedIt -notcontains $j.rank_basis) {
        fail "did-rank itineraries JSON .rank_basis unexpected: $($j.rank_basis) (expected order_completed_at|itinerary_created_at_fallback|itinerary_created_at_proxy)"
    }
    if ($null -eq $j.itineraries) { fail "did-rank itineraries JSON .itineraries missing" }
    if ($j.itineraries -isnot [System.Array]) { fail "did-rank itineraries JSON .itineraries must be array" }
    ok "did-rank itineraries JSON shape (period=week, since/limit/rank_basis, itineraries[])"
}

if ($r3g -and $r3g.StatusCode -eq 200) {
    $r4g = $null
    try {
        $r4g = Invoke-WebRequest -Uri "$BaseUrl/api/v1/did-rank/guides?period=week" -UseBasicParsing -TimeoutSec 3
    } catch { $r4g = $null }
    if (-not $r4g -or $r4g.StatusCode -ne 200) {
        fail "did-rank guides shape check: GET ?period=week expected 200, got $(if ($r4g) { $r4g.StatusCode } else { 'no response' })"
    }
    try {
        $jg = $r4g.Content | ConvertFrom-Json
    } catch {
        fail "did-rank guides JSON parse failed: $_"
    }
    if ($jg.status -ne "ok") { fail "did-rank guides JSON .status expected ok, got $($jg.status)" }
    if ($jg.limit -ne 30) { fail "did-rank guides JSON .limit expected 30, got $($jg.limit)" }
    if ($jg.period -ne "week") { fail "did-rank guides JSON .period expected week, got $($jg.period)" }
    if ($jg.rank_basis -ne "guide_reception_gross_total_then_completed_count") {
        fail "did-rank guides JSON .rank_basis expected guide_reception_gross_total_then_completed_count, got $($jg.rank_basis)"
    }
    if ($null -eq $jg.guides) { fail "did-rank guides JSON .guides missing" }
    if ($jg.guides -isnot [System.Array]) { fail "did-rank guides JSON .guides must be array" }
    ok "did-rank guides JSON shape (period=week, rank_basis, guides[])"
    $r4gRev = $null
    try {
        $r4gRev = Invoke-WebRequest -Uri "$BaseUrl/api/v1/did-rank/guides?period=week&sort=reviews" -UseBasicParsing -TimeoutSec 3
    } catch { $r4gRev = $null }
    if (-not $r4gRev -or $r4gRev.StatusCode -ne 200) {
        fail "did-rank guides sort=reviews: GET expected 200, got $(if ($r4gRev) { $r4gRev.StatusCode } else { 'no response' })"
    }
    try {
        $jgRev = $r4gRev.Content | ConvertFrom-Json
    } catch {
        fail "did-rank guides sort=reviews JSON parse failed: $_"
    }
    $expRev = "guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_3"
    if ($jgRev.rank_basis -ne $expRev) {
        fail "did-rank guides sort=reviews .rank_basis expected $expRev, got $($jgRev.rank_basis)"
    }
    ok "did-rank guides JSON shape (period=week, sort=reviews, rank_basis)"
    $r4gW = $null
    try {
        $r4gW = Invoke-WebRequest -Uri "$BaseUrl/api/v1/did-rank/guides?period=week&sort=weighted" -UseBasicParsing -TimeoutSec 3
    } catch { $r4gW = $null }
    if (-not $r4gW -or $r4gW.StatusCode -ne 200) {
        fail "did-rank guides sort=weighted: GET expected 200, got $(if ($r4gW) { $r4gW.StatusCode } else { 'no response' })"
    }
    try {
        $jgW = $r4gW.Content | ConvertFrom-Json
    } catch {
        fail "did-rank guides sort=weighted JSON parse failed: $_"
    }
    $expW = "guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_3"
    if ($jgW.rank_basis -ne $expW) {
        fail "did-rank guides sort=weighted .rank_basis expected $expW, got $($jgW.rank_basis)"
    }
    ok "did-rank guides JSON shape (period=week, sort=weighted, rank_basis)"
}

if ($r3t -and $r3t.StatusCode -eq 200) {
    $r4t = $null
    try {
        $r4t = Invoke-WebRequest -Uri "$BaseUrl/api/v1/did-rank/travelers?period=week" -UseBasicParsing -TimeoutSec 3
    } catch { $r4t = $null }
    if (-not $r4t -or $r4t.StatusCode -ne 200) {
        fail "did-rank travelers shape check: GET ?period=week expected 200, got $(if ($r4t) { $r4t.StatusCode } else { 'no response' })"
    }
    try {
        $jt = $r4t.Content | ConvertFrom-Json
    } catch {
        fail "did-rank travelers JSON parse failed: $_"
    }
    if ($jt.status -ne "ok") { fail "did-rank travelers JSON .status expected ok, got $($jt.status)" }
    if ($jt.limit -ne 30) { fail "did-rank travelers JSON .limit expected 30, got $($jt.limit)" }
    if ($jt.period -ne "week") { fail "did-rank travelers JSON .period expected week, got $($jt.period)" }
    if ($jt.rank_basis -ne "tourist_completed_orders_in_window") {
        fail "did-rank travelers JSON .rank_basis expected tourist_completed_orders_in_window, got $($jt.rank_basis)"
    }
    if ($null -eq $jt.travelers) { fail "did-rank travelers JSON .travelers missing" }
    if ($jt.travelers -isnot [System.Array]) { fail "did-rank travelers JSON .travelers must be array" }
    ok "did-rank travelers JSON shape (period=week, rank_basis, travelers[])"
}

Write-Host ""
Write-Host "55 阶段运行时快速验收通过（BASE_URL=$BaseUrl）。"
