# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.61s


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
[req] x-request-id=bfc39677-523d-4746-b7ee-cf21aca4bd65 path=/auth/register status=200
[req] x-message-id=ee58eed6-ccac-4dea-8768-2c9dbbf764ce path=/auth/register status=200
[req] x-request-id=3e438771-9cbb-4e59-86fa-2ca837e340ab path=/auth/register status=200
[req] x-message-id=b2427774-83a7-4786-a87e-81c2f264b45a path=/auth/register status=200
[req] x-request-id=e81c5563-8e42-4329-a93d-173142174737 path=/api/v1/guides status=200
[req] x-message-id=c225e5f1-e65b-41f2-83ea-3a3809ad36c0 path=/api/v1/guides status=200
[req] x-request-id=66cd9505-b4da-4b80-b817-0c02cb0bb371 path=/api/v1/guides/1f8fa64f-99f9-4252-a629-83aa098a49a2/stake status=200
[req] x-message-id=62d5d66e-eb04-4ee7-9a26-54fbb1861cd8 path=/api/v1/guides/1f8fa64f-99f9-4252-a629-83aa098a49a2/stake status=200
[req] x-request-id=acfd9987-c931-4c92-a8a1-41c97d02d5ad path=/api/v1/orders status=200
[req] x-message-id=6234d1ed-26cc-44b7-93be-83143fa370d0 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=4fc05993-7fbf-4f78-8f72-549c6a80d31b order_id=326252bb-9e90-428d-9bda-ebf4bb5a932b
[req] x-request-id=7bb1d201-1427-4a1f-9ab7-1a72c6920670 path=/api/v1/orders/326252bb-9e90-428d-9bda-ebf4bb5a932b/accept status=200
[req] x-message-id=2adfcf4d-b1da-40c7-8e0f-14c7e3d01d31 path=/api/v1/orders/326252bb-9e90-428d-9bda-ebf4bb5a932b/accept status=200
[req] x-request-id=e99bfd26-caba-4350-b9cc-ff31b6762481 path=/api/v1/orders/326252bb-9e90-428d-9bda-ebf4bb5a932b/mock-pay status=200
[req] x-message-id=b89720e3-521a-4ed7-992d-1e2e1c7a38af path=/api/v1/orders/326252bb-9e90-428d-9bda-ebf4bb5a932b/mock-pay status=200
[req] x-request-id=47e6ca34-4f0b-4076-8e4c-cd3e251b9d3a path=/api/v1/orders/326252bb-9e90-428d-9bda-ebf4bb5a932b status=200
[req] x-message-id=71c385bf-6046-43f6-86da-390c353a9efb path=/api/v1/orders/326252bb-9e90-428d-9bda-ebf4bb5a932b status=200
[req] x-request-id=9a3e60a0-9941-4a72-84c9-47a4eaf90806 path=/api/v1/orders/326252bb-9e90-428d-9bda-ebf4bb5a932b/dispute status=200
[req] x-message-id=74c0f9c0-8076-460f-be5a-169085c2bf7e path=/api/v1/orders/326252bb-9e90-428d-9bda-ebf4bb5a932b/dispute status=200
[req] x-request-id=726989c2-34ab-43b2-9655-fdd0689cbffb path=/auth/register status=200
[req] x-message-id=6c9aabc3-9687-4499-8779-b3bafef9eeff path=/auth/register status=200
[req] x-request-id=0e689ec6-feba-4884-8f8e-73276f7d188d path=/api/v1/disputes/0be8a8ab-26dc-4777-87f7-ea2dbcf71679/resolve status=200
[req] x-message-id=39a0f66e-37b1-4e6b-a4ce-45662cfa780b path=/api/v1/disputes/0be8a8ab-26dc-4777-87f7-ea2dbcf71679/resolve status=200
[req] x-request-id=94b073d1-5020-4d88-9068-a24de660451a path=/api/v1/disputes/0be8a8ab-26dc-4777-87f7-ea2dbcf71679 status=200
[req] x-message-id=fafe431b-d3a7-4b07-8158-8b790277dfb5 path=/api/v1/disputes/0be8a8ab-26dc-4777-87f7-ea2dbcf71679 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
