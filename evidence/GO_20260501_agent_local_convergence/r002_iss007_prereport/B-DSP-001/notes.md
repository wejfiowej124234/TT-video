# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.09s


warning: type `ProfileAvatarBase64Body` is more private than the item `post_me_profile_avatar`
   --> crates\api\src\routes\me.rs:627:1
    |
627 | / pub async fn post_me_profile_avatar(
628 | |     State(state): State<ApiMetaState>,
629 | |     headers: HeaderMap,
630 | |     Json(body): Json<ProfileAvatarBase64Body>,
631 | | ) -> impl IntoResponse {
    | |______________________^ function `post_me_profile_avatar` is reachable at visibility `pub(in crate::routes)`
    |
note: but type `ProfileAvatarBase64Body` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\me.rs:787:1
    |
787 | struct ProfileAvatarBase64Body {
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    = note: `#[warn(private_interfaces)]` on by default

warning: type `ProfileAvatarPresignBody` is more private than the item `post_me_profile_avatar_presign`
   --> crates\api\src\routes\me.rs:803:1
    |
803 | / pub async fn post_me_profile_avatar_presign(
804 | |     State(state): State<ApiMetaState>,
805 | |     headers: HeaderMap,
806 | |     Json(body): Json<ProfileAvatarPresignBody>,
807 | | ) -> impl IntoResponse {
    | |______________________^ function `post_me_profile_avatar_presign` is reachable at visibility `pub(in crate::routes)`
    |
note: but type `ProfileAvatarPresignBody` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\me.rs:792:1
    |
792 | struct ProfileAvatarPresignBody {
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: type `ProfileAvatarCommitBody` is more private than the item `post_me_profile_avatar_commit`
   --> crates\api\src\routes\me.rs:945:1
    |
945 | / pub async fn post_me_profile_avatar_commit(
946 | |     State(state): State<ApiMetaState>,
947 | |     headers: HeaderMap,
948 | |     Json(body): Json<ProfileAvatarCommitBody>,
949 | | ) -> impl IntoResponse {
    | |______________________^ function `post_me_profile_avatar_commit` is reachable at visibility `pub(in crate::routes)`
    |
note: but type `ProfileAvatarCommitBody` is only usable at visibility `pub(self)`
   --> crates\api\src\routes\me.rs:798:1
    |
798 | struct ProfileAvatarCommitBody {
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: `traveltrust-api` (bin "traveltrust-api" test) generated 3 warnings
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=dbc88380-0dfb-471f-8be7-c3cddf58037e path=/auth/register status=200
[req] x-message-id=c01fcd14-e419-49a4-b63d-eecdfbb7b559 path=/auth/register status=200
[req] x-request-id=703d5ebe-4b78-4899-8fd3-7459fd5690ac path=/auth/register status=200
[req] x-message-id=b5d2a500-2ee2-4bb3-9a45-00d25e12a43d path=/auth/register status=200
[req] x-request-id=811ba6bf-fb8e-4c9b-81da-de8a3df726f8 path=/api/v1/guides status=200
[req] x-message-id=0a70a813-6c07-4207-83e3-0adc8e07d824 path=/api/v1/guides status=200
[req] x-request-id=10a2ca6d-ae18-4d6b-991c-3d15fa33e624 path=/api/v1/guides/2207c7c2-b262-461e-9ecd-d3d9e492f5c4/stake status=200
[req] x-message-id=49e2c5e9-7ca5-47c4-9657-e4d4f5d6ca97 path=/api/v1/guides/2207c7c2-b262-461e-9ecd-d3d9e492f5c4/stake status=200
[req] x-request-id=cd6ad6b4-6a1e-4563-bf09-0fc5dded079c path=/api/v1/orders status=200
[req] x-message-id=77608bd9-8e1f-434e-8534-a48a917acb12 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=527f2675-3481-4734-b384-864a522f4f51 order_id=4735e0da-8ec3-4254-9d5a-e410e206676b
[req] x-request-id=379a90fe-6d33-4ec5-981e-cc0475b57eb7 path=/api/v1/orders/4735e0da-8ec3-4254-9d5a-e410e206676b/accept status=200
[req] x-message-id=2df30f3c-69b2-481a-9610-94fc1e2a12d9 path=/api/v1/orders/4735e0da-8ec3-4254-9d5a-e410e206676b/accept status=200
[req] x-request-id=563ea9e4-e4cc-486f-8bf6-8c14663a63c9 path=/api/v1/orders/4735e0da-8ec3-4254-9d5a-e410e206676b/mock-pay status=200
[req] x-message-id=982d4ef1-e495-4a22-8206-bb9812ad920c path=/api/v1/orders/4735e0da-8ec3-4254-9d5a-e410e206676b/mock-pay status=200
[req] x-request-id=f3b26253-c28a-42f8-b8e8-6231817bb2ca path=/api/v1/orders/4735e0da-8ec3-4254-9d5a-e410e206676b status=200
[req] x-message-id=2297738d-85e6-4114-8cf1-cb057180e283 path=/api/v1/orders/4735e0da-8ec3-4254-9d5a-e410e206676b status=200
[req] x-request-id=cc23e739-0b4c-49c2-82ed-c1dc1c58a04e path=/api/v1/orders/4735e0da-8ec3-4254-9d5a-e410e206676b/dispute status=200
[req] x-message-id=163d0f39-6ab8-4bce-8fbf-25dfa8bf023a path=/api/v1/orders/4735e0da-8ec3-4254-9d5a-e410e206676b/dispute status=200
[req] x-request-id=3bcf5984-d0de-4e2d-9356-1110687061c9 path=/api/v1/disputes status=200
[req] x-message-id=6a6c1dbc-d2d1-4cf8-b78e-6b2899784102 path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
