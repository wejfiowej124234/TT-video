# TT · Data Truth Matrix（Pack 04 · LATEST）

**STATUS:** `PACK04_DATA_TRUTH_DEEPENED`  
**Stamp:** `2026-08-18`  
**Machine:** [`registry/data-truth-matrix.v1.yaml`](../../registry/data-truth-matrix.v1.yaml)  
**Overlay:** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)  
**Gate:** `python scripts/dev/check-data-truth-matrix.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`M4_SHALLOW_ROW`:** **0** · **`M4_UNRESOLVED_STORAGE`:** **0** · **`M4_AMBIGUOUS_SSOT`:** **0** · **`UNEXPLAINED_DATA_PROJECTION`:** **0**  
**本波 STOP：** Pack 04 CLOSED。Pack 06 为后续独立波；本包不重开。  
**禁止：** deploy / schedule / execute / cutover / 真钱 · 用 `/meta`、Indexer、PG 改 FTB 或反向覆盖链上 · 把 CI-02 / PM $25 并进本包

Pack **03** / **05** 已闭合，只读引用。FTB `20260812` 是锁表。  
**硬规则：** L7 链上状态 ≠ L8 Indexer 投影 ≠ PostgreSQL 业务表 ≠ CMS/对象元数据。  
`ChainOffStore` 是启动时从 PG hydrate 的内存缓存，**不是**物理表。

---

## 0 · 分层（写死）

| 层 | 真源 | 本包代表行 |
|----|------|------------|
| **L7** | 主网 receipt / EIP-1967 | `DATA-ESCROW-CHAIN` · `DATA-PM-PRICE-LIVE` |
| **L8** | Indexer checkpoint · Official `/meta` | `DATA-ESCROW-PROJECTION` · `DATA-PRODUCTION-IDENTITY` |
| **PG L6** | `crates/api/migrations` 真实表 | 其余业务行 |
| **Object** | S3 兼容桶（Staging：Fly Tigris · `COMMUNITY_MEDIA_S3_*`） | `DATA-MEDIA-OBJECT` |
| **Registry 叙事** | 未落地 chrome / LEGACY 目标 | `DATA-PM-PRICE-TARGET`（$25 LEGACY · CI-02 hop B 不在本波 execute） |

活投影只允许 **L7 → L8**。禁止 L8/PG/`/meta` 回写链上或 FTB。

---

## 1 · 23 Data ID（物理存储已钉死）

| Data ID | Physical storage | Status | 曾用模糊名 → 现名 |
|---------|------------------|--------|-------------------|
| DATA-USER-ACCOUNT | `users` | PG_AUTHORITATIVE | — |
| DATA-SESSION | `sessions` | HTTPONLY_COOKIE | 历史 localStorage 副本 SUPERSEDED；www HttpOnly |
| DATA-ITINERARY-DRAFT | `itinerary_custom_drafts` | PG_AUTHORITATIVE | — |
| DATA-ITINERARY-GENERATED | **`itineraries`** | PG_AUTHORITATIVE | ~~chain_off store~~ → 表 `itineraries`；`ChainOffStore` 仅缓存 |
| DATA-GUIDE-PROFILE | `guides` | PG_AUTHORITATIVE | — |
| DATA-GUIDE-STAKE-DB | `guides.stake_amount` | PG_AUTHORITATIVE | **≠** L7；`/meta.guide_staking_address=null` |
| DATA-ORDER | `orders` | PG_AUTHORITATIVE | ≠ escrow receipt |
| DATA-ORDER-MESSAGE | `order_messages` | PG_AUTHORITATIVE | ≠ Community DM |
| DATA-COMMUNITY-DM | `community_conversations` · **`community_dm_messages`** · `community_dm_read_state` | PG_AUTHORITATIVE | ~~Community DM tables~~ |
| DATA-COMMUNITY-POST | `community_posts` | PG_AUTHORITATIVE | feed ≠ DM |
| DATA-MEDIA-OBJECT | `community_media_assets` · `platform_media_assets` · `catalog_media_assets` + `COMMUNITY_MEDIA_S3_BUCKET` | OBJECT_STORE_BYTES | 字节在对象存储；PG 只存元数据；`storage_backend` ∈ tigris\|r2\|minio_local\|bake_dr |
| DATA-CMS-ANNOUNCEMENT | `cms_public_announcements` | PG_AUTHORITATIVE | 无静态 fallback |
| DATA-CATALOG-GEO | `catalog_countries` · `catalog_cities` | COMPILE_OR_CATALOG | flag 关则 core `product_countries` |
| DATA-DISPUTE | `disputes` | PG_AUTHORITATIVE | ≠ L7 resolve tx |
| DATA-DID-RANK | `orders`+`reviews`+`community_penalties`；`did_rank_rank_snapshots` 是缓存 | PG_DERIVED | — |
| DATA-ONBOARDING-ENTITLEMENT | `onboarding_entitlements` · `onboarding_payment_events` | PG_AUTHORITATIVE | Fiat 正交 |
| DATA-PROVIDER-APPLICATION | **`role_applications`** · `role_documents` | PG_AUTHORITATIVE | ~~provider / role_applications~~；**无** `provider_applications` 表 |
| DATA-REFERRAL | `referral_codes` · `referral_events` · `growth_point_ledger` | PG_AUTHORITATIVE | ~~growth tables~~ |
| DATA-ESCROW-CHAIN | `ethereum_mainnet` Wired `0xEE0BE3` → SR-FT | L7_CHAIN | 禁止用 FTB 锁表当活指针 |
| DATA-ESCROW-PROJECTION | `event_log` · `checkpoints_sharded` · **`orders_projection`** · `escrow_settlement_projection` | L8_INDEXER_PROJECTION | 链成功 ≠ 本行已更新 |
| DATA-PM-PRICE-LIVE | Official `/meta` NEW PM `0x882Ad` `100_000` · www chrome GOV-04 `1e18` ED | L7_CHAIN | quote 401 无 Bearer |
| DATA-PM-PRICE-TARGET | Registry 叙事 · Pack 05 `$25` LEGACY · www chrome 10→10 ED | REGISTRY_NARRATIVE | 禁止标成 live |
| DATA-PRODUCTION-IDENTITY | Official `GET /meta` | META_RUNTIME_IDENTITY | 禁止用 `/meta` 改 FTB |

写入者 = `producer`。读取者 = `consumer`。缓存/派生 = `cache_or_derived`。失效恢复 = `invalidate_recover`（hydrate / indexer replay / HeadBucket；**从不**回写 L7）。

---

## 2 · 本波边界

- Pack **03** / **05** CLOSED，只读。  
- Pack 06 Money Lifecycle 为后续独立波；本包不重开。  
- CI-02 NEW FeeRouter 与 PM $25 **各自独立梯子**（$25 = LEGACY；剩余 WAIT = hop B + www chrome bake），不与 Pack 04 合并。  
- `UNEXPLAINED_DATA_PROJECTION=0`：活边仅 L7→L8；禁止投影改链、DB stake 冒充 L7、目标价冒充 live。

① Pack 04 地图加深 ≠ ② staging GO ≠ ③ Production GO。
