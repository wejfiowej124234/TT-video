# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=9b587131-20df-4a0b-861c-0071242ddfbc path=/auth/register status=200
[req] x-message-id=99aacdf9-f338-419b-a92b-24775de8eabe path=/auth/register status=200
[req] x-request-id=cfeb8fed-25c9-481e-80a2-cc026f159f48 path=/auth/register status=200
[req] x-message-id=2d3967da-a7ea-4df9-8b2a-e3173dfdaad7 path=/auth/register status=200
[req] x-request-id=b764a590-b826-4db9-a568-0ad3a5be7e64 path=/api/v1/guides status=200
[req] x-message-id=158d6d83-7e57-4653-8112-bb776897659a path=/api/v1/guides status=200
[req] x-request-id=8160463d-72cd-4020-a87d-a26c8295353f path=/api/v1/guides/d392bb0f-8209-4540-993c-6b4b9295fd3b/stake status=200
[req] x-message-id=b7009390-8182-4e9b-9e27-b09eb897dab2 path=/api/v1/guides/d392bb0f-8209-4540-993c-6b4b9295fd3b/stake status=200
[req] x-request-id=a0b553be-a9c8-48bf-87de-9baaa15e7b30 path=/api/v1/orders status=200
[req] x-message-id=d8b0aadc-3731-4da7-9634-9fdf5fa74dc5 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=ab41caf9-b1f4-4702-80f6-8617c9fd5a05 order_id=5270cbce-d750-493f-822c-539025775d47
[req] x-request-id=2cd03056-f208-4825-b336-9a39ddff121f path=/api/v1/orders/5270cbce-d750-493f-822c-539025775d47/accept status=200
[req] x-message-id=cbc70f78-e022-49ab-a5ad-e7fe6e549aae path=/api/v1/orders/5270cbce-d750-493f-822c-539025775d47/accept status=200
[req] x-request-id=53dfdb7c-7fad-403c-a5f1-445c8d5b69ab path=/api/v1/orders/5270cbce-d750-493f-822c-539025775d47/mock-pay status=200
[req] x-message-id=f411141b-68e9-4480-b618-c7444063f1ba path=/api/v1/orders/5270cbce-d750-493f-822c-539025775d47/mock-pay status=200
[req] x-request-id=21c36213-cafc-497d-a473-e177c1f6379d path=/api/v1/orders/5270cbce-d750-493f-822c-539025775d47 status=200
[req] x-message-id=1d8a1418-87c1-4fc8-9bec-35c127062761 path=/api/v1/orders/5270cbce-d750-493f-822c-539025775d47 status=200
[req] x-request-id=19cf2449-f1a8-41a4-b076-6141b2ece55e path=/api/v1/orders/5270cbce-d750-493f-822c-539025775d47/dispute status=200
[req] x-message-id=7f6b9fe8-13a0-42d3-9975-ced1bc5a365b path=/api/v1/orders/5270cbce-d750-493f-822c-539025775d47/dispute status=200
[req] x-request-id=a1202502-fb41-4eaa-ac94-d8c01df10a62 path=/api/v1/disputes status=200
[req] x-message-id=4347959a-1819-4836-a54d-9ffffef4dcd6 path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
