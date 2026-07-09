# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

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
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=a241df89-178f-47d0-9764-403372c36eb7 path=/auth/register status=200
[req] x-message-id=2f3097bf-6409-4eed-bd59-aebcb1620117 path=/auth/register status=200
[req] x-request-id=dccfc101-242d-481f-be25-edbc52adcbf0 path=/auth/register status=200
[req] x-message-id=d41c38dd-7c25-4ef9-bfa5-7f19acfafe96 path=/auth/register status=200
[req] x-request-id=31de9911-d459-41a6-8083-63b3252d8311 path=/api/v1/guides status=200
[req] x-message-id=74449f93-1f51-4122-9801-b248dab02168 path=/api/v1/guides status=200
[req] x-request-id=c87f732b-1969-4e67-a246-1a7c2b2a51a3 path=/api/v1/guides/73321917-a448-4441-b6a1-1d42e128954b/stake status=200
[req] x-message-id=666b6045-85b6-48e6-b931-3969740196a8 path=/api/v1/guides/73321917-a448-4441-b6a1-1d42e128954b/stake status=200
[req] x-request-id=66b56bb3-af00-49ca-8fbf-7995a7a007b3 path=/api/v1/orders status=200
[req] x-message-id=481d5f4f-4157-4458-a838-e67012306424 path=/api/v1/orders status=200
[req] x-request-id=f0bafa1e-b25d-43e6-ad03-192dc61439fb path=/api/v1/orders/e7428adf-9051-4e5f-98de-ffd73a7ab0c5/set-escrow-address status=200
[req] x-message-id=1cc7a063-f8ee-4a41-bb19-eeb34a807934 path=/api/v1/orders/e7428adf-9051-4e5f-98de-ffd73a7ab0c5/set-escrow-address status=200
[req] x-request-id=c9f8b33d-dfc4-45c7-bddc-84b23db4df7f path=/api/v1/orders/e7428adf-9051-4e5f-98de-ffd73a7ab0c5 status=200
[req] x-message-id=1642b50f-096d-49d7-9cc2-64ad6f6c322c path=/api/v1/orders/e7428adf-9051-4e5f-98de-ffd73a7ab0c5 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
