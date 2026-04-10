/**
 * API 基地址与路由路径常量（与 04 §三、crates/api 一致）
 * 见 docs/spec/14-合约-API-ABI-前后端对齐.md、docs/spec/04-后端与API.md
 */

const BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
    ? process.env.NEXT_PUBLIC_API_BASE_URL.trim().replace(/\/$/, "")
    : "http://localhost:8080";

export const apiBase = BASE;

/** 本地 loopback API：浏览器走相对路径 + Next rewrites 代理，避免 CORS / 误配 CORS_ORIGINS 导致 `Failed to fetch`。 */
function isLoopbackApiBase(base: string): boolean {
  try {
    const u = new URL(base);
    const h = u.hostname.toLowerCase();
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "[::1]" ||
      h === "::1" ||
      h === "0:0:0:0:0:0:0:1"
    );
  } catch {
    return false;
  }
}

/** 浏览器端：指向前端自身 origin，由 Next `rewrites` 代理到 BASE，避免直连 :8080 触发 CORS。 */
function sameOriginApiPathInBrowser(path: string): string | null {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (typeof globalThis === "undefined") return null;
  const loc = (globalThis as { window?: { location?: { origin?: string } } }).window?.location;
  const origin = loc?.origin;
  if (typeof origin !== "string" || origin.length === 0) return null;
  return `${origin}${p}`;
}

/** 健康与元数据 */
export const routes = {
  health: "/health",
  /** 726/727/728/729/730/731/732/733/734/735/736/737/738/739/740/741/742/743/744/745/746/747/748/749/750/751/752/753/754/755/756/757/758/759/760/761/762/763/765/766/767/768/769/770/771/772/773/774/775/776/777/778/779/780/781/782/783/784/785/786/787/788/789/790/791/792/793/794/795/796/797/798/799/800/801/802/803/804/805/806：`GET /meta` `indexer.finality_discipline` 与 **`FINALITY_DISCIPLINE_META_TOP_KEYS`** / `finality_discipline_top_keys` / `finality_discipline_top_keys_contract_726` 对读；**`indexer`** 与 **`INDEXER_META_TOP_KEYS`** / `indexer_top_keys` / `indexer_top_keys_contract_727` 对读；**`indexer.memory`** 与 **`INDEXER_MEMORY_META_TOP_KEYS`** / `indexer_memory_top_keys` / `indexer_memory_top_keys_contract_757` 对读；**`indexer.checkpoint`** 与 **`INDEXER_CHECKPOINT_META_TOP_KEYS`** / `indexer_checkpoint_top_keys` / `indexer_checkpoint_top_keys_contract_758` 对读；**`chain.contracts`**（非 null 时）与 **`CHAIN_CONTRACTS_META_TOP_KEYS`** / `chain_contracts_top_keys` / `chain_contracts_top_keys_contract_759` 对读；**`database`** 与 **`DATABASE_META_TOP_KEYS`** / `database_top_keys` / `database_top_keys_contract_760` 对读；**根对象** 与 **`META_ROOT_TOP_KEYS`** / `meta_top_keys` / `meta_top_keys_contract_728` 对读；**`chain`** 与 **`CHAIN_META_TOP_KEYS`** / `chain_top_keys` / `chain_top_keys_contract_729` 对读；**762** **`chain.rule`** 机读句互链 **761** **`rate_limits.guide_upload`** 五键；**763** **`chain.rule`** 机读句互链根 **`service`** 与 **`api_version`**（**728** 首二键）；**`build`**（**`GET /meta/build`** 同源）与 **`META_BUILD_TOP_KEYS`** / `build_top_keys` / `build_top_keys_contract_730` 对读；**`strict_mode`** 与 **`STRICT_MODE_META_TOP_KEYS`** / `strict_mode_top_keys` / `strict_mode_top_keys_contract_731` 对读；**`dual_write`** 与 **`DUAL_WRITE_META_TOP_KEYS`** / `dual_write_top_keys` / `dual_write_top_keys_contract_732` 对读；**`ssot`** 与 **`SSOT_META_TOP_KEYS`** / `ssot_top_keys` / `ssot_top_keys_contract_733` 对读；**`admin_exports`** 与 **`ADMIN_EXPORTS_META_TOP_KEYS`** / `admin_exports_top_keys` / `admin_exports_top_keys_contract_734` 对读；**`chargeback_policy`** 与 **`CHARGEBACK_POLICY_META_TOP_KEYS`** / `chargeback_policy_top_keys` / `chargeback_policy_top_keys_contract_735` 对读（**`value`** = **`CHARGEBACK_POLICY`**）；**`authority`** 与 **`AUTHORITY_META_TOP_KEYS`** / `authority_top_keys` / `authority_top_keys_contract_736` 对读；**`pause`** 与 **`PAUSE_META_TOP_KEYS`** / `pause_top_keys` / `pause_top_keys_contract_737` 对读；**`evidence`** 与 **`EVIDENCE_META_TOP_KEYS`** / `evidence_top_keys` / `evidence_top_keys_contract_738` 对读；**`order_messages`** 与 **`ORDER_MESSAGES_META_TOP_KEYS`** / `order_messages_top_keys` / `order_messages_top_keys_contract_739` 对读；**`reviews`** 与 **`REVIEWS_META_TOP_KEYS`** / `reviews_top_keys` / `reviews_top_keys_contract_740` 对读；**`dispute_open`** 与 **`DISPUTE_OPEN_META_TOP_KEYS`** / `dispute_open_top_keys` / `dispute_open_top_keys_contract_741` 对读；**`dispute_resolve`** 与 **`DISPUTE_RESOLVE_META_TOP_KEYS`** / `dispute_resolve_top_keys` / `dispute_resolve_top_keys_contract_742` 对读；**`itineraries`** 与 **`ITINERARIES_META_TOP_KEYS`** / `itineraries_top_keys` / `itineraries_top_keys_contract_743` 对读；**`orders`** 与 **`ORDERS_META_TOP_KEYS`** / `orders_top_keys` / `orders_top_keys_contract_744` 对读；**`discover`** 与 **`DISCOVER_META_TOP_KEYS`** / `discover_top_keys` / `discover_top_keys_contract_745` 对读；**`product_countries`** 与 **`PRODUCT_COUNTRIES_META_TOP_KEYS`** / `product_countries_top_keys` / `product_countries_top_keys_contract_746` 对读；**`did_rank`** 与 **`DID_RANK_META_TOP_KEYS`** / `did_rank_top_keys` / `did_rank_top_keys_contract_747` 对读；**`product_roles`** 与 **`PRODUCT_ROLES_META_TOP_KEYS`** / `product_roles_top_keys` / `product_roles_top_keys_contract_748` 对读；**`auth.registration`** 与 **`AUTH_REGISTRATION_META_TOP_KEYS`** / `auth_registration_top_keys` / `auth_registration_top_keys_contract_749` 对读；**`auth`** 与 **`AUTH_META_TOP_KEYS`** / `auth_top_keys` / `auth_top_keys_contract_750` 对读；**`seed_test_accounts`** 与 **`SEED_TEST_ACCOUNTS_META_TOP_KEYS`** / `seed_test_accounts_top_keys` / `seed_test_accounts_top_keys_contract_751` 对读；**`guides`** 与 **`GUIDES_META_TOP_KEYS`** / `guides_top_keys` / `guides_top_keys_contract_752` 对读；**`idempotency_cache`** 与 **`IDEMPOTENCY_CACHE_META_TOP_KEYS`** / `idempotency_cache_top_keys` / `idempotency_cache_top_keys_contract_753` 对读；**`defaults`** 与 **`DEFAULTS_META_TOP_KEYS`** / `defaults_top_keys` / `defaults_top_keys_contract_754` 对读；**`outbox`** 与 **`OUTBOX_META_TOP_KEYS`** / `outbox_top_keys` / `outbox_top_keys_contract_755` 对读；**`rate_limits`** 与 **`RATE_LIMITS_META_TOP_KEYS`** / `rate_limits_top_keys` / `rate_limits_top_keys_contract_756` 对读；**嵌 `rate_limits.guide_upload`** 与 **`GUIDE_UPLOAD_META_TOP_KEYS`** / `guide_upload_top_keys` / `guide_upload_top_keys_contract_761` 对读；**762** **`chain.rule`** 机读互链同上；**763** **`chain.rule`** 根 **`service`** 与 **`api_version`** ↔ **728**；**765** **`chain.rule`** 根 **`build`** 与 **730** **`build_top_keys`** 及 **`META_ROOT_TOP_KEYS`**** **第三键 **`build`**** **及** **728** **`meta_top_keys`**；**766** **`chain.rule`** 根 **`chain`** 与 **729** **`chain_top_keys`** 及 **`META_ROOT_TOP_KEYS`**** **第四键 **`chain`**** **及** **728** **`meta_top_keys`**；**767** **`chain.rule`** 根 **`rate_limits`** 与 **756** 及 **`META_ROOT_TOP_KEYS`**** **第五键 **`rate_limits`**** **及** **728** **`meta_top_keys`**；**768** **`chain.rule`** 根 **`database_connected`**、**`database.connected`** 与批 **760** **`DATABASE_META_TOP_KEYS`**** 首键 **`connected`**，及 **`META_ROOT_TOP_KEYS`**** 第六键 **`database_connected`** 及 **728** **`meta_top_keys`**；**769** **`chain.rule`** 根 **`database`** **对象** **`database_top_keys`** **`/`** **`database_top_keys_contract_760`** 与 **`DATABASE_META_TOP_KEYS`** **四键** **及** **`META_ROOT_TOP_KEYS`**** **第七键 **`database`**** **及** **728** **`meta_top_keys`**；**770** **`chain.rule`** 根 **`dual_write`** **对象** **`dual_write_top_keys`** **`/`** **`dual_write_top_keys_contract_732`** 与 **`DUAL_WRITE_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第八键 **`dual_write`**** **及** **728** **`meta_top_keys`**；**771** **`chain.rule`** 根 **`strict_mode`** **对象** **`strict_mode_top_keys`** **`/`** **`strict_mode_top_keys_contract_731`** 与 **`STRICT_MODE_META_TOP_KEYS`** **七键** **及** **`META_ROOT_TOP_KEYS`**** **第九键 **`strict_mode`**** **及** **728** **`meta_top_keys`**；**772** **`chain.rule`** 根 **`ssot_version`** **与 **`strict_mode.rule`** **及** **733 **`ssot_top_keys`** **`/`** **`ssot_top_keys_contract_733`** **`SSOT_META_TOP_KEYS`** **及** **`META_ROOT_TOP_KEYS`**** **第十键 **`ssot_version`**** **及** **728** **`meta_top_keys`**；**773** **`chain.rule`** 根 **`admin_exports`** **对象** **`admin_exports_top_keys`** **`/`** **`admin_exports_top_keys_contract_734`** **与 **`ADMIN_EXPORTS_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第十二键 **`admin_exports`**** **及** **728** **`meta_top_keys`**；**774** **`chain.rule`** 根 **`chargeback_policy`** **对象** **`chargeback_policy_top_keys`** **`/`** **`chargeback_policy_top_keys_contract_735`** **与 **`CHARGEBACK_POLICY_META_TOP_KEYS`** **四键** **及** **`META_ROOT_TOP_KEYS`**** **第十三键 **`chargeback_policy`**** **及** **728** **`meta_top_keys`**；**775** **`chain.rule`** 根 **`finality_n`** **与 **`FINALITY_N`** **及 **`GET /meta.indexer.finality_n`** **同源** **及** **`META_ROOT_TOP_KEYS`**** **第十四键 **`finality_n`**** **及** **728** **`meta_top_keys`**；**776** **`chain.rule`** 根 **`indexer`** **对象 **`indexer_top_keys`** **`/`** **`indexer_top_keys_contract_727`** **与 **`INDEXER_META_TOP_KEYS`** **十三键** **及** **`META_ROOT_TOP_KEYS`**** **第十五键 **`indexer`**** **及** **728** **`meta_top_keys`**；**777** **`chain.rule`** 根 **`authority`** **对象 **`authority_top_keys`** **`/`** **`authority_top_keys_contract_736`** **与 **`AUTHORITY_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第十六键 **`authority`**** **及** **728** **`meta_top_keys`**；**778** **`chain.rule`** 根 **`pause`** **对象 **`pause_top_keys`** **`/`** **`pause_top_keys_contract_737`** **与 **`PAUSE_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第十七键 **`pause`**** **及** **728** **`meta_top_keys`**；**779** **`chain.rule`** 根 **`evidence`** **对象 **`evidence_top_keys`** **`/`** **`evidence_top_keys_contract_738`** **与 **`EVIDENCE_META_TOP_KEYS`** **九键** **及** **`META_ROOT_TOP_KEYS`**** **第十八键 **`evidence`**** **及** **728** **`meta_top_keys`**；**780** **`chain.rule`** 根 **`order_messages`** **对象 **`order_messages_top_keys`** **`/`** **`order_messages_top_keys_contract_739`** **与 **`ORDER_MESSAGES_META_TOP_KEYS`** **七键** **及** **`META_ROOT_TOP_KEYS`**** **第十九键 **`order_messages`**** **及** **728** **`meta_top_keys`**；**781** **`chain.rule`** 根 **`reviews`** **对象 **`reviews_top_keys`** **`/`** **`reviews_top_keys_contract_740`** **与 **`REVIEWS_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第二十键 **`reviews`**** **及** **728** **`meta_top_keys`**；**782** **`chain.rule`** 根 **`dispute_open`** **对象 **`dispute_open_top_keys`** **`/`** **`dispute_open_top_keys_contract_741`** **与 **`DISPUTE_OPEN_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第二十一键 **`dispute_open`**** **及** **728** **`meta_top_keys`**；**783** **`chain.rule`** 根 **`dispute_resolve`** **对象 **`dispute_resolve_top_keys`** **`/`** **`dispute_resolve_top_keys_contract_742`** **与 **`DISPUTE_RESOLVE_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第二十二键 **`dispute_resolve`**** **及** **728** **`meta_top_keys`**；**784** **`chain.rule`** 根 **`itineraries`** **对象 **`itineraries_top_keys`** **`/`** **`itineraries_top_keys_contract_743`** **与 **`ITINERARIES_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第二十三键 **`itineraries`**** **及** **728** **`meta_top_keys`**；**785** **`chain.rule`** 根 **`orders`** **对象 **`orders_top_keys`** **`/`** **`orders_top_keys_contract_744`** **与 **`ORDERS_META_TOP_KEYS`** **七键** **及** **`META_ROOT_TOP_KEYS`**** **第二十四键 **`orders`**** **及** **728** **`meta_top_keys`**；**786** **`chain.rule`** 根 **`discover`** **对象 **`discover_top_keys`** **`/`** **`discover_top_keys_contract_745`** **与 **`DISCOVER_META_TOP_KEYS`** **六键** **及** **`META_ROOT_TOP_KEYS`**** **第二十五键 **`discover`**** **及** **728** **`meta_top_keys`**；**787** **`chain.rule`** 根 **`product_countries`** **对象 **`product_countries_top_keys`** **`/`** **`product_countries_top_keys_contract_746`** **与 **`PRODUCT_COUNTRIES_META_TOP_KEYS`** **七键** **及** **`META_ROOT_TOP_KEYS`**** **第二十六键 **`product_countries`**** **及** **728** **`meta_top_keys`**；**788** **`chain.rule`** 根 **`did_rank`** **对象 **`did_rank_top_keys`** **`/`** **`did_rank_top_keys_contract_747`** **与 **`DID_RANK_META_TOP_KEYS`** **八键** **及** **`META_ROOT_TOP_KEYS`**** **第二十七键 **`did_rank`**** **及** **728** **`meta_top_keys`**；**789** **`chain.rule`** 根 **`product_roles`** **对象 **`product_roles_top_keys`** **`/`** **`product_roles_top_keys_contract_748`** **与 **`PRODUCT_ROLES_META_TOP_KEYS`** **十键** **及** **`META_ROOT_TOP_KEYS`**** **第二十八键 **`product_roles`**** **及** **728** **`meta_top_keys`**；**790** **`chain.rule`** 根 **`auth`** **对象 **`auth_top_keys`** **`/`** **`auth_top_keys_contract_750`** **与 **`AUTH_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第二十九键 **`auth`**** **及** **728** **`meta_top_keys`**；**791** **`chain.rule`** 根 **`seed_test_accounts`** **对象 **`seed_test_accounts_top_keys`** **`/`** **`seed_test_accounts_top_keys_contract_751`** **与 **`SEED_TEST_ACCOUNTS_META_TOP_KEYS`** **四键** **及** **`META_ROOT_TOP_KEYS`**** **第三十键 **`seed_test_accounts`**** **及** **728** **`meta_top_keys`**；**792** **`chain.rule`** 根 **`guides`** **对象 **`guides_top_keys`** **`/`** **`guides_top_keys_contract_752`** **与 **`GUIDES_META_TOP_KEYS`** **四键** **及** **`META_ROOT_TOP_KEYS`**** **第三十一键 **`guides`**** **及** **728** **`meta_top_keys`**；**793** **`chain.rule`** 根 **`idempotency_cache`** **对象 **`idempotency_cache_top_keys`** **`/`** **`idempotency_cache_top_keys_contract_753`** **与 **`IDEMPOTENCY_CACHE_META_TOP_KEYS`** **五键** **及** **`META_ROOT_TOP_KEYS`**** **第三十二键 **`idempotency_cache`**** **及** **728** **`meta_top_keys`**；**794** **`chain.rule`** 根 **`defaults`** **对象 **`defaults_top_keys`** **`/`** **`defaults_top_keys_contract_754`** **与 **`DEFAULTS_META_TOP_KEYS`** **六键** **及** **`META_ROOT_TOP_KEYS`**** **第三十三键 **`defaults`**** **及** **728** **`meta_top_keys`**；**795** **`chain.rule`** 根 **`outbox`** **对象 **`outbox_top_keys`** **`/`** **`outbox_top_keys_contract_755`** **与 **`OUTBOX_META_TOP_KEYS`** **八键** **及** **`META_ROOT_TOP_KEYS`**** **第三十四键 **`outbox`**** **及** **728** **`meta_top_keys`**；**796** **`chain.rule`** 根 **`meta_top_keys`** **JSON** **数组** **与 **`META_ROOT_TOP_KEYS`** **三十六键** **顺序** **同源**，**根级 **`meta_top_keys_contract_728`** **机读** **与** **728** **contract** **同源**，**与 **`META_ROOT_TOP_KEYS`**** **第三十五键 **`meta_top_keys`**** **机读** **互链**；**797** **`chain.rule`** **根 **`meta_top_keys_contract_728`** **与 **`META_ROOT_TOP_KEYS`**** **第三十六键 **`meta_top_keys_contract_728`**** **机读同源**，**与** **728** **contract**、**`META_ROOT_TOP_KEYS`**** **第三十五键 **`meta_top_keys`**** **机读互链**；**798** **`chain.rule`** **798** **根 **`meta_top_keys`**** **JSON** **数组** **三十六项** **与 **`META_ROOT_TOP_KEYS`**** **三十六键** **顺序** **逐项** **同源**，**`meta_top_keys_contract_728`** **嵌入** **三十六键** **字面** **顺序** **同源**，**796** **与** **797** **与** **文末** **728** **句** **链式** **互证**；**799** **`chain.rule`** **799**** **798** **句** **与** **文末** **728** **句** **机读** **相邻** **互锁**，**双锚** **根级** **`meta_top_keys`**** **JSON** **数组** **三十六项** **与** **`META_ROOT_TOP_KEYS`**** **三十六键** **及** **`meta_top_keys_contract_728`**** **字面** **顺序** **同源** **闭环**；**800** **`chain.rule`** **800**** **799** **双锚** **闭环** **与** **729** **`GET /meta`**** **`chain`**** **对象 **`chain_top_keys`**** /**`chain_top_keys_contract_729`**** **及** **`CHAIN_META_TOP_KEYS`**** **五键** **机读** **同源**，**与** **`META_ROOT_TOP_KEYS`**** **第四键 **`chain`**** **及** **766** **机读句** **串联** **互证**；**801** **`chain.rule`** **801**** **800** **串联** **与** **GET /meta** **`chain.contracts`** **（非** **null** **时）** **759** **`chain_contracts_top_keys`** **`/`** **`chain_contracts_top_keys_contract_759`** **及** **`CHAIN_CONTRACTS_META_TOP_KEYS`** **十键** **机读** **同源**，**与** **799** **双锚** **闭环** **及** **766/729** **`chain`** **子树** **三向** **互证**；**802** **`chain.rule`** **802** **801** **串联** **与** **GET /meta** **`chain.contracts`** **（非** **null** **时）** **`contracts.rule`** **嵌入之** **759** **句** **与** **根级** **`chain.rule`** **759** **及** **801** **十键** **机读** **核心** **同源**，**与** **`chain_contracts_top_keys`** **`/`** **`chain_contracts_top_keys_contract_759`** **`/`** **`CHAIN_CONTRACTS_META_TOP_KEYS`** **及** **801** **四向** **互证**；**803** **`chain.rule`** **803** **802** **串联** **与** **800** **及** **766** **GET /meta** **`chain`** **对象 **`chain_top_keys`** **`/`** **`chain_top_keys_contract_729`** **`/`** **`CHAIN_META_TOP_KEYS`** **五键** **机读** **同源**，**与** **799** **双锚** **经** **729、801、759、802** **`contracts.rule`** **根级** **`chain.rule`** **759** **嵌入** **形成** **五向** **链读** **闭环**，**与** **`META_ROOT_TOP_KEYS`** **第四键** **`chain`** **及** **728** **`meta_top_keys`** **机读** **六向** **互证**；**804** **`chain.rule`** **804** **803** **六向** **互证** **与** **GET /meta** **`chain.chain_id`** **及** **根级** **`chain.rule`** **文首** **与** **intents** **EIP-712** **domain**、**前端** **`NEXT_PUBLIC_CHAIN_ID`** **应对齐** **及** **contracts** **见** **ChainConfig** **机读** **同源**，**七向** **收束** **803** **链读** **至** **`CHAIN_META_TOP_KEYS`** **首键 **`chain_id`** **部署** **观测** **锚**，**与** **`chain_top_keys`** **`/`** **`chain_top_keys_contract_729`** **及** **803** **七向** **互证**；**805** **`chain.rule`** **805** **804** **七向** **互证** **与** **GET /meta** **`chain.contracts`** **及** **`CHAIN_META_TOP_KEYS`** **第二键 **`contracts`** **机读** **同源**，**八向** **收束** **804** **链读** **至** **`contracts`** **部署** **观测** **锚** **与** **`chain_contracts_top_keys`** **`/`** **`chain_contracts_top_keys_contract_759`** **`/`** **`CHAIN_CONTRACTS_META_TOP_KEYS`** **十键** **及** **801** **三向** **802** **四向** **803** **六向** **串联**，**与** **`chain_top_keys`** **`/`** **`chain_top_keys_contract_729`** **及** **804** **八向** **互证**；**806** **`chain.rule`** **806** **805** **八向** **互证** **与** **GET /meta** **`chain.rule`** **及** **`CHAIN_META_TOP_KEYS`** **第三键 **`rule`** **机读** **同源**，**九向** **收束** **805** **链读** **至** **根级** **`chain.rule`** **文首** **与** **intents** **EIP-712** **domain**、**NEXT_PUBLIC_CHAIN_ID**、**ChainConfig**、**759** **句** **及** **`contracts.rule`** **759** **嵌入** **与** **801** **三向** **802** **四向** **803** **六向** **804** **七向** **805** **八向** **串联**，**与** **`chain_top_keys`** **`/`** **`chain_top_keys_contract_729`** **及** **805** **九向** **互证**（728） */
  meta: "/meta",
  /** 同 GET /meta 的 build 快照（688）；契约 04 §3.4 GET /meta/build */
  metaBuild: "/meta/build",

  /** 认证 */
  auth: {
    register: "/auth/register",
    seedTestAccounts: "/auth/seed-test-accounts",
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    verifyEmail: "/auth/verify-email",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  /** 个人中心 */
  me: "/api/v1/me",
  meStats: "/api/v1/me/stats",
  mePassword: "/api/v1/me/password",

  /** 向导 */
  guides: "/api/v1/guides",
  guideUploadDoc: "/api/v1/guides/upload-doc",
  guideById: (id: string) => `/api/v1/guides/${id}`,
  /** B-079：向导档期占用（与 schedule_engine 锁定 + Accepted/Escrowed/Disputed 订单日期同源） */
  guideAvailability: (id: string) => `/api/v1/guides/${encodeURIComponent(id)}/availability`,
  guideStake: (id: string) => `/api/v1/guides/${id}/stake`,
  uploadsGuide: (name: string) => `/api/v1/uploads/guides/${name}`,

  /** P15/17 ① 行程生成 */
  itineraries: "/api/v1/itineraries",
  /** 49 A 自由市场自定义行程 */
  itinerariesCustom: "/api/v1/itineraries/custom",

  /** P16/17 ② 自由市场列表数据源（HTTP 路径保留 discover；页面主入口 `/market`，见 04 §3.4） */
  discoverOrders: "/api/v1/discover/orders",

  /** 订单 */
  orders: "/api/v1/orders",
  orderById: (id: string) => `/api/v1/orders/${id}`,
  /** 110 §3.3：订单级 pending/confirmed；可选 chain_sync.event_log_snapshot（702：tx_hash / block_hash；722：对象顶层键顺序与 GET /meta `event_log_snapshot_top_keys` / `event_log_snapshot_keys_contract_722` 及 EscrowDetail `CHAIN_SYNC_EVENT_LOG_SNAPSHOT_TOP_KEYS` 同源）；703：event_log_snapshot_absent_reason；705：根级 note；706：chain_sync.last_event（chain_off）；707：根级 order_id；708：非 chain_off 最小体根级 requester；709：非 chain_off 最小体 chain_sync.status=unknown；710：chain_sync.checkpoint block/log/source 与 meta.indexer.checkpoint 同源；723：checkpoint 对象顶层键顺序与 GET /meta `checkpoint_top_keys` / `checkpoint_keys_contract_723` 及 EscrowDetail `CHAIN_SYNC_CHECKPOINT_TOP_KEYS` 同源（orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS）；724：checkpoint.source 合法取值有序表与 GET /meta `checkpoint_source_values` / `checkpoint_source_values_contract_724` 及 EscrowDetail `CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES` 同源（orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES；`chain_sync_checkpoint_source` 712/724 机读句对读）；725：GET /meta `indexer.finality_discipline.order_chain_sync_status` 对象顶层键顺序与 `order_chain_sync_status_top_keys` / `order_chain_sync_status_top_keys_contract_725` 及 EscrowDetail `ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS` 同源（orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS）；711：chain_sync.finality_n 与 meta.finality_n / meta.indexer.finality_n 同源；712：chain_sync.checkpoint.source 与 meta.indexer.checkpoint.source 同源；713：chain_sync.status ∈ pending|confirmed|unknown 与 GET /meta order_chain_sync_status.status_values 同源；714：非 chain_off 最小体根级 note 稳定句与 GET /meta order_chain_sync_status.minimal_body_note_stable 同源（orders::CHAIN_SYNC_MINIMAL_BODY_NOTE）；715：200 成功体根级 status 字面 ok 与 GET /meta order_chain_sync_status.success_body_envelope_status 同源（orders::CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS；与 chain_sync.status 区分）；716：200 chain_sync 必有顶层键 status/finality_n/checkpoint/last_event 与 GET /meta order_chain_sync_status.chain_sync_required_top_keys 同源（orders::CHAIN_SYNC_REQUIRED_TOP_KEYS）；717：路径与 EscrowDetail `CHAIN_SYNC_ROUTE_PATH_TEMPLATE`（:id→实 UUID）及 GET /meta `method_path` / `method_path_contract_717` 同源（orders::CHAIN_SYNC_ROUTE_PATH）；718：GET /meta `order_chain_sync_status.code` / `code_contract_718` 与 EscrowDetail `CHAIN_SYNC_STATUS_HANDLER_CODE` 同源（orders::CHAIN_SYNC_STATUS_HANDLER_CODE）；719：GET /meta `order_chain_sync_status.status_values` / `status_values_contract_719` 与 EscrowDetail `CHAIN_SYNC_STATUS_VALUES` 同源（orders::CHAIN_SYNC_STATUS_VALUES）；720：GET /meta `order_chain_sync_status.absent_reason_values` / `absent_reason_values_contract_720` 与 EscrowDetail `CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS` 同源（orders::CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS）；721：GET /meta `order_chain_sync_status.last_event_top_keys` / `last_event_keys_contract_721` 与 EscrowDetail `CHAIN_SYNC_LAST_EVENT_TOP_KEYS` 同源（706 `chain_sync.last_event` 三键） */
  orderChainSyncStatus: (id: string) => `/api/v1/orders/${id}/chain-sync-status`,
  orderAccept: (id: string) => `/api/v1/orders/${id}/accept`,
  orderCancel: (id: string) => `/api/v1/orders/${id}/cancel`,
  /** P3 链下 mock：Accepted→Escrowed（仅 CHAIN_OFF 时后端可用） */
  orderMockPay: (id: string) => `/api/v1/orders/${id}/mock-pay`,
  orderConfirmCompletion: (id: string) =>
    `/api/v1/orders/${id}/confirm-completion`,
  orderMessages: (id: string) => `/api/v1/orders/${id}/messages`,
  /** 53 行程修改写回（04 PATCH；仅参与方、未 Escrowed 前可改） */
  orderPatchItinerary: (id: string) => `/api/v1/orders/${id}/itinerary`,
  orderConfirmFinalPlan: (id: string) =>
    `/api/v1/orders/${id}/confirm-final-plan`,
  /** 53 双边确认：游客/向导各自确认行程与金额 */
  orderConfirmBilateral: (id: string) =>
    `/api/v1/orders/${id}/confirm-bilateral`,
  /** 53-S8：评分双方确认后触发释放（04 登记后对接） */
  orderConfirmRating: (id: string) =>
    `/api/v1/orders/${id}/confirm-rating`,
  orderSetEscrowAddress: (id: string) =>
    `/api/v1/orders/${id}/set-escrow-address`,
  orderReviews: (id: string) => `/api/v1/orders/${id}/reviews`,
  orderDispute: (id: string) => `/api/v1/orders/${id}/dispute`,
  orderEvidence: (id: string) => `/api/v1/orders/${id}/evidence`,
  /** 270 受限对象短期签名 URL（POST，需登录；有 DB 时 200） */
  mediaSignedUrls: "/api/v1/media/signed-urls",
  /** 270 签名 URL 兑现（GET，匿名；token 为 UUID） */
  mediaAccess: (tokenId: string) => `/api/v1/media/access/${tokenId}`,
  /** Intents 扩展（48 routes/intents） */
  orderConfirmCompletionIntent: (id: string) =>
    `/api/v1/orders/${id}/confirm-completion-intent`,
  orderOpenDisputeIntent: (id: string) =>
    `/api/v1/orders/${id}/open-dispute-intent`,
  disputeExecuteResolutionIntent: (id: string) =>
    `/api/v1/disputes/${id}/execute-resolution-intent`,

  /** 争议 */
  disputes: "/api/v1/disputes",
  disputeById: (id: string) => `/api/v1/disputes/${id}`,
  disputeResolve: (id: string) => `/api/v1/disputes/${id}/resolve`,

  /** 30/55 G1 DID 排行榜 */
  didRankTravelers: "/api/v1/did-rank/travelers",
  didRankGuides: "/api/v1/did-rank/guides",
  didRankItineraries: "/api/v1/did-rank/itineraries",

  /** 49 G 治理与激励（占位，待产品定稿后对接） */
  governancePool: "/api/v1/governance/pool",
  governanceRewards: "/api/v1/governance/rewards",
  /** 治理提案列表（B-072 MVP：链下内存种子条目） */
  governanceProposals: "/api/v1/governance/proposals",
  governanceProposal: (id: string) => `/api/v1/governance/proposals/${encodeURIComponent(id)}`,
  /** Governor state(uint256) 只读；列表页链上状态标签（Task A-1） */
  governanceProposalStatus: (id: string) =>
    `/api/v1/governance/proposal-status/${encodeURIComponent(id)}`,
  governanceProposalVote: (id: string) =>
    `/api/v1/governance/proposals/${encodeURIComponent(id)}/vote`,
  /** B-073：委托投票权（链下 MVP） */
  governanceDelegate: "/api/v1/governance/delegate",
  /** B-092：当前账户投票权重只读（与委托图一致；信号票不对账链上快照） */
  governanceVotingPower: "/api/v1/governance/voting-power",
  /** FeeRouter PlatformFeeRouted 索引只读列表；query limit, cursor (block:log), chain_id */
  governanceFeeRoutes: "/api/v1/governance/fee-routes",
  /** RegionVault RegionVaultForwarded 索引只读列表；query 同 fee-routes */
  governanceVaultForwards: "/api/v1/governance/vault-forwards",
  /** B-084：投影表按 token/pool_id 累计；query chain_id? */
  governanceFeePoolAggregates: "/api/v1/governance/fee-pool-aggregates",
  governanceInvestorShareReconcile: "/api/v1/governance/investor-share-reconcile",
  governanceInvestorDistributionAccruals: "/api/v1/governance/investor-distribution-accruals",
  internalInvestorDistributionAccrual: "/api/v1/internal/investor-distribution-accrual",
  /** 84 文档镜像（非链上 FeeRouter）；响应头 X-Implementation-Status: doc-reference */
  governanceProtocolReference: "/api/v1/governance/protocol-reference",
  /** 待生效参数包（默认与上同形；可选 PROTOCOL_REFERENCE_PENDING_OVERLAY 深度合并）；头 doc-reference-pending */
  governanceProtocolReferencePending: "/api/v1/governance/protocol-reference/pending",

  /** 70 Admin 最小收口 */
  admin: {
    /** 用户列表；query **`limit`**（1～500，缺省 100）、**`role`**、**`kyc_status`**（精确匹配） */
    users: (params?: { limit?: number; role?: string; kyc_status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.role != null && params.role.trim() !== "") {
        sp.set("role", params.role.trim());
      }
      if (params?.kyc_status != null && params.kyc_status.trim() !== "") {
        sp.set("kyc_status", params.kyc_status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/users${q ? `?${q}` : ""}`;
    },
    userRoleChangeRequest: (id: string) =>
      `/api/v1/admin/users/${id}/role-change-request`,
    /** 70：用户监管详情；不含 password_hash；须 admin */
    userById: (id: string) =>
      `/api/v1/admin/users/${encodeURIComponent(id)}`,
    /** 向导入驻台账；query **`limit`**（1～500，缺省 100）、**`status`**（向导状态精确匹配） */
    guides: (params?: { limit?: number; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/guides${q ? `?${q}` : ""}`;
    },
    /** 70：向导监管详情，与 `GET /api/v1/admin/guides` 列表行同形；不含护照哈希；须 admin */
    guideById: (id: string) =>
      `/api/v1/admin/guides/${encodeURIComponent(id)}`,
    /** 70：订单监管列表；query **`limit`**（1～500，缺省 100）、**`state`**（与 **`order_state_to_str`** 同形，如 **`draft`**） */
    orders: (params?: { limit?: number; state?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.state != null && params.state.trim() !== "") {
        sp.set("state", params.state.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/orders${q ? `?${q}` : ""}`;
    },
    /** 70：订单监管详情，与 `GET /api/v1/orders/:id` 成功响应同形（含可选 itinerary）；须 admin */
    orderById: (id: string) =>
      `/api/v1/admin/orders/${encodeURIComponent(id)}`,
    financeSummary: "/api/v1/admin/finance/summary",
    /** 200 §3.6：财务摘要 CSV 导出（与 `financeSummary` 同源聚合；`format=csv`） */
    financeSummaryExport: "/api/v1/admin/finance/summary/export?format=csv",
    /** FeeRouter PlatformFeeRouted 投影：summary + items + page；须 DB + admin */
    feeRouterRoutedEvents: "/api/v1/admin/fee-router/routed-events",
    /** Epic C-01：治理/协议多源对拍只读（三槽 + drift_summary）；须 admin */
    crossCheck: "/api/v1/admin/cross-check",
    /** Epic C-01：fee-pool vs protocol-reference 漂移摘要只读；须 admin */
    driftSummary: "/api/v1/admin/drift-summary",
    /** RegionVault RegionVaultForwarded 投影：summary + items + page；须 DB + admin */
    regionVaultForwardedEvents: "/api/v1/admin/region-vault/forwarded-events",
    /** 70：争议运营列表；query **`limit`**（1～500，缺省 100）、**`status`**（与行内 **`status`** 精确匹配） */
    disputes: (params?: { limit?: number; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/disputes${q ? `?${q}` : ""}`;
    },
    /** 70：争议监管详情，与 `GET /api/v1/disputes/:id` 成功响应同形（含 updated_at）；须 admin */
    disputeById: (id: string) =>
      `/api/v1/admin/disputes/${encodeURIComponent(id)}`,
    /** Phase 5：评价列表；query `limit`（1～500，缺省 100）、`min_score`/`max_score`（可选 **i16**） */
    reviews: (params?: { limit?: number; min_score?: number; max_score?: number }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.min_score != null) sp.set("min_score", String(params.min_score));
      if (params?.max_score != null) sp.set("max_score", String(params.max_score));
      const q = sp.toString();
      return `/api/v1/admin/reviews${q ? `?${q}` : ""}`;
    },
    /** 70：单条评价监管详情；DB 优先，与列表同源回退内存；响应含 meta.source */
    reviewById: (id: string) =>
      `/api/v1/admin/reviews/${encodeURIComponent(id)}`,
    /** 管理审计日志；query **`limit`**（1～200，缺省 50）、**`actor_id`**（UUID）、**`action`**、**`resource_type`** */
    auditLogs: (params?: {
      limit?: number;
      actor_id?: string;
      action?: string;
      resource_type?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.actor_id != null && params.actor_id.trim() !== "") {
        sp.set("actor_id", params.actor_id.trim());
      }
      if (params?.action != null && params.action.trim() !== "") {
        sp.set("action", params.action.trim());
      }
      if (params?.resource_type != null && params.resource_type.trim() !== "") {
        sp.set("resource_type", params.resource_type.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/audit-logs${q ? `?${q}` : ""}`;
    },
    /** 单条审计日志；与列表项同形；须 PostgreSQL */
    auditLogById: (id: string) =>
      `/api/v1/admin/audit-logs/${encodeURIComponent(id)}`,
    /** 审批单列表；query **`limit`**（1～200，缺省 50）、**`status`**（omit = 不按状态过滤）；须 DB */
    approvals: (params?: { limit?: number; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/approvals${q ? `?${q}` : ""}`;
    },
    /** 单条审批单只读；与列表项同形；须 PostgreSQL */
    approvalById: (id: string) =>
      `/api/v1/admin/approvals/${encodeURIComponent(id)}`,
    approvalApprove: (id: string) => `/api/v1/admin/approvals/${id}/approve`,
    /** Phase 5：运维快照（chain、indexer、rate_limits） */
    observabilityOverview: "/api/v1/admin/observability/overview",
    /** 120 / 70：运维审计动作最小列表（占位直至导出流水线） */
    /** 120 / 70：运维审计动作占位列表；query **`limit`**（1～200，缺省 50）；**`applied_filters`** 见响应 */
    auditOperations: (params?: { limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      const q = sp.toString();
      return `/api/v1/admin/audit/operations${q ? `?${q}` : ""}`;
    },
    /** 120 / 70：告警 incident 最小读（占位 JSON） */
    alertIncident: (incidentId: string) =>
      `/api/v1/admin/alerts/incidents/${encodeURIComponent(incidentId)}`,
    /** 330 / 70：schema 版本、迁移历史、回滚、回填、双写校验（query limit 1～200，缺省 50） */
    schemaMigrations: (params?: { limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      const q = sp.toString();
      return `/api/v1/admin/schema/migrations${q ? `?${q}` : ""}`;
    },
    /** 110 / 70：索引器健康、finality、checkpoint、lag（须 admin） */
    indexerHealth: "/api/v1/admin/indexer/health",
    /** 110 / 200：对账报告最小只读（`:id` 为 report 标识；完整导出流水线待补） */
    indexerReconcileReport: (id: string) =>
      `/api/v1/admin/indexer/reconcile-report/${encodeURIComponent(id)}`,
    /** 110 / 200：`reconciliation_reports` 分页列表（不含大 summary） */
    indexerReconcileReports: (params?: {
      limit?: number;
      offset?: number;
      report_type?: string;
      chain_id?: string;
      projection_reconcile_clean?: boolean;
      issues_min?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.offset != null) sp.set("offset", String(params.offset));
      if (params?.report_type != null && params.report_type.trim() !== "") {
        sp.set("report_type", params.report_type.trim());
      }
      if (params?.chain_id != null && params.chain_id.trim() !== "") {
        sp.set("chain_id", params.chain_id.trim());
      }
      if (params?.projection_reconcile_clean !== undefined) {
        sp.set("projection_reconcile_clean", params.projection_reconcile_clean ? "true" : "false");
      }
      if (params?.issues_min != null && params.issues_min > 0) {
        sp.set("issues_min", String(params.issues_min));
      }
      const q = sp.toString();
      return `/api/v1/admin/indexer/reconcile-reports${q ? `?${q}` : ""}`;
    },
    /** 200/110：当前列表筛选条件下的对账报告导出（`format=csv` | `json`；`export_scope=all` 忽略 offset，最多 2000 行；与 `indexerReconcileReports` 同筛选键） */
    indexerReconcileReportsExport: (params?: {
      format?: "csv" | "json";
      /** `all`：与当前筛选匹配的全部行（硬上限见 API 文档） */
      exportScope?: "all";
      limit?: number;
      offset?: number;
      report_type?: string;
      chain_id?: string;
      projection_reconcile_clean?: boolean;
      issues_min?: number;
    }) => {
      const sp = new URLSearchParams();
      sp.set("format", params?.format === "json" ? "json" : "csv");
      if (params?.exportScope === "all") {
        sp.set("export_scope", "all");
      }
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.offset != null) sp.set("offset", String(params.offset));
      if (params?.report_type != null && params.report_type.trim() !== "") {
        sp.set("report_type", params.report_type.trim());
      }
      if (params?.chain_id != null && params.chain_id.trim() !== "") {
        sp.set("chain_id", params.chain_id.trim());
      }
      if (params?.projection_reconcile_clean !== undefined) {
        sp.set("projection_reconcile_clean", params.projection_reconcile_clean ? "true" : "false");
      }
      if (params?.issues_min != null && params.issues_min > 0) {
        sp.set("issues_min", String(params.issues_min));
      }
      const q = sp.toString();
      return `/api/v1/admin/indexer/reconcile-reports/export?${q}`;
    },
    /** 340：API 版本兼容台账；query limit 1～200，缺省 50；api_version（ILIKE 子串）、status（planned|active|deprecated|sunset） */
    apiVersions: (params?: { limit?: number; api_version?: string; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.api_version != null && params.api_version.trim() !== "") {
        sp.set("api_version", params.api_version.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/api-versions${q ? `?${q}` : ""}`;
    },
    /** 160：社区举报工单池；query limit、status、reporter_id/target_id（UUID）、target_type/reason_code（ILIKE 子串） */
    communityReports: (params?: {
      limit?: number;
      status?: string;
      reporter_id?: string;
      target_type?: string;
      reason_code?: string;
      target_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.reporter_id != null && params.reporter_id.trim() !== "") {
        sp.set("reporter_id", params.reporter_id.trim());
      }
      if (params?.target_type != null && params.target_type.trim() !== "") {
        sp.set("target_type", params.target_type.trim());
      }
      if (params?.reason_code != null && params.reason_code.trim() !== "") {
        sp.set("reason_code", params.reason_code.trim());
      }
      if (params?.target_id != null && params.target_id.trim() !== "") {
        sp.set("target_id", params.target_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/reports${q ? `?${q}` : ""}`;
    },
    /** 160：申诉台账；query limit、report_id（UUID，可选）、status（pending|accepted|rejected） */
    communityAppeals: (params?: { limit?: number; report_id?: string; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.report_id != null && params.report_id.trim() !== "") {
        sp.set("report_id", params.report_id.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/appeals${q ? `?${q}` : ""}`;
    },
    /** 160：审核审计行；query limit、report_id/actor_id（UUID）、status_before/status_after（ILIKE 子串） */
    communityModerationCases: (params?: {
      limit?: number;
      report_id?: string;
      actor_id?: string;
      status_before?: string;
      status_after?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.report_id != null && params.report_id.trim() !== "") {
        sp.set("report_id", params.report_id.trim());
      }
      if (params?.actor_id != null && params.actor_id.trim() !== "") {
        sp.set("actor_id", params.actor_id.trim());
      }
      if (params?.status_before != null && params.status_before.trim() !== "") {
        sp.set("status_before", params.status_before.trim());
      }
      if (params?.status_after != null && params.status_after.trim() !== "") {
        sp.set("status_after", params.status_after.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/moderation/cases${q ? `?${q}` : ""}`;
    },
    /** 160 §5：风险信号；query limit、subject_user_id（UUID）、signal_type/rule_id/severity（ILIKE 子串） */
    communityRiskSignals: (params?: {
      limit?: number;
      subject_user_id?: string;
      signal_type?: string;
      rule_id?: string;
      severity?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.subject_user_id != null && params.subject_user_id.trim() !== "") {
        sp.set("subject_user_id", params.subject_user_id.trim());
      }
      if (params?.signal_type != null && params.signal_type.trim() !== "") {
        sp.set("signal_type", params.signal_type.trim());
      }
      if (params?.rule_id != null && params.rule_id.trim() !== "") {
        sp.set("rule_id", params.rule_id.trim());
      }
      if (params?.severity != null && params.severity.trim() !== "") {
        sp.set("severity", params.severity.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/risk-signals${q ? `?${q}` : ""}`;
    },
    /** 160 §5：策略变更审计；query limit、scope/summary/source（ILIKE）、actor_id（UUID） */
    communityPolicyChangeLogs: (params?: {
      limit?: number;
      scope?: string;
      summary?: string;
      source?: string;
      actor_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.scope != null && params.scope.trim() !== "") {
        sp.set("scope", params.scope.trim());
      }
      if (params?.summary != null && params.summary.trim() !== "") {
        sp.set("summary", params.summary.trim());
      }
      if (params?.source != null && params.source.trim() !== "") {
        sp.set("source", params.source.trim());
      }
      if (params?.actor_id != null && params.actor_id.trim() !== "") {
        sp.set("actor_id", params.actor_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/policy-change-logs${q ? `?${q}` : ""}`;
    },
    /** 160：Feed 排序快照审计；query limit、feed_mode（ILIKE 子串） */
    communityRankingSnapshots: (params?: { limit?: number; feed_mode?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.feed_mode != null && params.feed_mode.trim() !== "") {
        sp.set("feed_mode", params.feed_mode.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/ranking/snapshots${q ? `?${q}` : ""}`;
    },
    /** 160：处罚台账；query limit、subject_user_id、report_id、status（active|lifted|superseded） */
    communityPenalties: (params?: {
      limit?: number;
      subject_user_id?: string;
      report_id?: string;
      status?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.subject_user_id != null && params.subject_user_id.trim() !== "") {
        sp.set("subject_user_id", params.subject_user_id.trim());
      }
      if (params?.report_id != null && params.report_id.trim() !== "") {
        sp.set("report_id", params.report_id.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/penalties${q ? `?${q}` : ""}`;
    },
    /** 160：审核处置 PATCH；`:id` 为举报 UUID；admin + 幂等键 */
    communityModeration: (reportId: string) =>
      `/api/v1/admin/community/moderation/${encodeURIComponent(reportId)}`,
    /** 160：登记处罚 POST（与 GET 同路径） */
    communityPenaltyCreate: "/api/v1/admin/community/penalties",
    /** 160：评论可见性 PATCH */
    communityCommentVisibility: (commentId: string) =>
      `/api/v1/admin/community/comments/${encodeURIComponent(commentId)}`,
    /** 160 §5：滥用策略补丁 PATCH；super_admin + 幂等键 */
    communityAbusePolicy: "/api/v1/admin/community/abuse-policy",
    /** 160：申诉复核 POST；`:id` 为 appeal UUID；super_admin + 幂等键 */
    communityAppealReview: (appealId: string) =>
      `/api/v1/admin/community/appeals/${encodeURIComponent(appealId)}/review`,
    /** 350：生命周期状态机台账；query limit；machine_code/domain/entity_type/version/source_of_truth（ILIKE 子串）；anomaly_flag（true|false|1|0|yes|no） */
    lifecycleStateMachines: (params?: {
      limit?: number;
      machine_code?: string;
      domain?: string;
      entity_type?: string;
      version?: string;
      source_of_truth?: string;
      anomaly_flag?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.machine_code != null && params.machine_code.trim() !== "") {
        sp.set("machine_code", params.machine_code.trim());
      }
      if (params?.domain != null && params.domain.trim() !== "") {
        sp.set("domain", params.domain.trim());
      }
      if (params?.entity_type != null && params.entity_type.trim() !== "") {
        sp.set("entity_type", params.entity_type.trim());
      }
      if (params?.version != null && params.version.trim() !== "") {
        sp.set("version", params.version.trim());
      }
      if (params?.source_of_truth != null && params.source_of_truth.trim() !== "") {
        sp.set("source_of_truth", params.source_of_truth.trim());
      }
      if (params?.anomaly_flag != null && params.anomaly_flag.trim() !== "") {
        sp.set("anomaly_flag", params.anomaly_flag.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/lifecycle/state-machines${q ? `?${q}` : ""}`;
    },
    /** 70：数据权限策略台账；query limit、policy_code / scope_type / binding_role（ILIKE 子串）、status */
    policies: (params?: {
      limit?: number;
      policy_code?: string;
      status?: string;
      scope_type?: string;
      binding_role?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.policy_code != null && params.policy_code.trim() !== "") {
        sp.set("policy_code", params.policy_code.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.scope_type != null && params.scope_type.trim() !== "") {
        sp.set("scope_type", params.scope_type.trim());
      }
      if (params?.binding_role != null && params.binding_role.trim() !== "") {
        sp.set("binding_role", params.binding_role.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/policies${q ? `?${q}` : ""}`;
    },
    /** 70：策略状态发布；super_admin + 乐观锁 + Idempotency-Key */
    policyPublish: (policyId: string) =>
      `/api/v1/admin/policies/${encodeURIComponent(policyId)}/publish`,
    /** 450 / 170：内部工具执行审计；query limit、tool_id / action_code / actor_id（ILIKE 子串）、approval_request_id（UUID） */
    internalToolAudits: (params?: {
      limit?: number;
      tool_id?: string;
      action_code?: string;
      actor_id?: string;
      approval_request_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.tool_id != null && params.tool_id.trim() !== "") {
        sp.set("tool_id", params.tool_id.trim());
      }
      if (params?.action_code != null && params.action_code.trim() !== "") {
        sp.set("action_code", params.action_code.trim());
      }
      if (params?.actor_id != null && params.actor_id.trim() !== "") {
        sp.set("actor_id", params.actor_id.trim());
      }
      if (params?.approval_request_id != null && params.approval_request_id.trim() !== "") {
        sp.set("approval_request_id", params.approval_request_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/internal-tools/audits${q ? `?${q}` : ""}`;
    },
    /** 270：`media_access_logs` 只读；query limit、action（精确 [A-Za-z0-9_]≤64）、object_id/actor_or_ip（ILIKE 子串）、token_id（UUID 精确） */
    mediaAccessLogs: (params?: {
      limit?: number;
      action?: string;
      object_id?: string;
      actor_or_ip?: string;
      token_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.action != null && params.action.trim() !== "") {
        sp.set("action", params.action.trim());
      }
      if (params?.object_id != null && params.object_id.trim() !== "") {
        sp.set("object_id", params.object_id.trim());
      }
      if (params?.actor_or_ip != null && params.actor_or_ip.trim() !== "") {
        sp.set("actor_or_ip", params.actor_or_ip.trim());
      }
      if (params?.token_id != null && params.token_id.trim() !== "") {
        sp.set("token_id", params.token_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/media/access-logs${q ? `?${q}` : ""}`;
    },
    /** 270：`signed_url_tokens` 只读；query limit、object_id（ILIKE）、url_scope（read|download）、issued_to/token_id（UUID 精确） */
    mediaSignedUrlTokens: (params?: {
      limit?: number;
      object_id?: string;
      url_scope?: string;
      issued_to?: string;
      token_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.object_id != null && params.object_id.trim() !== "") {
        sp.set("object_id", params.object_id.trim());
      }
      if (params?.url_scope != null && params.url_scope.trim() !== "") {
        sp.set("url_scope", params.url_scope.trim());
      }
      if (params?.issued_to != null && params.issued_to.trim() !== "") {
        sp.set("issued_to", params.issued_to.trim());
      }
      if (params?.token_id != null && params.token_id.trim() !== "") {
        sp.set("token_id", params.token_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/media/signed-url-tokens${q ? `?${q}` : ""}`;
    },
    /** 220/240：Feature Flag 台账；query limit、flag_code（子串）、enabled（true|false|1|0|yes|no）、scope */
    flags: (params?: {
      limit?: number;
      flag_code?: string;
      enabled?: string;
      scope?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.flag_code != null && params.flag_code.trim() !== "") {
        sp.set("flag_code", params.flag_code.trim());
      }
      if (params?.enabled != null && params.enabled.trim() !== "") {
        sp.set("enabled", params.enabled.trim());
      }
      if (params?.scope != null && params.scope.trim() !== "") {
        sp.set("scope", params.scope.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/flags${q ? `?${q}` : ""}`;
    },
    /** 240 / 70：Flag 发布；super_admin + 乐观锁 + Idempotency-Key */
    flagPublish: (flagId: string) => `/api/v1/admin/flags/${encodeURIComponent(flagId)}/publish`,
    /** 250：异步任务队列；query limit、status（pending|running|completed|failed|dead_letter|cancelled） */
    jobs: (params?: { limit?: number; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/jobs${q ? `?${q}` : ""}`;
    },
    /** 220：配置发布登记；query limit、release_key、status（draft|published|rolled_back） */
    configReleases: (params?: { limit?: number; release_key?: string; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.release_key != null && params.release_key.trim() !== "") {
        sp.set("release_key", params.release_key.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/config/releases${q ? `?${q}` : ""}`;
    },
    /** 220：单条 config_releases 只读（UUID） */
    configRelease: (id: string) =>
      `/api/v1/admin/config/releases/${encodeURIComponent(id)}`,
    /** 70 / 230：Secret 元数据（永不返回明文）；query limit、key_alias（子串）、status、env_scope */
    secretsMetadata: (params?: {
      limit?: number;
      key_alias?: string;
      status?: string;
      env_scope?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.key_alias != null && params.key_alias.trim() !== "") {
        sp.set("key_alias", params.key_alias.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.env_scope != null && params.env_scope.trim() !== "") {
        sp.set("env_scope", params.env_scope.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/secrets/metadata${q ? `?${q}` : ""}`;
    },
    /** 260：调度运行记录；query limit、job_code（可选） */
    schedulerJobs: (params?: { limit?: number; job_code?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.job_code != null && params.job_code.trim() !== "") {
        sp.set("job_code", params.job_code.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/scheduler/jobs${q ? `?${q}` : ""}`;
    },
    /** 260：手工补跑登记 queued；super_admin + Idempotency-Key；job_code 路径段须 URL 安全字符 */
    schedulerJobRerun: (jobCode: string) =>
      `/api/v1/admin/scheduler/jobs/${encodeURIComponent(jobCode)}/rerun`,
    /** 320 / 70：多租户区域作用域台账；query limit、tenant_key/region_code（ILIKE 子串）、status、scope_class */
    tenantScopes: (params?: {
      limit?: number;
      tenant_key?: string;
      region_code?: string;
      status?: string;
      scope_class?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.tenant_key != null && params.tenant_key.trim() !== "") {
        sp.set("tenant_key", params.tenant_key.trim());
      }
      if (params?.region_code != null && params.region_code.trim() !== "") {
        sp.set("region_code", params.region_code.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.scope_class != null && params.scope_class.trim() !== "") {
        sp.set("scope_class", params.scope_class.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/tenants/scopes${q ? `?${q}` : ""}`;
    },
    /** 500：DSAR 请求台账；query limit、request_ref/subject_id/jurisdiction（ILIKE 子串）、request_type（export|erasure）、status（open|in_progress|completed|rejected|cancelled） */
    complianceDataRequests: (params?: {
      limit?: number;
      request_ref?: string;
      subject_id?: string;
      request_type?: string;
      status?: string;
      jurisdiction?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.request_ref != null && params.request_ref.trim() !== "") {
        sp.set("request_ref", params.request_ref.trim());
      }
      if (params?.subject_id != null && params.subject_id.trim() !== "") {
        sp.set("subject_id", params.subject_id.trim());
      }
      if (params?.request_type != null && params.request_type.trim() !== "") {
        sp.set("request_type", params.request_type.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.jurisdiction != null && params.jurisdiction.trim() !== "") {
        sp.set("jurisdiction", params.jurisdiction.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/compliance/data-requests${q ? `?${q}` : ""}`;
    },
    /** 500：DSAR 事件轴；`:request_id` 为 UUID */
    complianceDataRequestEvents: (
      requestId: string,
      params?: { limit?: number; event_type?: string },
    ) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.event_type != null && params.event_type.trim() !== "") {
        sp.set("event_type", params.event_type.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/compliance/data-requests/${encodeURIComponent(requestId)}/events${q ? `?${q}` : ""}`;
    },
    /** 320 / 70：作用域状态发布；super_admin + 乐观锁 + Idempotency-Key */
    tenantScopePublish: (scopeId: string) =>
      `/api/v1/admin/tenants/scopes/${encodeURIComponent(scopeId)}/publish`,
    /** 500：DSAR 更新 + 事件；super_admin + 乐观锁 + Idempotency-Key */
    complianceDataRequestUpdate: (requestId: string) =>
      `/api/v1/admin/compliance/data-requests/${encodeURIComponent(requestId)}/update`,
  },

  /** 50-O-31 / 51-31-9 社区（有 DB 时后端真实数据；31 附录 §11、§7） */
  community: {
    feed: "/api/v1/community/feed",
    /** 31 §2.1：话题下公开帖子总数 */
    statsPostsByTag: "/api/v1/community/stats/posts-by-tag",
    posts: "/api/v1/community/posts",
    postById: (id: string) => `/api/v1/community/posts/${id}`,
    postLike: (postId: string) => `/api/v1/community/posts/${postId}/like`,
    postComments: (postId: string) => `/api/v1/community/posts/${postId}/comments`,
    conversations: "/api/v1/community/conversations",
    conversationMessages: (id: string) =>
      `/api/v1/community/conversations/${id}/messages`,
    /** 指定用户公开帖子（游标分页） */
    userPosts: (userId: string) => `/api/v1/community/users/${userId}/posts`,
    userFollow: (userId: string) => `/api/v1/community/users/${userId}/follow`,
    meFollowing: "/api/v1/community/me/following",
    meFollowers: "/api/v1/community/me/followers",
    meLikesReceived: "/api/v1/community/me/likes-received",
    friendsRequest: "/api/v1/community/friends/request",
    friendsAccept: "/api/v1/community/friends/accept",
    friendsReject: "/api/v1/community/friends/reject",
    friendsList: "/api/v1/community/friends/list",
    friendsRequests: "/api/v1/community/friends/requests",
    friendsRequestsSent: "/api/v1/community/friends/requests/sent",
    postCollect: (postId: string) =>
      `/api/v1/community/posts/${postId}/collect`,
    meCollects: "/api/v1/community/me/collects",
    mePosts: "/api/v1/community/me/posts",
    meReports: "/api/v1/community/me/reports",
    /** 55-S10 / 54-S19 反馈/建议 */
    feedback: "/api/v1/community/feedback",
    /** 160：社区举报 */
    reports: "/api/v1/community/reports",
    reportById: (id: string) => `/api/v1/community/reports/${id}`,
    reportAppeals: (id: string) => `/api/v1/community/reports/${id}/appeals`,
  },
} as const;

/** 完整 URL（base + path）。浏览器 + loopback 基址时返回「当前页 origin + path」（须配合 `next.config.js` rewrites）。 */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (isLoopbackApiBase(BASE)) {
    const same = sameOriginApiPathInBrowser(p);
    if (same != null) return same;
  }
  return `${BASE}${p}`;
}
