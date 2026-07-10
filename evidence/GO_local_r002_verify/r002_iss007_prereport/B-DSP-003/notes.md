# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```
|     get_governed_campaign_for_surface, ConsumerColdStartCampaign, ConsumerColdStartItem,
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
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.35s
     Running unittests src\vacancy_indexer_lib.rs (target\debug\deps\traveltrust_vacancy_indexer-f4bfef5bff4e93af.exe)
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-a4ade982a8ceea95.exe)
[req] x-request-id=c7a3efd0-a574-46dc-a8f4-4de34dc61bdb path=/auth/register status=200
[req] x-message-id=cf419af8-f524-451e-9533-052d2c8d9a9e path=/auth/register status=200
[req] x-request-id=06d26fca-33ca-479c-868d-902d8ea695c0 path=/auth/register status=200
[req] x-message-id=5350df86-2549-46ee-8f26-58a643beffba path=/auth/register status=200
[req] x-request-id=b6337a96-54c2-49a3-b8dd-5da7112bf437 path=/api/v1/guides status=200
[req] x-message-id=cd439199-81dc-484e-b80c-9c3b9617d71e path=/api/v1/guides status=200
[req] x-request-id=7cc85ba7-a72f-4fea-a9b1-c7a1714d7aa4 path=/api/v1/guides/bdf09612-d15c-457d-88a0-c19819642a29/stake status=200
[req] x-message-id=aa4f8518-990c-4ddf-9a4b-dc583710c95c path=/api/v1/guides/bdf09612-d15c-457d-88a0-c19819642a29/stake status=200
[req] x-request-id=978c45f8-43a4-4c1e-bdb5-548d80af6008 path=/api/v1/orders status=200
[req] x-message-id=22a134d3-3bb6-453c-a45e-0af3231af868 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=bce4037d-c1fb-4d77-9115-ea3d240fa38c order_id=0de1e4ac-6e98-4376-9c5c-666e6a7f0cf7
[req] x-request-id=0db57c87-34b0-4f49-b770-bf30e4d55fef path=/api/v1/orders/0de1e4ac-6e98-4376-9c5c-666e6a7f0cf7/accept status=200
[req] x-message-id=700d0606-e10d-44d2-8856-f59023d2fda3 path=/api/v1/orders/0de1e4ac-6e98-4376-9c5c-666e6a7f0cf7/accept status=200
[req] x-request-id=0fb69471-622c-4e62-ad5e-04e9ef0ffdd6 path=/api/v1/orders/0de1e4ac-6e98-4376-9c5c-666e6a7f0cf7/mock-pay status=200
[req] x-message-id=3316c491-345e-4a9c-a8c3-1fa9bc01ad09 path=/api/v1/orders/0de1e4ac-6e98-4376-9c5c-666e6a7f0cf7/mock-pay status=200
[req] x-request-id=deae1457-b42f-4d50-a6ef-17505c3df4d2 path=/api/v1/orders/0de1e4ac-6e98-4376-9c5c-666e6a7f0cf7 status=200
[req] x-message-id=a3915402-a4ba-45eb-88a1-ca4aabc6a8c5 path=/api/v1/orders/0de1e4ac-6e98-4376-9c5c-666e6a7f0cf7 status=200
[req] x-request-id=e5fa4573-e095-42bc-a7aa-29c819f6fa6d path=/api/v1/orders/0de1e4ac-6e98-4376-9c5c-666e6a7f0cf7/dispute status=200
[req] x-message-id=76ea0222-f3aa-4d2b-9ad2-8c6361345a0d path=/api/v1/orders/0de1e4ac-6e98-4376-9c5c-666e6a7f0cf7/dispute status=200
[req] x-request-id=b287ddf0-21f9-4dc7-a100-6c16aab0ffda path=/auth/register status=200
[req] x-message-id=037a12fd-99aa-41f2-84a2-16251fa00150 path=/auth/register status=200
[req] x-request-id=220a2f74-ec04-4aee-bc40-f29a32b97ee1 path=/api/v1/disputes/1fd934d6-a42d-4cac-a100-8ad2a27316a8/resolve status=200
[req] x-message-id=4c3c0afe-5bc1-45eb-b731-2dafa93e7fbd path=/api/v1/disputes/1fd934d6-a42d-4cac-a100-8ad2a27316a8/resolve status=200
[req] x-request-id=831c3f17-11c0-4c52-9084-2af959fab535 path=/api/v1/disputes/1fd934d6-a42d-4cac-a100-8ad2a27316a8 status=200
[req] x-message-id=7d274941-c498-432d-b1dc-523240bf5d67 path=/api/v1/disputes/1fd934d6-a42d-4cac-a100-8ad2a27316a8 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
