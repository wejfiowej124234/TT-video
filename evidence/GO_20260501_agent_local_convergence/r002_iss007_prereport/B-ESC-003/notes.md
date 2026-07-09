# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_005b_f027_dual_reviews_after_completed_get_list_len_two_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_005b_f027_dual_reviews_after_completed_get_list_len_two_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.05s


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
[req] x-request-id=6ef617a6-244d-40c3-88b9-024343c3baae path=/auth/register status=200
[req] x-message-id=de4cc1ea-06e9-4313-b9b4-2fc04b15b3fd path=/auth/register status=200
[req] x-request-id=0d58fee9-3248-4058-9e8a-9afccc90a194 path=/auth/register status=200
[req] x-message-id=e47e25d8-4684-4ff8-8e35-8f6e1116995f path=/auth/register status=200
[req] x-request-id=7c8cff39-ea38-4aee-bb33-b87dc5b7f51a path=/api/v1/guides status=200
[req] x-message-id=2ad25b54-42be-4ebd-b298-271bf4b5d6da path=/api/v1/guides status=200
[req] x-request-id=f174e678-3816-4961-b2f8-bfad6d4669ac path=/api/v1/guides/a95b9bf1-27fc-4848-9c89-ea6afda5b3f0/stake status=200
[req] x-message-id=182346be-15ed-4669-a534-4b48f4a72a46 path=/api/v1/guides/a95b9bf1-27fc-4848-9c89-ea6afda5b3f0/stake status=200
[req] x-request-id=5e770691-123a-4424-92f2-a0af9b5e969a path=/api/v1/orders status=200
[req] x-message-id=60795115-d713-4856-9d06-274781086576 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=4ce0c954-9df1-4c52-aee1-89c2af1ccb7f order_id=7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17
[req] x-request-id=7d5fc438-e5ec-4acf-bf5c-e680ea7bc9d6 path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/accept status=200
[req] x-message-id=de8af3f0-8d51-4022-98bb-a8e3c73d34f4 path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/accept status=200
[req] x-request-id=bfcb0509-2669-4ddf-9a39-1618c61b7e36 path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/mock-pay status=200
[req] x-message-id=99bb11cb-b7c5-48ed-80ac-efbabc655ee4 path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/mock-pay status=200
[req] x-request-id=d56e0740-804f-406e-ac4b-c39e90a3a95e path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17 status=200
[req] x-message-id=e723376a-525d-42dd-a28e-5cd14352572a path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17 status=200
[req] x-request-id=b8939db2-4db9-4ccb-a479-00b0905ec1ff path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/confirm-completion status=200
[req] x-message-id=39db95a3-99d1-4b5c-b44b-e46d235a5999 path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/confirm-completion status=200
[req] x-request-id=34381c28-849c-4400-9d56-f045144f8b94 path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17 status=200
[req] x-message-id=2d90162b-cd3b-492a-bf3b-1eafcac5168b path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17 status=200
[audit] db insert_review failed review_id=cb9b2343-f9c3-4800-93b5-808431f04f83 error=error returned from database: insert or update on table "reviews" violates foreign key constraint "reviews_reviewee_id_fkey"
[req] x-request-id=a6d803bb-38b5-47ca-af05-ecc621492b41 path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/reviews status=200
[req] x-message-id=54ea9f65-108c-47b9-a8f1-4c9db231487f path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/reviews status=200
[req] x-request-id=089ed83d-69a2-4ec5-9678-e93bf93776c9 path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/reviews status=200
[req] x-message-id=3f89fe87-8129-47eb-babe-fca1b6a4ff5e path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/reviews status=200
[req] x-request-id=c94a75bd-2139-48d1-9c79-8600cf5941ae path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/reviews status=200
[req] x-message-id=0e5861a4-d2e2-4578-928c-b5292ca93a2d path=/api/v1/orders/7eef86c6-2fe0-4b21-ba21-e2e85c0e8d17/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order dual POST reviews then GET list len 2
