# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.10s


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
[req] x-request-id=cc265e45-9484-4347-a030-ffb57d3ef5cd path=/auth/register status=200
[req] x-message-id=4efdd762-d5b1-4871-ab6c-fc3db6b57875 path=/auth/register status=200
[req] x-request-id=e1264f47-29d5-4da6-b8fc-744a9e70a19b path=/auth/register status=200
[req] x-message-id=7fa82c0f-287f-4a4b-9b7f-54670f2e6a83 path=/auth/register status=200
[req] x-request-id=d2fbe43a-58df-4389-85ba-580592332cf4 path=/api/v1/guides status=200
[req] x-message-id=9b0ca4fd-69fe-4b9e-b238-ea483175f8a4 path=/api/v1/guides status=200
[req] x-request-id=ce7791fb-9821-4992-8fd3-b25802e911eb path=/api/v1/guides/44615c68-0d2e-4039-830a-3eceea54a03e/stake status=200
[req] x-message-id=73ec1c91-7e66-475c-9bed-eb149ced4008 path=/api/v1/guides/44615c68-0d2e-4039-830a-3eceea54a03e/stake status=200
[req] x-request-id=bcda5e07-4a1f-443d-84d9-7b341eb34f40 path=/api/v1/orders status=200
[req] x-message-id=66dac512-fcdc-4aff-9774-3d205177c871 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=5d13209d-4e9d-4062-a694-78ce84787ffa order_id=f2f21205-4fc1-4c43-aa96-a54d30455c8f
[req] x-request-id=5aa01714-dff3-443d-afb7-f868ad1b0f8b path=/api/v1/orders/f2f21205-4fc1-4c43-aa96-a54d30455c8f/accept status=200
[req] x-message-id=f6c5ae16-3edf-464c-a143-340ec5ee66fe path=/api/v1/orders/f2f21205-4fc1-4c43-aa96-a54d30455c8f/accept status=200
[req] x-request-id=9a7a3ccc-380a-42ef-b365-25325936b82d path=/api/v1/orders/f2f21205-4fc1-4c43-aa96-a54d30455c8f/mock-pay status=200
[req] x-message-id=2d951f2f-a38d-44b7-80cf-9a672c045e74 path=/api/v1/orders/f2f21205-4fc1-4c43-aa96-a54d30455c8f/mock-pay status=200
[req] x-request-id=8e124f9b-3d12-4ba6-bfd7-aa24869f839f path=/api/v1/orders/f2f21205-4fc1-4c43-aa96-a54d30455c8f status=200
[req] x-message-id=324709ee-8e96-4da0-b41b-5510c96a1e29 path=/api/v1/orders/f2f21205-4fc1-4c43-aa96-a54d30455c8f status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
