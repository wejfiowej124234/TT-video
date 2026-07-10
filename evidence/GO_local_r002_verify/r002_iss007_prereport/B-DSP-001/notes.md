# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```
t_listing,
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
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.32s
     Running unittests src\vacancy_indexer_lib.rs (target\debug\deps\traveltrust_vacancy_indexer-f4bfef5bff4e93af.exe)
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-a4ade982a8ceea95.exe)
[req] x-request-id=f0148243-187a-40e6-98be-a4885b388d10 path=/auth/register status=200
[req] x-message-id=aa6064b5-ab5a-40dc-9263-1e16f0e8eaf1 path=/auth/register status=200
[req] x-request-id=33d68dca-f3b6-4648-8413-cbb932c6513c path=/auth/register status=200
[req] x-message-id=a64f84b2-1649-4886-b4a8-13a037af31bc path=/auth/register status=200
[req] x-request-id=a7dbfc9a-742d-41b0-92ae-b4115157dacd path=/api/v1/guides status=200
[req] x-message-id=a0083072-47e8-4b66-9c2d-6cbee3f5cb0a path=/api/v1/guides status=200
[req] x-request-id=275985ba-2dd9-45a9-9b61-43b3743abb39 path=/api/v1/guides/cc2b3e5a-003f-4777-8fcb-6370dbb78874/stake status=200
[req] x-message-id=845cf928-6596-4153-a27d-36bc00a02680 path=/api/v1/guides/cc2b3e5a-003f-4777-8fcb-6370dbb78874/stake status=200
[req] x-request-id=4f70d43a-c88a-4703-bb03-503dca844775 path=/api/v1/orders status=200
[req] x-message-id=73e6123b-ebdf-4a9b-ade0-02bdfdaa5ae2 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=8395ec90-f05c-4cdd-a694-1ac5c7def4d6 order_id=e092ec7a-14d7-48ac-a90c-8a9afd399362
[req] x-request-id=71b5e793-829e-445c-b1e8-1527897f3d13 path=/api/v1/orders/e092ec7a-14d7-48ac-a90c-8a9afd399362/accept status=200
[req] x-message-id=19fd49e8-50c7-4647-8be9-c372fa284892 path=/api/v1/orders/e092ec7a-14d7-48ac-a90c-8a9afd399362/accept status=200
[req] x-request-id=4c35c926-b51a-4a63-8ac6-d898585b13a7 path=/api/v1/orders/e092ec7a-14d7-48ac-a90c-8a9afd399362/mock-pay status=200
[req] x-message-id=a5e1a414-7dc6-4a1c-b18f-eb195b20348f path=/api/v1/orders/e092ec7a-14d7-48ac-a90c-8a9afd399362/mock-pay status=200
[req] x-request-id=f5a13c2b-16fa-46b4-8deb-35f7b57a0595 path=/api/v1/orders/e092ec7a-14d7-48ac-a90c-8a9afd399362 status=200
[req] x-message-id=e2e7719b-8e78-4bb6-894a-3227a193e9fb path=/api/v1/orders/e092ec7a-14d7-48ac-a90c-8a9afd399362 status=200
[req] x-request-id=8cbfb724-3b05-4247-b358-b158ecc3530e path=/api/v1/orders/e092ec7a-14d7-48ac-a90c-8a9afd399362/dispute status=200
[req] x-message-id=f6611744-9c5e-42cc-bf1b-0e0f4636c6c3 path=/api/v1/orders/e092ec7a-14d7-48ac-a90c-8a9afd399362/dispute status=200
[req] x-request-id=f315984b-1604-4485-98d4-09f40712a7b3 path=/api/v1/disputes status=200
[req] x-message-id=94cfa5ae-b6c5-4d74-81cc-a03d84c7f4a5 path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
