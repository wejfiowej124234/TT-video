/**
 * HTTP 路径常量表（与 04 §三、crates/api 一致）。
 * 由 `lib/api.ts` 统一 re-export；契约见 docs/spec/14、04。
 */


import { routesAdmin } from "./routesAdmin";
import { routesCommunity } from "./routesCommunity";

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
    /** C-GOV-004：Governor+PG 投影 sentinel 或重置链下 MVP 治理内存（须 `SEED_TEST_ACCOUNTS=1`） */
    seedGovernanceE2e: "/auth/seed-governance-e2e",
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    verifyEmail: "/auth/verify-email",
    registerSendVerificationCode: "/auth/register/send-verification-code",
    resendVerificationEmail: "/auth/resend-verification-email",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  /** 96-18 准入费（`lib/apiClient/onboarding/` barrel；与 `GET/POST /api/v1/onboarding/*` 同源） */
  onboardingQuote: "/api/v1/onboarding/quote",
  onboardingEntitlementsMe: "/api/v1/onboarding/entitlements/me",
  onboardingPaymentIntents: "/api/v1/onboarding/payment-intents",
  onboardingRoleConfirm: "/api/v1/onboarding/role-confirm",
  /** ① 本地：`TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` + PG；模拟 webhook 标 paid */
  onboardingLocalDevMarkPaid: "/api/v1/onboarding/local-dev/mark-paid",

  /** 个人中心 */
  me: "/api/v1/me",
  meStats: "/api/v1/me/stats",
  mePassword: "/api/v1/me/password",
  meWalletVerifyChallenge: "/api/v1/me/wallet/verify/challenge",
  meWalletVerifyConfirm: "/api/v1/me/wallet/verify/confirm",
  meWalletVerificationStatus: "/api/v1/me/wallet/verification-status",
  meGuideRegistrationDraft: "/api/v1/me/guide-registration-draft",
  meProviderRegistrationDraft: "/api/v1/me/provider-registration-draft",
  meProviderApplication: "/api/v1/me/provider-application",
  meStewardApplication: "/api/v1/me/steward-application",
  providerApplications: "/api/v1/provider-applications",
  stewardApplications: "/api/v1/steward/applications",
  stewardStakeQuote: "/api/v1/steward/stake-quote",
  stewardStakeStatus: "/api/v1/steward/stake-status",
  redemptionQuote: "/api/v1/redemption/quote",
  adminProviderApplications: "/api/v1/admin/provider-applications",
  adminStewardApplications: "/api/v1/admin/steward-applications",
  adminStewardApplication: (userId: string) =>
    `/api/v1/admin/users/${encodeURIComponent(userId)}/steward-application`,
  adminStewardApplicationReview: (userId: string) =>
    `/api/v1/admin/users/${encodeURIComponent(userId)}/steward-application-review`,
  adminProviderApplication: (userId: string) =>
    `/api/v1/admin/users/${encodeURIComponent(userId)}/provider-application`,
  adminProviderApplicationReview: (userId: string) =>
    `/api/v1/admin/users/${encodeURIComponent(userId)}/provider-application-review`,
  adminUserAcquisitionPublishSuspend: (userId: string) =>
    `/api/v1/admin/users/${encodeURIComponent(userId)}/acquisition-publish-suspend`,
  /** F-007：本机/允许路径下 **`content_base64`** 头像；对象存储环境须 presign（见 `me.rs`） */
  meProfileAvatar: "/api/v1/me/profile-avatar",
  meProfileAvatarPresign: "/api/v1/me/profile-avatar/presign",
  meProfileAvatarCommit: "/api/v1/me/profile-avatar/commit",
  /** PD-004 · ①.5：多钱包列表（主钱包 `is_primary`） */
  meWallets: "/api/v1/me/wallets",
  /** PD-007 · ①.5：`role_applications` SSOT 状态 */
  meRoleApplications: "/api/v1/me/role-applications",
  /** 账户安全（会话 / 通知；与 `/me/security` 页对读；后端挂载须与 04 同批闭合） */
  meSessions: "/api/v1/me/sessions",
  meSecurityNotifications: (params?: { limit?: number; status?: string; event_type?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.status) q.set("status", params.status);
    if (params?.event_type) q.set("event_type", params.event_type);
    const qs = q.toString();
    return `/api/v1/me/security-notifications${qs ? `?${qs}` : ""}`;
  },
  meSessionCurrent: "/api/v1/me/sessions/current",
  meSessionBySuffix: (suffix: string) => `/api/v1/me/sessions/${encodeURIComponent(suffix)}`,
  /** 自由市场星标（`market_travel_bookmarks`；与 `lib/apiClient/marketTravelBookmarks/` barrel 同源） */
  meMarketBookmarks: "/api/v1/me/market-bookmarks",
  meMarketBookmarkByTarget: (targetType: "order" | "guide", targetId: string) =>
    `/api/v1/me/market-bookmarks/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`,

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
  /** 49 A 创作台草稿 PG（与 `POST|GET …/itineraries/custom/drafts*`、93 D-ITN-003 对读） */
  itinerariesCustomDrafts: "/api/v1/itineraries/custom/drafts",
  itinerariesCustomDraftById: (id: string) =>
    `/api/v1/itineraries/custom/drafts/${encodeURIComponent(id)}`,

  /** P16/17 ② 自由市场列表数据源（HTTP 路径保留 discover；页面主入口 `/market`，见 04 §3.4） */
  discoverOrders: "/api/v1/discover/orders",

  /** 94 自由市场子站（`crates/api/src/routes/market_subsite/`；与 `lib/apiClient/marketSubsite/` 同源） */
  marketProviderListings: "/api/v1/market/provider/listings",
  marketAcquisitionListings: "/api/v1/market/acquisition/listings",
  marketProviderListingById: (id: string) =>
    `/api/v1/market/provider/listings/${encodeURIComponent(id)}`,
  marketAcquisitionListingById: (id: string) =>
    `/api/v1/market/acquisition/listings/${encodeURIComponent(id)}`,
  /** `POST` body：**`{ "payload": object }`**（`market_subsite` **`market_listing_draft_payload_from_body`**；**`apiClient/marketSubsite`** 封装）。 */
  marketProviderListingDrafts: "/api/v1/market/provider/listings/drafts",
  marketAcquisitionListingDrafts: "/api/v1/market/acquisition/listings/drafts",
  marketProviderListingDraftById: (draftId: string) =>
    `/api/v1/market/provider/listings/drafts/${encodeURIComponent(draftId)}`,
  marketAcquisitionListingDraftById: (draftId: string) =>
    `/api/v1/market/acquisition/listings/drafts/${encodeURIComponent(draftId)}`,
  marketProviderListingOrderById: (id: string) =>
    `/api/v1/market/provider/listings/${encodeURIComponent(id)}/orders`,
  marketAcquisitionListingOrderById: (id: string) =>
    `/api/v1/market/acquisition/listings/${encodeURIComponent(id)}/orders`,

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
  /** 草稿订单选定向导（PATCH；仅 tourist、未分配 guide_id） */
  orderPatchGuide: (id: string) => `/api/v1/orders/${id}/guide`,
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
  /** B-191：`/traveltrust` 只读机读锚（04 §3.3 / §3.4；与 governance protocol-reference `doc_version` 同源） */
  traveltrustPageBrief: "/api/v1/traveltrust/page-brief",
  /** P-SCALE1：信任增长外部化（traveltrust-api + Postgres；多实例一致） */
  trustGrowthIngest: "/api/v1/trust-growth/ingest",
  trustGrowthConfig: "/api/v1/trust-growth/config",

  /** 96-18：稳定币→TTG 报价机读（① 合同面；与 page-brief `liquidity_contract.quote_path` 同源） */
  governanceTtgExchangeQuote: "/api/v1/governance/ttg-exchange/quote",
  /** Protocol Convergence P2：生命周期状态机只读（steward_application · country_pool_redemption 等） */
  governanceStateMachines: "/api/v1/governance/state-machines",
  /** 84 文档镜像（非链上 FeeRouter）；响应头 X-Implementation-Status: doc-reference */
  governanceProtocolReference: "/api/v1/governance/protocol-reference",
  /** 待生效参数包（默认与上同形；可选 PROTOCOL_REFERENCE_PENDING_OVERLAY 深度合并）；头 doc-reference-pending */
  governanceProtocolReferencePending: "/api/v1/governance/protocol-reference/pending",
  admin: routesAdmin,
  community: routesCommunity,
} as const;

/** @deprecated 渐进迁移：新代码请 `import { routes }`；与历史 `API_ROUTES` 消费方同源 */
export const API_ROUTES = routes;
