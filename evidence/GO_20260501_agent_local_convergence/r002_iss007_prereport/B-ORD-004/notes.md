# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.08s


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
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=3fabb3cf-459b-4af3-93fc-bd5d79e302de path=/auth/register status=200
[req] x-message-id=fed4c0c3-c357-4fd3-a026-fd6e690ceb81 path=/auth/register status=200
[req] x-request-id=79950685-301e-43fe-9ba5-7cba8846067f path=/auth/register status=200
[req] x-message-id=85d2fb04-a0e8-4d42-aba4-91d7ac398a10 path=/auth/register status=200
[req] x-request-id=632ffe0f-610d-48ce-8794-c4db3f3c8a87 path=/api/v1/guides status=200
[req] x-message-id=d2fd462b-1dd2-4eeb-8cda-46f2b474d2b5 path=/api/v1/guides status=200
[req] x-request-id=b5ece995-0a84-4a09-9143-9f804482e01a path=/api/v1/guides/2ee32081-87a1-42c9-b156-9a26f73d3c30/stake status=200
[req] x-message-id=ebd8e495-7039-4329-975f-d5c6ad06b5d6 path=/api/v1/guides/2ee32081-87a1-42c9-b156-9a26f73d3c30/stake status=200
[req] x-request-id=a25e0c65-885e-4d16-8d81-5cddbe78836a path=/api/v1/orders status=200
[req] x-message-id=dbfda633-697f-4f43-ba08-47a0f4045948 path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=0accdfd5-872d-4539-948d-2327ed3748e0 order_id=1e9f2273-d3ba-469d-bea4-88a5c8f5bc84
[req] x-request-id=0a18d8cc-6954-4df2-9855-7bb29ea5a06a path=/api/v1/orders/1e9f2273-d3ba-469d-bea4-88a5c8f5bc84/itinerary status=200
[req] x-message-id=33c0d479-7e86-4878-8cc4-cb7de98cda47 path=/api/v1/orders/1e9f2273-d3ba-469d-bea4-88a5c8f5bc84/itinerary status=200
[req] x-request-id=92784d53-2271-4f23-aabc-5ad0ce136951 path=/api/v1/orders/1e9f2273-d3ba-469d-bea4-88a5c8f5bc84 status=200
[req] x-message-id=82f01c56-4f2d-4a98-8537-dced58cae2ea path=/api/v1/orders/1e9f2273-d3ba-469d-bea4-88a5c8f5bc84 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
