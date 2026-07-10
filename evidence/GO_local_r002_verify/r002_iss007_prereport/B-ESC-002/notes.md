# B-ESC-002

`cargo test -p traveltrust-api matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg` exit=0

```
StartCampaign`, `ConsumerColdStartItem`, `GOVERNED_CAMPAIGN_ITEMS_VIEW`, `GOVERNED_CAMPAIGN_SURFACES_VIEW`, `SURFACE_COMMUNITY_FEED`, `SURFACE_HOME_HERO`, `SURFACE_MARKET_FEED`, and `get_governed_campaign_for_surface`
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
[req] x-request-id=5fc0b2fb-f97f-4c2a-ab5d-fc9387ddc2c6 path=/auth/register status=200
[req] x-message-id=8b17f606-5617-41e2-8a9d-eb6ca2da5c40 path=/auth/register status=200
[req] x-request-id=976b56b0-e228-4084-9b46-9c5ddd81f694 path=/auth/register status=200
[req] x-message-id=05f7e4c0-23da-437a-8621-337bb6a400e2 path=/auth/register status=200
[req] x-request-id=2ebf8aea-5eb9-4e9c-ab5b-f0374c1978b0 path=/api/v1/guides status=200
[req] x-message-id=2e322fbe-b46a-4034-be4c-fbbbfbcac7dd path=/api/v1/guides status=200
[req] x-request-id=0e67ec40-dd96-42ec-ad91-961b33fd41c3 path=/api/v1/guides/a7177645-5c65-4fd1-bb58-1581513388f9/stake status=200
[req] x-message-id=8c4f3734-9c90-45e3-9c8b-15efdd32b11f path=/api/v1/guides/a7177645-5c65-4fd1-bb58-1581513388f9/stake status=200
[req] x-request-id=3f41d78d-3bc1-4492-92f3-3298989560d8 path=/api/v1/orders status=200
[req] x-message-id=e6cdfea6-a779-4f2f-921e-0f37605e0f22 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=252af569-212d-4f91-a48e-49caf452ee05 order_id=23c7c42f-7f09-49b9-bb5c-26d566fa2e97
[req] x-request-id=e2f24b73-e0ce-4e4d-bb2b-07951a62e2a6 path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97/accept status=200
[req] x-message-id=75dd863d-96e6-4654-83d5-03e1f6cb6810 path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97/accept status=200
[req] x-request-id=3cf580da-3987-4417-898c-99b1c5e7e701 path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97/mock-pay status=200
[req] x-message-id=3376df3d-575e-4001-a85a-85e008be3e0b path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97/mock-pay status=200
[req] x-request-id=09dd12c6-4975-4595-9193-446ac6f98314 path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97 status=200
[req] x-message-id=6e860cc6-f5ea-4b31-acab-cb015f11082e path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97 status=200
audit_key_write op=order_confirm_completion request_id=- user_id=252af569-212d-4f91-a48e-49caf452ee05 order_id=23c7c42f-7f09-49b9-bb5c-26d566fa2e97
[req] x-request-id=cbc9ee46-93e0-4d4b-8514-f1841933bc1d path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97/confirm-completion status=200
[req] x-message-id=3e6bed89-399b-499e-9953-d4df0d0ba05b path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97/confirm-completion status=200
[req] x-request-id=3aa61f22-7449-4485-9e5c-2c8034f1a672 path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97 status=200
[req] x-message-id=c8c053fb-a7f8-487b-85be-96dc354570bb path=/api/v1/orders/23c7c42f-7f09-49b9-bb5c-26d566fa2e97 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)
