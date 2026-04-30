# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ace3ee67-abf5-48d5-945f-07b78508e400 path=/auth/register status=200
[req] x-message-id=ad1d8423-1c87-420e-84e9-db322f0f6635 path=/auth/register status=200
[req] x-request-id=b2a6e063-0171-4339-83f0-c2504f99fbc6 path=/auth/register status=200
[req] x-message-id=3926cee4-759e-461c-a7e3-857419ad2219 path=/auth/register status=200
[req] x-request-id=d509c17f-2f82-4d7f-8128-0061b52eb26d path=/api/v1/guides status=200
[req] x-message-id=46c7254c-3910-43b1-8489-6f6d79b4bd51 path=/api/v1/guides status=200
[req] x-request-id=367a47fe-5ad6-453b-9056-0fe1db31684b path=/api/v1/guides/3c016e9e-8669-47ce-8a26-d3f4d407cd67/stake status=200
[req] x-message-id=1f23a5b7-ff16-487c-a8a0-d8d75e762c02 path=/api/v1/guides/3c016e9e-8669-47ce-8a26-d3f4d407cd67/stake status=200
[req] x-request-id=a182ee39-67c7-43b0-9191-d3573b2b03f3 path=/api/v1/orders status=200
[req] x-message-id=8d7ac89a-67eb-4a9d-99d9-0ded79112196 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=9ff448ec-04f4-47cb-bb9f-86eb91bed5e1 order_id=105e49a7-a8ec-4737-8364-b5bc9b22bc31
[req] x-request-id=e1f7bc6e-7b75-42f1-9408-c73443d4c3bc path=/api/v1/orders/105e49a7-a8ec-4737-8364-b5bc9b22bc31/accept status=200
[req] x-message-id=164ccb72-db4f-4453-a17b-49398e3dd9c4 path=/api/v1/orders/105e49a7-a8ec-4737-8364-b5bc9b22bc31/accept status=200
[req] x-request-id=5debe261-e540-447e-bb1b-98483d4c8201 path=/api/v1/orders/105e49a7-a8ec-4737-8364-b5bc9b22bc31/mock-pay status=200
[req] x-message-id=743faffc-b8a9-4d5f-9b74-67498bb1fe4c path=/api/v1/orders/105e49a7-a8ec-4737-8364-b5bc9b22bc31/mock-pay status=200
[req] x-request-id=354383b0-7342-413c-9868-91de4a8df154 path=/api/v1/orders/105e49a7-a8ec-4737-8364-b5bc9b22bc31 status=200
[req] x-message-id=dde814c3-8551-4c28-aa45-d5da94a2a1eb path=/api/v1/orders/105e49a7-a8ec-4737-8364-b5bc9b22bc31 status=200
[req] x-request-id=a7c5719a-e03a-4c75-af1c-6c12df3bcf1a path=/api/v1/orders/105e49a7-a8ec-4737-8364-b5bc9b22bc31/dispute status=200
[req] x-message-id=67b9afab-2b0a-43dd-abe1-634b01d8788b path=/api/v1/orders/105e49a7-a8ec-4737-8364-b5bc9b22bc31/dispute status=200
[req] x-request-id=8815cea5-9f47-4333-b973-b77f17c101d5 path=/api/v1/disputes status=200
[req] x-message-id=cb70695c-994a-4ed4-aac0-e1021ba3e4fd path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
