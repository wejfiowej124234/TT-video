# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.33s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=a8f9503e-a8b4-472a-9f90-2071a8ae3262 path=/auth/register status=200
[req] x-message-id=9146fbd5-1808-4ea1-b2e5-9bf182dc41dc path=/auth/register status=200
[req] x-request-id=0f57eb36-bf65-40f8-843a-5682bbc1fb12 path=/auth/register status=200
[req] x-message-id=d9174060-5152-44b3-8618-6bb451e7c6c2 path=/auth/register status=200
[req] x-request-id=850f6209-88d5-4e5d-a85b-9f77927bc949 path=/api/v1/guides status=200
[req] x-message-id=260c8320-5f6f-47fc-9062-2be67279cf5c path=/api/v1/guides status=200
[req] x-request-id=01810315-bb94-4c24-8186-d9d9a090e102 path=/api/v1/guides/16d3554c-58b2-4a4e-9111-7c1afb0ee9d8/stake status=200
[req] x-message-id=3905cdf8-93a1-4169-b35a-dde5c521ee49 path=/api/v1/guides/16d3554c-58b2-4a4e-9111-7c1afb0ee9d8/stake status=200
[req] x-request-id=3bad6791-c2f3-4489-980a-2ca4d4fb410c path=/api/v1/orders status=200
[req] x-message-id=25fa31a6-8315-4ac8-9c56-18fd3254624f path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=3a497910-760b-495c-9eb8-4d059a0748e8 order_id=2ed1e495-29ac-434a-a7ac-4b123c2cf902
[req] x-request-id=de1b3723-d40d-4aee-bb7e-68ea3a12cba7 path=/api/v1/orders/2ed1e495-29ac-434a-a7ac-4b123c2cf902/accept status=200
[req] x-message-id=39afb758-9be7-4d5d-98ef-579bb4be30b7 path=/api/v1/orders/2ed1e495-29ac-434a-a7ac-4b123c2cf902/accept status=200
[req] x-request-id=761a5865-d45c-4b46-8ade-989293c26fbd path=/api/v1/orders/2ed1e495-29ac-434a-a7ac-4b123c2cf902/mock-pay status=200
[req] x-message-id=628fa385-017f-480b-b89d-67db8cf3bd0f path=/api/v1/orders/2ed1e495-29ac-434a-a7ac-4b123c2cf902/mock-pay status=200
[req] x-request-id=2d5a6c92-7bb3-4b93-90ad-4de76ed574d9 path=/api/v1/orders/2ed1e495-29ac-434a-a7ac-4b123c2cf902 status=200
[req] x-message-id=e3b36d08-9233-4bb1-93d7-ccbf53d451d6 path=/api/v1/orders/2ed1e495-29ac-434a-a7ac-4b123c2cf902 status=200
[req] x-request-id=187bf3fa-3235-4b12-9209-85a90579f637 path=/api/v1/orders/2ed1e495-29ac-434a-a7ac-4b123c2cf902/dispute status=200
[req] x-message-id=8531cebb-4000-4ebb-96e0-a85ec3ebf2e3 path=/api/v1/orders/2ed1e495-29ac-434a-a7ac-4b123c2cf902/dispute status=200
[req] x-request-id=56e6bc79-a22f-4068-84d3-b61ce91c8878 path=/auth/register status=200
[req] x-message-id=bc8eee1d-8880-4ec3-a31c-2b851d2d8d43 path=/auth/register status=200
[req] x-request-id=0a2a595e-9695-4395-a830-b0d83bb640ec path=/api/v1/disputes/a7dcfc42-7fda-421b-a769-f8d49ae9c600/resolve status=200
[req] x-message-id=f1f9eaaa-abd2-4a62-bb33-b8c4121660c9 path=/api/v1/disputes/a7dcfc42-7fda-421b-a769-f8d49ae9c600/resolve status=200
[req] x-request-id=a4463b31-e306-49e5-abf9-187fa6fa6502 path=/api/v1/disputes/a7dcfc42-7fda-421b-a769-f8d49ae9c600 status=200
[req] x-message-id=de6273d4-12b2-4d64-ab4d-728911a68a09 path=/api/v1/disputes/a7dcfc42-7fda-421b-a769-f8d49ae9c600 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
