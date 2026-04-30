# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.63s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.32s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=d6deb27c-8907-4b5a-8118-57cd8626aafa path=/auth/register status=200
[req] x-message-id=2d595e7c-f8e3-4cd8-a157-eb216149113f path=/auth/register status=200
[req] x-request-id=bd4a6cc6-cec3-4ac4-8b03-d3ccb8ab3a16 path=/auth/register status=200
[req] x-message-id=60d458ee-1bc4-4852-b2ff-4bebb63b98b1 path=/auth/register status=200
[req] x-request-id=ce3e437e-37d8-4840-8cdb-908f5f87b18f path=/api/v1/guides status=200
[req] x-message-id=9dcea64b-75ba-4ce0-9899-632e785df30e path=/api/v1/guides status=200
[req] x-request-id=3ce13e6e-aec7-4986-bc15-3151260531b5 path=/api/v1/guides/e99859f5-1c53-4b21-a040-ca6afe2984d6/stake status=200
[req] x-message-id=67f87e9f-8872-4c40-9942-0212db16d8f0 path=/api/v1/guides/e99859f5-1c53-4b21-a040-ca6afe2984d6/stake status=200
[req] x-request-id=a32dfd22-67b2-4c28-80b6-185e6dd554c7 path=/api/v1/orders status=200
[req] x-message-id=7217b554-acd3-4115-b1d0-8fc8e0856c6c path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=ccc008cd-3c70-4e01-a5f8-568c739ab1c6 order_id=02eb8941-dbb8-4f6a-a748-c2aa595d907e
[req] x-request-id=57ea015a-3299-4a08-9a63-9a7adb7f4230 path=/api/v1/orders/02eb8941-dbb8-4f6a-a748-c2aa595d907e/accept status=200
[req] x-message-id=4f214484-c4d1-45a3-9693-c7fdb5ee321e path=/api/v1/orders/02eb8941-dbb8-4f6a-a748-c2aa595d907e/accept status=200
[req] x-request-id=941a8b17-c232-48a4-a01a-48b7d982c1a7 path=/api/v1/orders/02eb8941-dbb8-4f6a-a748-c2aa595d907e/mock-pay status=200
[req] x-message-id=20ff5c37-6c99-4091-b0dc-8287cc254e8e path=/api/v1/orders/02eb8941-dbb8-4f6a-a748-c2aa595d907e/mock-pay status=200
[req] x-request-id=6b4004e2-3762-49e1-90f4-678100414c4d path=/api/v1/orders/02eb8941-dbb8-4f6a-a748-c2aa595d907e status=200
[req] x-message-id=e9ba30f7-3d4b-465a-a262-88511a9e2bb7 path=/api/v1/orders/02eb8941-dbb8-4f6a-a748-c2aa595d907e status=200
[req] x-request-id=4d756226-a084-4f8e-bc5c-45ae314614bf path=/api/v1/orders/02eb8941-dbb8-4f6a-a748-c2aa595d907e/dispute status=200
[req] x-message-id=cac91675-2166-4a58-b4e9-2d24d62d7a7e path=/api/v1/orders/02eb8941-dbb8-4f6a-a748-c2aa595d907e/dispute status=200
[req] x-request-id=e0e30a79-870b-4624-8f03-8c1bcd3157f0 path=/auth/register status=200
[req] x-message-id=f7b7cdfc-6054-4cab-aa61-a709611a3526 path=/auth/register status=200
[req] x-request-id=94cf3a29-bb5c-4e8f-beca-7d9a5a30af7c path=/api/v1/disputes/6d27e4ca-ae42-4384-9e75-954c50acf662/resolve status=200
[req] x-message-id=b2a9fa2d-76a8-4019-a4db-98c13868389e path=/api/v1/disputes/6d27e4ca-ae42-4384-9e75-954c50acf662/resolve status=200
[req] x-request-id=089ed377-fe21-45cd-9e43-61e316de56e8 path=/api/v1/disputes/6d27e4ca-ae42-4384-9e75-954c50acf662 status=200
[req] x-message-id=481e3399-84c3-4109-b845-f4391f65fd3e path=/api/v1/disputes/6d27e4ca-ae42-4384-9e75-954c50acf662 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
