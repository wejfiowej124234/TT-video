# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.56s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b0313d5c-4a67-42ab-a4d2-8f24e5f68920 path=/auth/register status=200
[req] x-message-id=279da74d-1c21-4cb0-9ea9-7d46e1a36c9d path=/auth/register status=200
[req] x-request-id=8ece3a10-69ba-436d-9f0e-44ae3067bdb0 path=/auth/register status=200
[req] x-message-id=9252bee4-568c-4f6b-bf2e-cae6e7378e89 path=/auth/register status=200
[req] x-request-id=26be15ba-0c6a-4430-b3a6-da0634738cb5 path=/api/v1/guides status=200
[req] x-message-id=c8e9a4fc-cee1-4dd6-93f8-85ac4519b80e path=/api/v1/guides status=200
[req] x-request-id=451a9f8c-c5ee-483d-acde-bf890b7ece38 path=/api/v1/guides/75cae4cf-1424-4c8e-afd1-bd780adcae9d/stake status=200
[req] x-message-id=b55e0610-8e74-4b19-9284-f5bc3f81eaee path=/api/v1/guides/75cae4cf-1424-4c8e-afd1-bd780adcae9d/stake status=200
[req] x-request-id=aaf21156-4c13-4cf8-9419-7331488971da path=/api/v1/orders status=200
[req] x-message-id=20373bf5-a4f7-4d67-91c8-36d0d164ab5c path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=97f72876-3c10-4a2b-8ed1-0ca57f2e92fa order_id=abc089da-eb15-4276-a726-dd68fab3cf3d
[req] x-request-id=e99168e5-2a35-4455-891f-e08fd67694ba path=/api/v1/orders/abc089da-eb15-4276-a726-dd68fab3cf3d/accept status=200
[req] x-message-id=afdc6cbb-5335-4d0f-bca6-6b188468ad3a path=/api/v1/orders/abc089da-eb15-4276-a726-dd68fab3cf3d/accept status=200
[req] x-request-id=dde3f069-a040-4277-97b0-fd78c0da9470 path=/api/v1/orders/abc089da-eb15-4276-a726-dd68fab3cf3d/mock-pay status=200
[req] x-message-id=4a62e242-9e06-4f2c-bf19-0afe4c0c5559 path=/api/v1/orders/abc089da-eb15-4276-a726-dd68fab3cf3d/mock-pay status=200
[req] x-request-id=ce10dba6-4a81-421a-93cd-032d84d5220a path=/api/v1/orders/abc089da-eb15-4276-a726-dd68fab3cf3d status=200
[req] x-message-id=79a85cc1-3ca6-4e09-9f40-b897f6697094 path=/api/v1/orders/abc089da-eb15-4276-a726-dd68fab3cf3d status=200
[req] x-request-id=8657825c-8e0b-4fa2-81a8-4ff80bb3f8f9 path=/api/v1/orders/abc089da-eb15-4276-a726-dd68fab3cf3d/dispute status=200
[req] x-message-id=42e112cf-085f-4221-9df0-e28531f768f0 path=/api/v1/orders/abc089da-eb15-4276-a726-dd68fab3cf3d/dispute status=200
[req] x-request-id=043808e7-305b-457e-9fe1-67f7c5fde7a4 path=/auth/register status=200
[req] x-message-id=5964ddd1-5ee4-49b1-aa53-c7476a4a2204 path=/auth/register status=200
[req] x-request-id=bc748ceb-5be8-4849-83bd-2f08e3e8036d path=/api/v1/disputes/502a1cf4-e465-422b-8eae-2e8ee528f187/resolve status=200
[req] x-message-id=1b8bb964-dc0b-4aeb-88c5-9d240656de62 path=/api/v1/disputes/502a1cf4-e465-422b-8eae-2e8ee528f187/resolve status=200
[req] x-request-id=bea7ccb3-8c73-4644-b9d9-4e3b5ac1e9e3 path=/api/v1/disputes/502a1cf4-e465-422b-8eae-2e8ee528f187 status=200
[req] x-message-id=d53bb9df-ddf2-43d7-a45b-cafaf3b8bf5a path=/api/v1/disputes/502a1cf4-e465-422b-8eae-2e8ee528f187 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
