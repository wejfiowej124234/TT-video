# B-GDE-003

`cargo test -p traveltrust-api matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.14s


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
[req] x-request-id=703d8300-e0ed-4408-9fef-1645a865c1ed path=/api/v1/guides status=200
[req] x-message-id=d8946229-5712-4b29-99e0-2ca6fa60560c path=/api/v1/guides status=200
[req] x-request-id=7b49a611-8452-4e7d-933b-74ee5335998c path=/api/v1/guides/eb33aec3-04f6-4dcb-aa96-693c45164b24/stake status=200
[req] x-message-id=89d9bdd6-dcbf-4c7c-907b-972cd591a161 path=/api/v1/guides/eb33aec3-04f6-4dcb-aa96-693c45164b24/stake status=200
[req] x-request-id=28165f41-42d9-4e9f-8324-060e3475a10e path=/api/v1/guides status=200
[req] x-message-id=84e9ea93-ff06-48ea-89f4-83e8ced20b2a path=/api/v1/guides status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-024 · stake then GET guides list includes active guide
