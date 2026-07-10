# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_005b_f027_dual_reviews_after_completed_get_list_len_two_app_stack_ok_pg` exit=0

```

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
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.36s
     Running unittests src\vacancy_indexer_lib.rs (target\debug\deps\traveltrust_vacancy_indexer-f4bfef5bff4e93af.exe)
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-a4ade982a8ceea95.exe)
[req] x-request-id=cfd19e3e-4966-4fee-af42-615766703738 path=/auth/register status=200
[req] x-message-id=b0a15cb7-e973-4f84-9c11-839b3fb40e8d path=/auth/register status=200
[req] x-request-id=4bafdccb-8051-4c2d-8ce4-cb09a5561f4a path=/auth/register status=200
[req] x-message-id=db7cb472-73c2-446b-8e23-3222e97f14ef path=/auth/register status=200
[req] x-request-id=c7d25f60-b7d7-4269-8f5c-53e595eb31c3 path=/api/v1/guides status=200
[req] x-message-id=77567767-002b-49a9-b49c-1f06a84298f8 path=/api/v1/guides status=200
[req] x-request-id=c2705048-d50f-47d2-b39a-b92b59490efb path=/api/v1/guides/53bc58fa-0289-4344-92a7-346501795e55/stake status=200
[req] x-message-id=030a63a7-7741-4c5d-922c-886ce35957e3 path=/api/v1/guides/53bc58fa-0289-4344-92a7-346501795e55/stake status=200
[req] x-request-id=99a618a6-3abd-47f6-9823-5cc536a70203 path=/api/v1/orders status=200
[req] x-message-id=0022e280-933b-45f5-9c7e-844a2618d0df path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=013caa59-34a2-4857-906c-16425165eb6b order_id=6c4a8aa7-4c9e-4d63-9c31-81679abfd52c
[req] x-request-id=dd742e95-de6a-4d47-ba83-33b75e881bdb path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/accept status=200
[req] x-message-id=431154cc-948c-46d6-bcbd-de179e4c5dc3 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/accept status=200
[req] x-request-id=30f1e90d-1121-4171-bc2b-a1f5591938f0 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/mock-pay status=200
[req] x-message-id=ca7a194f-3c93-4fd8-9d5a-877e5b6fd808 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/mock-pay status=200
[req] x-request-id=5a2b2a8f-0b2c-4bc9-9993-f2ba6885a3d9 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c status=200
[req] x-message-id=675b69ab-7c21-4e9c-a675-18a864c94b86 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c status=200
audit_key_write op=order_confirm_completion request_id=- user_id=013caa59-34a2-4857-906c-16425165eb6b order_id=6c4a8aa7-4c9e-4d63-9c31-81679abfd52c
[req] x-request-id=3e91e259-3b2c-46a2-a976-c92c169a5b47 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/confirm-completion status=200
[req] x-message-id=b8b4541f-11e4-4da0-beb8-076e0790ce74 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/confirm-completion status=200
[req] x-request-id=1311619e-dd40-44eb-8d2f-8496a85588b3 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c status=200
[req] x-message-id=d7e704f6-296c-4d49-8bae-b2966be0cc87 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c status=200
[audit] db insert_review failed review_id=4df792dd-0910-4d6b-b18b-302f7bac2eaa error=error returned from database: insert or update on table "reviews" violates foreign key constraint "reviews_reviewee_id_fkey"
[req] x-request-id=14e23630-6235-4417-b9d4-41e994c5aea9 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/reviews status=200
[req] x-message-id=81fd6d1d-d41d-4982-8ef4-596567956ad7 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/reviews status=200
[req] x-request-id=c681f762-0847-41f7-9ec8-58c717a2817c path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/reviews status=200
[req] x-message-id=78c86b90-b77a-49c7-8b88-f7b34f603ec5 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/reviews status=200
[req] x-request-id=e260bc1f-640c-4b74-a86d-a35f03d6f8d0 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/reviews status=200
[req] x-message-id=65b1b9e0-0dbf-4834-a7c5-3b7b3e86bd32 path=/api/v1/orders/6c4a8aa7-4c9e-4d63-9c31-81679abfd52c/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order dual POST reviews then GET list len 2
