# B-ESC-002

`cargo test -p traveltrust-api matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg ... ok

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
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=25e7d9ec-5ff5-439e-8997-9d0fea9b0cbb path=/auth/register status=200
[req] x-message-id=4de24ee2-d86e-41a6-8581-a27eaa2cb4dc path=/auth/register status=200
[req] x-request-id=7d4c7fdb-6b01-400e-b678-f83d2f72f718 path=/auth/register status=200
[req] x-message-id=401512ba-49e8-4c93-8f9e-b1af224a01c5 path=/auth/register status=200
[req] x-request-id=ace211ab-bdf1-4721-8455-43beb3f65f08 path=/api/v1/guides status=200
[req] x-message-id=d1c7eee6-92be-4384-9e33-c1979428cfbb path=/api/v1/guides status=200
[req] x-request-id=20c4995c-474a-4336-83fd-93a96c833ab4 path=/api/v1/guides/251578e1-61ad-42d2-a1ec-9d1cc800bd65/stake status=200
[req] x-message-id=3422330e-ff05-4680-9fd7-a80d433efbe5 path=/api/v1/guides/251578e1-61ad-42d2-a1ec-9d1cc800bd65/stake status=200
[req] x-request-id=055f717e-9f36-4b1c-b9d5-aa99ebe4f422 path=/api/v1/orders status=200
[req] x-message-id=4019b8e5-bfa6-4c41-b9e2-02f601695277 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=aaaf579e-57ee-4e04-a71e-fe5fcbe0cb62 order_id=af8f65ea-a6fa-400a-a3cb-61bea7aa19a4
[req] x-request-id=de0df773-c24b-4d5a-8b9d-6321642ff1ec path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4/accept status=200
[req] x-message-id=0cf36f28-a1fa-4420-9637-50364ddf88aa path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4/accept status=200
[req] x-request-id=2b4ef428-d995-4c95-b5bb-3edd6f24e510 path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4/mock-pay status=200
[req] x-message-id=71718f17-bf30-438e-9cf6-ca3b5fadf66f path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4/mock-pay status=200
[req] x-request-id=45b7e3b6-8bf3-40ff-8c1d-43ceffa9f4f4 path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4 status=200
[req] x-message-id=52f2a5b4-f8fb-4e42-9166-d1967e991693 path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4 status=200
[req] x-request-id=4e89b070-8902-4038-8c9d-fbc0eda3abd1 path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4/confirm-completion status=200
[req] x-message-id=06ffaeee-e24f-44ae-9101-1a8f03ae83a1 path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4/confirm-completion status=200
[req] x-request-id=4c886a17-ac67-4b2a-882c-ecb5735c17b0 path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4 status=200
[req] x-message-id=ad4e33f5-03c2-4995-827e-f02cd268593c path=/api/v1/orders/af8f65ea-a6fa-400a-a3cb-61bea7aa19a4 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)
