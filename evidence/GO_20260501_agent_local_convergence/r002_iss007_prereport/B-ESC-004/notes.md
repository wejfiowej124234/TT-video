# B-ESC-004

`cargo test -p traveltrust-api matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.07s


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
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=6d53d303-926e-4f7a-b20e-0a41155eee32 path=/auth/register status=200
[req] x-message-id=001ddf9f-ad82-46b6-84a6-797aa8a625cf path=/auth/register status=200
[req] x-request-id=add06dc3-5591-4b59-b598-b6bd3e43999e path=/auth/register status=200
[req] x-message-id=2ad98f7e-b218-4cbe-b977-65faec6b4bb6 path=/auth/register status=200
[req] x-request-id=bce8737e-3110-4a2b-9ea2-a47f876449e2 path=/api/v1/guides status=200
[req] x-message-id=8dd7090c-5b5d-4406-97ad-765ffb78e240 path=/api/v1/guides status=200
[req] x-request-id=e586724c-1118-4f90-a5b6-f9eedf71f6a1 path=/api/v1/guides/60a4aa42-4f89-4620-9957-fd23b2949926/stake status=200
[req] x-message-id=2299ec55-155c-4045-bf3f-ae407eb08323 path=/api/v1/guides/60a4aa42-4f89-4620-9957-fd23b2949926/stake status=200
[req] x-request-id=cbae868f-6d6c-47c1-bdb0-d1412a5f88aa path=/api/v1/orders status=200
[req] x-message-id=c693b6b0-77de-4b07-af6c-948c1e388709 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=221c8de3-6f01-40d7-81b1-a605c304413b order_id=c1f68206-ed47-42c3-83da-a5467ef39551
[req] x-request-id=8adfa1a9-8ca7-4dd2-9994-4a3e1c9d34c4 path=/api/v1/orders/c1f68206-ed47-42c3-83da-a5467ef39551/accept status=200
[req] x-message-id=4f7e9d31-a0b0-474b-a0db-1565fe99d9d2 path=/api/v1/orders/c1f68206-ed47-42c3-83da-a5467ef39551/accept status=200
[req] x-request-id=80fbe783-aec6-4240-8596-5878d609b5c6 path=/api/v1/orders/c1f68206-ed47-42c3-83da-a5467ef39551/mock-pay status=200
[req] x-message-id=2b9aabcb-b19d-415f-ae9e-7057c1a80f5a path=/api/v1/orders/c1f68206-ed47-42c3-83da-a5467ef39551/mock-pay status=200
[req] x-request-id=f9d6df0c-5ddb-40fd-96e2-b79372378de6 path=/api/v1/orders/c1f68206-ed47-42c3-83da-a5467ef39551 status=200
[req] x-message-id=b4cb0d51-d9c3-4091-8554-f7bec3343e6b path=/api/v1/orders/c1f68206-ed47-42c3-83da-a5467ef39551 status=200
[req] x-request-id=20f3bfaa-0a3d-4b80-a790-08a65ac456b0 path=/api/v1/orders/c1f68206-ed47-42c3-83da-a5467ef39551/chain-sync-status status=200
[req] x-message-id=b3b597ae-2f4c-4059-9e7c-22f062b26eec path=/api/v1/orders/c1f68206-ed47-42c3-83da-a5467ef39551/chain-sync-status status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · mock-pay then GET order chain-sync-status shows escrowed last_event
