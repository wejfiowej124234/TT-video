# A-ENV-001

`cargo test -p traveltrust-api matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.06s


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
[req] x-request-id=a1e862c4-4fad-4a6e-8849-75c52723b4aa path=/health status=200
[req] x-message-id=9b4d2b3e-0ad0-4378-8fb0-94734fa1a002 path=/health status=200
[req] x-request-id=95667a5d-c172-4c77-9261-74126c574d55 path=/meta status=200
[req] x-message-id=4a163390-6da1-4847-b4db-e2b2a4172d40 path=/meta status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · GET /health returns ok and GET /meta includes build api_version database
