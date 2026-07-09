# B-TRN-003

`cargo test -p traveltrust-api matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.11s


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
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=774e538b-09a3-4413-b5f1-655823cb90fc path=/auth/register status=200
[req] x-message-id=d85d3e40-e865-4179-8be7-be2eacec500c path=/auth/register status=200
[req] x-request-id=a245f94d-a8cd-4c63-9ee4-5f679a000b2b path=/auth/register status=200
[req] x-message-id=eb2a848e-e28e-4d41-91e7-8e334935d01c path=/auth/register status=200
[req] x-request-id=9da34368-9b50-4d46-8b61-6ee3c768d689 path=/api/v1/guides status=200
[req] x-message-id=5c53b797-35f9-40cf-9d88-27a4f0ab8609 path=/api/v1/guides status=200
[req] x-request-id=33bfc844-bf78-48e1-ae35-afc46903d186 path=/api/v1/guides/77cbec02-0149-425d-9720-fca8672ef133/stake status=200
[req] x-message-id=f0810af2-1330-4ece-92f6-0d6e05b814cc path=/api/v1/guides/77cbec02-0149-425d-9720-fca8672ef133/stake status=200
[req] x-request-id=6c5b8a16-09a4-412d-a0bc-15a68123bf6a path=/api/v1/orders status=200
[req] x-message-id=41ab98e0-c4b2-421a-a8b3-970e08b68e34 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=b8e82731-f425-483d-9c3a-b93108110ff5 order_id=1600a295-6356-40c0-8942-83d515893453
[req] x-request-id=14642225-c340-4988-b763-9aec170592c0 path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453/accept status=200
[req] x-message-id=47e7a3da-9a89-4aea-882a-8d4bd75f0f94 path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453/accept status=200
[req] x-request-id=5fa267ae-bc67-4056-87b8-a41c2af64703 path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453/mock-pay status=200
[req] x-message-id=ff087db9-cab1-44c0-b7cd-de3acd4b0405 path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453/mock-pay status=200
[req] x-request-id=deb430ed-7a23-4231-95f8-75290934bb72 path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453 status=200
[req] x-message-id=d4d7e506-0f0c-47a7-b0ce-f938b567e0d4 path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453 status=200
[req] x-request-id=db7bb756-554a-4a07-a8d3-ba0d535632c8 path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453/dispute status=200
[req] x-message-id=0c830f5f-ee1e-4102-9311-39d8aa0c1f0f path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453/dispute status=200
[req] x-request-id=9afd6392-abdc-4acb-bb77-731f9dac3799 path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453 status=200
[req] x-message-id=4db57fdc-14d6-4f55-b7b7-99d7747d2808 path=/api/v1/orders/1600a295-6356-40c0-8942-83d515893453 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
