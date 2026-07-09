# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.21s


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
[req] x-request-id=e85d9813-b9ef-46eb-915f-36ba6b62bfd0 path=/api/v1/community/posts status=200
[req] x-message-id=f72d0ace-0022-48c0-99b8-2f3779bf58eb path=/api/v1/community/posts status=200
[req] x-request-id=09f6044a-5f27-4674-b72a-2ca3f3475953 path=/api/v1/community/posts/79ead341-fdb8-4173-b648-aa13f1c3f657/collect status=200
[req] x-message-id=dfe4ce51-943b-447b-9f21-0b47424b6d30 path=/api/v1/community/posts/79ead341-fdb8-4173-b648-aa13f1c3f657/collect status=200
[req] x-request-id=5311ef2c-91ab-4b18-815b-a1768d46e863 path=/api/v1/community/posts/79ead341-fdb8-4173-b648-aa13f1c3f657/collect status=200
[req] x-message-id=9ae26d17-5bcb-4a12-ae15-39a15f7e461b path=/api/v1/community/posts/79ead341-fdb8-4173-b648-aa13f1c3f657/collect status=200
[req] x-request-id=ec81019d-d510-495e-a693-b6929ac20bc6 path=/api/v1/community/posts/79ead341-fdb8-4173-b648-aa13f1c3f657/collect status=200
[req] x-message-id=1cb56757-4bfd-43b3-8e9f-749c4fb2b49f path=/api/v1/community/posts/79ead341-fdb8-4173-b648-aa13f1c3f657/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
