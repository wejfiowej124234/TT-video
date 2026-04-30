# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.96s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=59389f8e-4a84-44df-b953-5376b2ccf52d path=/auth/register status=200
[req] x-message-id=5b91abda-cd2c-4c61-9351-16edb9c92663 path=/auth/register status=200
[req] x-request-id=06437315-bc61-4b84-a7a8-28f8c558532c path=/auth/register status=200
[req] x-message-id=ce7f35df-7e54-422a-8c7a-8b612c9e874c path=/auth/register status=200
[req] x-request-id=0d9ad34d-3794-4602-95c0-f4e04c3f843c path=/api/v1/guides status=200
[req] x-message-id=82f2ec7a-f31c-4172-8cf1-1fa11397b519 path=/api/v1/guides status=200
[req] x-request-id=3dfa1e0f-a524-4abe-85b5-771e51e077cd path=/api/v1/guides/e529b131-8450-4947-b820-46d8d67132bc/stake status=200
[req] x-message-id=60271cf3-a119-46fc-9544-b23d018c5de6 path=/api/v1/guides/e529b131-8450-4947-b820-46d8d67132bc/stake status=200
[req] x-request-id=b56ff48b-284d-4f14-a793-16322621e69d path=/api/v1/orders status=200
[req] x-message-id=1d468d7c-cb13-4196-ba51-2ee94597bb56 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=846dd347-156c-41bb-8d36-44b0f133711d order_id=b5a52621-6fa9-4c55-9610-2d34e61322d5
[req] x-request-id=50ba21e8-daf0-4305-899e-1e84045e73a9 path=/api/v1/orders/b5a52621-6fa9-4c55-9610-2d34e61322d5/accept status=200
[req] x-message-id=93f084ba-5106-45e3-9b87-41712afcaec9 path=/api/v1/orders/b5a52621-6fa9-4c55-9610-2d34e61322d5/accept status=200
[req] x-request-id=bdce344c-66d0-45ae-aa82-3e18b219c78d path=/api/v1/orders/b5a52621-6fa9-4c55-9610-2d34e61322d5/mock-pay status=200
[req] x-message-id=0f1d1a46-a03f-4083-873b-3fd628c1d5b6 path=/api/v1/orders/b5a52621-6fa9-4c55-9610-2d34e61322d5/mock-pay status=200
[req] x-request-id=9af6b27f-c141-4863-8dc4-e8a865ef1902 path=/api/v1/orders/b5a52621-6fa9-4c55-9610-2d34e61322d5 status=200
[req] x-message-id=33da9e81-27a9-472c-b2b4-42407005c11c path=/api/v1/orders/b5a52621-6fa9-4c55-9610-2d34e61322d5 status=200
[req] x-request-id=018cfecc-39d5-4b75-b696-aa7cdbddd706 path=/api/v1/orders/b5a52621-6fa9-4c55-9610-2d34e61322d5/dispute status=200
[req] x-message-id=520e4cc5-4906-47eb-9362-d9956aa41659 path=/api/v1/orders/b5a52621-6fa9-4c55-9610-2d34e61322d5/dispute status=200
[req] x-request-id=d1347d1c-444c-4fd9-b165-a1e8f6e7ed61 path=/auth/register status=200
[req] x-message-id=c061e635-4e4a-4576-b765-b365bb9d4661 path=/auth/register status=200
[req] x-request-id=c3a57b40-9ff6-4511-ad8b-ed8e573ea166 path=/api/v1/disputes/7b5cf852-b782-4b6a-a103-e6109423c0fd/resolve status=200
[req] x-message-id=1964c605-57ff-4493-9096-1ecdfc295d9c path=/api/v1/disputes/7b5cf852-b782-4b6a-a103-e6109423c0fd/resolve status=200
[req] x-request-id=a89388bf-8e68-467b-9877-649cf6af9e1a path=/api/v1/disputes/7b5cf852-b782-4b6a-a103-e6109423c0fd status=200
[req] x-message-id=f41c8b23-dd23-4bb0-b461-5abe97b96eef path=/api/v1/disputes/7b5cf852-b782-4b6a-a103-e6109423c0fd status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
