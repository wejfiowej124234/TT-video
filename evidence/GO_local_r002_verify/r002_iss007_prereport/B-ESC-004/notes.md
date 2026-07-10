# B-ESC-004

`cargo test -p traveltrust-api matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg` exit=0

```
^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
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
[req] x-request-id=acafec87-0e20-435c-bf6b-cba79aabb521 path=/auth/register status=200
[req] x-message-id=f2df441e-e7f6-4873-a899-1d3a69d9d225 path=/auth/register status=200
[req] x-request-id=549fb015-9a3a-4792-b774-3f95c5337361 path=/auth/register status=200
[req] x-message-id=35eb1db0-b29a-4ded-ae6c-dbe102898029 path=/auth/register status=200
[req] x-request-id=5486e635-a9c9-4eca-bd00-408f3255e9d5 path=/api/v1/guides status=200
[req] x-message-id=5227ff29-f390-4090-9af5-0e996c75fde6 path=/api/v1/guides status=200
[req] x-request-id=5651c938-e4d2-4c84-9070-012aea425e52 path=/api/v1/guides/dc963726-aec8-4a39-951b-2594b18376f3/stake status=200
[req] x-message-id=90711546-90a1-49c2-b0c4-253de451ab04 path=/api/v1/guides/dc963726-aec8-4a39-951b-2594b18376f3/stake status=200
[req] x-request-id=dd853854-033f-492c-b752-e631cb8c1c05 path=/api/v1/orders status=200
[req] x-message-id=a2ba612f-a9bc-489b-9571-bc6413b5b1ca path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=ca8b0989-3780-49dd-aa36-640d91998ec3 order_id=35fdfc36-b7bb-4114-a31f-700c331735d2
[req] x-request-id=fae80b0b-3d63-4bd9-aead-0897b1a1fd46 path=/api/v1/orders/35fdfc36-b7bb-4114-a31f-700c331735d2/accept status=200
[req] x-message-id=395c8b11-9f07-409c-940a-3191e91da6e7 path=/api/v1/orders/35fdfc36-b7bb-4114-a31f-700c331735d2/accept status=200
[req] x-request-id=07b4f64c-b281-4a7e-a95f-e8856a05d52c path=/api/v1/orders/35fdfc36-b7bb-4114-a31f-700c331735d2/mock-pay status=200
[req] x-message-id=259640d3-8329-44d0-a9b8-464764d21e0b path=/api/v1/orders/35fdfc36-b7bb-4114-a31f-700c331735d2/mock-pay status=200
[req] x-request-id=e0af0861-23a5-43a4-8ffb-70452c942ab3 path=/api/v1/orders/35fdfc36-b7bb-4114-a31f-700c331735d2 status=200
[req] x-message-id=4c40ba5a-dc99-42a6-aeb1-1f128d6299f0 path=/api/v1/orders/35fdfc36-b7bb-4114-a31f-700c331735d2 status=200
[req] x-request-id=9134186a-03c3-4f15-ad42-c84e7544af87 path=/api/v1/orders/35fdfc36-b7bb-4114-a31f-700c331735d2/chain-sync-status status=200
[req] x-message-id=1a6682c6-103e-4aea-8c3a-c69cc2bab7b1 path=/api/v1/orders/35fdfc36-b7bb-4114-a31f-700c331735d2/chain-sync-status status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · mock-pay then GET order chain-sync-status shows escrowed last_event
