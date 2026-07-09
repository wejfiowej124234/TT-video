# B-MKT-008

`cargo test -p traveltrust-api matrix_93_b_mkt_008_f022_post_acquisition_listing_then_get_catalog_app_stack_ok_pg` exit=0

```

running 1 test
test routes::market_subsite_catalog_db_api_tests::matrix_93_b_mkt_008_f022_post_acquisition_listing_then_get_catalog_app_stack_ok_pg ... ok

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
[req] x-request-id=e9c32ffa-715d-4851-b519-21f630ba6ebf path=/api/v1/market/acquisition/listings status=200
[req] x-message-id=f8c35ddf-8cef-4dc9-9ff4-f04666aefd6c path=/api/v1/market/acquisition/listings status=200
[req] x-request-id=6962fc99-c351-4f24-a68c-66ee58e4285f path=/api/v1/market/acquisition/listings status=200
[req] x-message-id=3c18321f-3644-401c-8cf6-8a0d13de5f02 path=/api/v1/market/acquisition/listings status=200

```
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-022 · POST acquisition listing then GET catalog includes id
