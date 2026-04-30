# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=31a16079-2349-468c-982e-51378c10f466 path=/auth/register status=200
[req] x-message-id=220792be-55ef-4292-8d76-5d0f3a9ef467 path=/auth/register status=200
[req] x-request-id=cee304cf-4d95-4383-9646-b61c15529d4a path=/auth/register status=200
[req] x-message-id=db5f747f-e83b-4d0f-aaa4-743629cb4c30 path=/auth/register status=200
[req] x-request-id=4b8ebbe3-8928-4b04-8fb4-98047bfb6cc7 path=/api/v1/guides status=200
[req] x-message-id=48b005b8-50db-4eaf-b8a6-f4d5c8b98593 path=/api/v1/guides status=200
[req] x-request-id=c1dc3cbd-3c10-41b9-8b86-1b7289c39139 path=/api/v1/guides/a3c49d73-831b-4c7b-b93d-ac3536fb739c/stake status=200
[req] x-message-id=6e5d2ec2-3a49-469f-9d8e-1d1e193ef543 path=/api/v1/guides/a3c49d73-831b-4c7b-b93d-ac3536fb739c/stake status=200
[req] x-request-id=b3ad0f96-7517-405d-8c17-522c86d788ed path=/api/v1/orders status=200
[req] x-message-id=aeef4db3-74a6-486d-b9b5-0ab920c0cb61 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=1ac777fe-b228-4a3c-bf9e-ec3d5c85cd2c order_id=b65d2453-7f81-4e68-8794-0a492b4d53d0
[req] x-request-id=ce758e2a-f46d-4590-9474-d5c9c89f3a52 path=/api/v1/orders/b65d2453-7f81-4e68-8794-0a492b4d53d0/accept status=200
[req] x-message-id=88263281-67b4-493d-a555-1d1ea8320df9 path=/api/v1/orders/b65d2453-7f81-4e68-8794-0a492b4d53d0/accept status=200
[req] x-request-id=ab8ff89d-af35-4307-8680-eb4287d78946 path=/api/v1/orders/b65d2453-7f81-4e68-8794-0a492b4d53d0/mock-pay status=200
[req] x-message-id=1513a2ce-ad2c-4309-9a3b-ea9db0b0c8bf path=/api/v1/orders/b65d2453-7f81-4e68-8794-0a492b4d53d0/mock-pay status=200
[req] x-request-id=1bd22b9d-a921-4d2b-8504-54f5219d9a5f path=/api/v1/orders/b65d2453-7f81-4e68-8794-0a492b4d53d0 status=200
[req] x-message-id=1b40130e-1e42-49f7-ab37-861302ebb1ba path=/api/v1/orders/b65d2453-7f81-4e68-8794-0a492b4d53d0 status=200
[req] x-request-id=d8269045-196f-4f06-83e8-d19971468f88 path=/api/v1/orders/b65d2453-7f81-4e68-8794-0a492b4d53d0/dispute status=200
[req] x-message-id=a23212b4-18ce-4e63-ac39-3c18fb0db6b2 path=/api/v1/orders/b65d2453-7f81-4e68-8794-0a492b4d53d0/dispute status=200
[req] x-request-id=a6196139-c71a-4663-baec-ceb37a0f1693 path=/auth/register status=200
[req] x-message-id=427c43cd-efca-4e09-8ff5-84ed3506115a path=/auth/register status=200
[req] x-request-id=f918fb7c-e131-4319-ac64-242492cd0b93 path=/api/v1/disputes/8b0f031c-47f9-444c-8155-f3e14c6a477f/resolve status=200
[req] x-message-id=0602787e-6452-433f-bac9-8ea924102a2b path=/api/v1/disputes/8b0f031c-47f9-444c-8155-f3e14c6a477f/resolve status=200
[req] x-request-id=6722c655-d8f5-4ba6-b54f-d25d6d8e5019 path=/api/v1/disputes/8b0f031c-47f9-444c-8155-f3e14c6a477f status=200
[req] x-message-id=5a49ceb0-f4c8-48a7-a965-5dc6bdee8839 path=/api/v1/disputes/8b0f031c-47f9-444c-8155-f3e14c6a477f status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
