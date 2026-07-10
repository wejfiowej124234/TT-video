# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```
nt,
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
12 |     select_governed_public_market_listing_by_id, GOVERNED_DISCOVER_ORDERS_VIEW,
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
13 |     GOVERNED_MARKET_GUIDES_VIEW, GOVERNED_MARKET_LISTINGS_VIEW, MARKET_GUIDES_SURFACE,
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^
14 |     market_listing_surface_key,
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: unused imports: `cmp_public_display_sort`, `dedupe_guides_latest_per_user`, `infer_market_listing_data_origin`, `is_dev_catalog_email`, `is_dev_market_listing_payload`, `is_non_production_market_listing`, and `public_catalog_surface_filter_enabled`
  --> crates\api\src\pcp\market_builder.rs:19:5
   |
19 |     cmp_public_display_sort, dedupe_guides_latest_per_user, infer_market_listing_data_origin,
   |     ^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
20 |     is_dev_catalog_email, is_dev_market_listing_payload, is_non_production_market_listing,
   |     ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
21 |     public_catalog_surface_filter_enabled,
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: unused imports: `ConsumerColdStartCampaign`, `ConsumerColdStartItem`, `GOVERNED_CAMPAIGN_ITEMS_VIEW`, `GOVERNED_CAMPAIGN_SURFACES_VIEW`, `SURFACE_COMMUNITY_FEED`, `SURFACE_HOME_HERO`, `SURFACE_MARKET_FEED`, and `get_governed_campaign_for_surface`
  --> crates\api\src\pcp\campaign_builder.rs:10:5
   |
10 |     get_governed_campaign_for_surface, ConsumerColdStartCampaign, ConsumerColdStartItem,
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^
11 |     GOVERNED_CAMPAIGN_ITEMS_VIEW, GOVERNED_CAMPAIGN_SURFACES_VIEW, SURFACE_COMMUNITY_FEED,
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^
12 |     SURFACE_HOME_HERO, SURFACE_MARKET_FEED,
   |     ^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^

warning: unused import: `crate::chain`
  --> crates\api\src\routes\orders\mod.rs:17:5
   |
17 | use crate::chain;
   |     ^^^^^^^^^^^^

warning: unused import: `stripe_onboarding_runtime_profile`
  --> crates\api\src\stripe_onboarding\mod.rs:24:70
   |
24 | pub use config::{stripe_checkout_enabled, stripe_onboarding_enabled, stripe_onboarding_runtime_profile};
   |                                                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: unused import: `signature::build_stripe_webhook_signature_header`
  --> crates\api\src\stripe_onboarding\mod.rs:27:16
   |
27 | pub(crate) use signature::build_stripe_webhook_signature_header;
   |                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: variable does not need to be mutable
   --> crates\api\src\chain_off\market_public_surface.rs:588:13
    |
588 |         let mut store = ChainOffStore::default();
    |             ----^^^^^
    |             |
    |             help: remove this `mut`
    |
    = note: `#[warn(unused_mut)]` (part of `#[warn(unused)]`) on by default

warning: type `PublishQueueQuery` is more private than the item `get_admin_public_operations_publish_queue`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:188:1
    |
188 | / pub async fn get_admin_public_operations_publish_queue(
189 | |     State(state): State<ApiMetaState>,
190 | |     headers: HeaderMap,
191 | |     Query(q): Query<PublishQueueQuery>,
192 | | ) -> impl IntoResponse {
    | |______________________^ function `get_admin_public_operations_publish_queue` is reachable at visibility `pub(in crate::routes::admin)`
    |
note: but type `PublishQueueQuery` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:21:1
    |
 21 | struct PublishQueueQuery {
    | ^^^^^^^^^^^^^^^^^^^^^^^^
    = note: `#[warn(private_interfaces)]` on by default

warning: type `FeaturedBody` is more private than the item `patch_admin_public_operations_featured`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:247:1
    |
247 | / pub async fn patch_admin_public_operations_featured(
248 | |     State(state): State<ApiMetaState>,
249 | |     headers: HeaderMap,
250 | |     Path((entity_type, id)): Path<(String, Uuid)>,
251 | |     Json(body): Json<FeaturedBody>,
252 | | ) -> impl IntoResponse {
    | |______________________^ function `patch_admin_public_operations_featured` is reachable at visibility `pub(in crate::routes::admin)`
    |
note: but type `FeaturedBody` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:29:1
    |
 29 | struct FeaturedBody {
    | ^^^^^^^^^^^^^^^^^^^

warning: type `PriorityBody` is more private than the item `patch_admin_public_operations_priority`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:314:1
    |
314 | / pub async fn patch_admin_public_operations_priority(
315 | |     State(state): State<ApiMetaState>,
316 | |     headers: HeaderMap,
317 | |     Path((entity_type, id)): Path<(String, Uuid)>,
318 | |     Json(body): Json<PriorityBody>,
319 | | ) -> impl IntoResponse {
    | |______________________^ function `patch_admin_public_operations_priority` is reachable at visibility `pub(in crate::routes::admin)`
    |
note: but type `PriorityBody` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:34:1
    |
 34 | struct PriorityBody {
    | ^^^^^^^^^^^^^^^^^^^

warning: type `SurfacesBody` is more private than the item `patch_admin_public_operations_surfaces`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:379:1
    |
379 | / pub async fn patch_admin_public_operations_surfaces(
380 | |     State(state): State<ApiMetaState>,
381 | |     headers: HeaderMap,
382 | |     Path((entity_type, id)): Path<(String, Uuid)>,
383 | |     Json(body): Json<SurfacesBody>,
384 | | ) -> impl IntoResponse {
    | |______________________^ function `patch_admin_public_operations_surfaces` is reachable at visibility `pub(in crate::routes::admin)`
    |
note: but type `SurfacesBody` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:39:1
    |
 39 | struct SurfacesBody {
    | ^^^^^^^^^^^^^^^^^^^

warning: type `ScheduleBody` is more private than the item `patch_admin_public_operations_schedule`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:443:1
    |
443 | / pub async fn patch_admin_public_operations_schedule(
444 | |     State(state): State<ApiMetaState>,
445 | |     headers: HeaderMap,
446 | |     Path((entity_type, id)): Path<(String, Uuid)>,
447 | |     Json(body): Json<ScheduleBody>,
448 | | ) -> impl IntoResponse {
    | |______________________^ function `patch_admin_public_operations_schedule` is reachable at visibility `pub(in crate::routes::admin)`
    |
note: but type `ScheduleBody` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:44:1
    |
 44 | struct ScheduleBody {
    | ^^^^^^^^^^^^^^^^^^^

warning: type `PreviewQuery` is more private than the item `get_admin_public_operations_preview`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:525:1
    |
525 | / pub async fn get_admin_public_operations_preview(
526 | |     State(state): State<ApiMetaState>,
527 | |     headers: HeaderMap,
528 | |     Path((entity_type, id)): Path<(String, Uuid)>,
529 | |     Query(q): Query<PreviewQuery>,
530 | | ) -> impl IntoResponse {
    | |______________________^ function `get_admin_public_operations_preview` is reachable at visibility `pub(in crate::routes::admin)`
    |
note: but type `PreviewQuery` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:50:1
    |
 50 | struct PreviewQuery {
    | ^^^^^^^^^^^^^^^^^^^

warning: type `PolicyPatchBody` is more private than the item `patch_admin_public_operations_policy`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:682:1
    |
682 | / pub async fn patch_admin_public_operations_policy(
683 | |     State(state): State<ApiMetaState>,
684 | |     headers: HeaderMap,
685 | |     Json(body): Json<PolicyPatchBody>,
686 | | ) -> impl IntoResponse {
    | |______________________^ function `patch_admin_public_operations_policy` is reachable at visibility `pub(in crate::routes::admin)`
    |
note: but type `PolicyPatchBody` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:56:1
    |
 56 | struct PolicyPatchBody {
    | ^^^^^^^^^^^^^^^^^^^^^^

warning: type `HistoryQuery` is more private than the item `get_admin_public_operations_history`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:753:1
    |
753 | / pub async fn get_admin_public_operations_history(
754 | |     State(state): State<ApiMetaState>,
755 | |     headers: HeaderMap,
756 | |     Query(q): Query<HistoryQuery>,
757 | | ) -> impl IntoResponse {
    | |______________________^ function `get_admin_public_operations_history` is reachable at visibility `pub(in crate::routes::admin)`
    |
note: but type `HistoryQuery` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\admin\admin_official_public_operations_http.rs:62:1
    |
 62 | struct HistoryQuery {
    | ^^^^^^^^^^^^^^^^^^^

warning: type `CustomDraftPostBody` is more private than the item `itinerary_custom_draft_create`
   --> crates\api\src\routes\itineraries.rs:98:1
    |
 98 | / pub async fn itinerary_custom_draft_create(
 99 | |     State(state): State<ApiMetaState>,
100 | |     headers: HeaderMap,
101 | |     Json(body): Json<CustomDraftPostBody>,
102 | | ) -> impl IntoResponse {
    | |______________________^ function `itinerary_custom_draft_create` is reachable at visibility `pub(in crate::routes)`
    |
note: but type `CustomDraftPostBody` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\itineraries.rs:93:1
    |
 93 | struct CustomDraftPostBody {
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: `traveltrust-api` (bin "traveltrust-api" test) generated 17 warnings (run `cargo fix --bin "traveltrust-api" --tests` to apply 8 suggestions)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\vacancy_indexer_lib.rs (target\debug\deps\traveltrust_vacancy_indexer-f4bfef5bff4e93af.exe)
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-a4ade982a8ceea95.exe)
[growth_observer] awarded user_id=9e42cfc0-648c-470c-a9cb-9c39f2a62b2c source=first_post points=50 key=first_post:9e42cfc0-648c-470c-a9cb-9c39f2a62b2c:2c9779dc-ceac-4dc8-8c96-e5b2e245f389
[req] x-request-id=38bb6632-9176-4bfc-a5eb-42237c221bfe path=/api/v1/community/posts status=200
[req] x-message-id=7df5d119-e149-4711-8cbd-7845669c860c path=/api/v1/community/posts status=200
[req] x-request-id=bd16e503-1fc0-4f5b-9bc4-1bb4a0db14f1 path=/api/v1/community/posts/2c9779dc-ceac-4dc8-8c96-e5b2e245f389/like status=200
[req] x-message-id=8a97f252-5272-432a-bb41-1e3d26f1e8e2 path=/api/v1/community/posts/2c9779dc-ceac-4dc8-8c96-e5b2e245f389/like status=200
[req] x-request-id=960d2489-3c62-4625-bf8b-3c06587ceeae path=/api/v1/community/posts/2c9779dc-ceac-4dc8-8c96-e5b2e245f389/like status=200
[req] x-message-id=5c5a3b14-a04a-45af-8c46-10adbd41fd95 path=/api/v1/community/posts/2c9779dc-ceac-4dc8-8c96-e5b2e245f389/like status=200
[req] x-request-id=0d619ee2-322d-4e93-b796-c6fd6b712eca path=/api/v1/community/posts/2c9779dc-ceac-4dc8-8c96-e5b2e245f389/like status=200
[req] x-message-id=5498d99e-d3da-4c91-a541-f24a18b687d0 path=/api/v1/community/posts/2c9779dc-ceac-4dc8-8c96-e5b2e245f389/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
