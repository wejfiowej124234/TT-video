# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=2aacabdb-7643-45e5-bcb9-302e2b5e180e path=/auth/register status=200
[req] x-message-id=a0bac95f-9bb5-4876-80b5-906747500e0e path=/auth/register status=200
[req] x-request-id=d42fbbdb-7c44-4025-8e4f-fa964757730b path=/auth/register status=200
[req] x-message-id=41a3f517-fbcc-47e5-b6be-72a55d2d277f path=/auth/register status=200
[req] x-request-id=b19315a6-fff2-42ac-b3d8-fbc198bd01e0 path=/api/v1/guides status=200
[req] x-message-id=489d69ba-5490-4c58-9ac3-2790a407db6c path=/api/v1/guides status=200
[req] x-request-id=a6534bdb-e5b6-47b5-a118-7a5fb3573183 path=/api/v1/guides/d399eb4e-dc70-46ec-a67a-e6713bc8e677/stake status=200
[req] x-message-id=df0d6203-6127-40cd-8ef3-4c96ce68f4c8 path=/api/v1/guides/d399eb4e-dc70-46ec-a67a-e6713bc8e677/stake status=200
[req] x-request-id=53812712-327c-476c-b39f-4b13014171ff path=/api/v1/orders status=200
[req] x-message-id=beb64f86-b2d9-4522-86ef-e24845d582a7 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=6a37a5a8-4407-4a88-ba21-b1d2169a02bf order_id=6c389f52-e2d7-4bf1-924e-aa7c2fd74c03
[req] x-request-id=2831bf8b-1e73-405b-8870-031dd9ffc6ea path=/api/v1/orders/6c389f52-e2d7-4bf1-924e-aa7c2fd74c03/accept status=200
[req] x-message-id=3c8ba403-dc05-4325-aba5-a436ffee4723 path=/api/v1/orders/6c389f52-e2d7-4bf1-924e-aa7c2fd74c03/accept status=200
[req] x-request-id=fc5ee444-7625-47e6-ab37-63501cdf56b0 path=/api/v1/orders/6c389f52-e2d7-4bf1-924e-aa7c2fd74c03/mock-pay status=200
[req] x-message-id=d0e5496d-d873-41f0-8c8e-2246508cfff3 path=/api/v1/orders/6c389f52-e2d7-4bf1-924e-aa7c2fd74c03/mock-pay status=200
[req] x-request-id=6e5755dd-88b8-434d-9fa9-bfe5ef508432 path=/api/v1/orders/6c389f52-e2d7-4bf1-924e-aa7c2fd74c03 status=200
[req] x-message-id=b6feb778-393a-479c-92c0-e8545946348d path=/api/v1/orders/6c389f52-e2d7-4bf1-924e-aa7c2fd74c03 status=200
[req] x-request-id=a3fb1c44-fc3e-4539-989f-f2a145bcaf90 path=/api/v1/orders/6c389f52-e2d7-4bf1-924e-aa7c2fd74c03/dispute status=200
[req] x-message-id=68ecc9c0-f99c-41eb-90b4-233c10ebf4df path=/api/v1/orders/6c389f52-e2d7-4bf1-924e-aa7c2fd74c03/dispute status=200
[req] x-request-id=104add9c-2f39-48c1-812c-ac59e8591bd0 path=/auth/register status=200
[req] x-message-id=1e0b58cb-e64f-45cf-acf7-6a430e53402e path=/auth/register status=200
[req] x-request-id=f371919a-67d7-4b7f-8065-93a626da656b path=/api/v1/disputes/dd823855-93b8-43ec-94c1-7eb2563a727a/resolve status=200
[req] x-message-id=540bf443-11d7-4d47-9f5b-6823f2c3a285 path=/api/v1/disputes/dd823855-93b8-43ec-94c1-7eb2563a727a/resolve status=200
[req] x-request-id=1e5d91d0-6130-43b1-b44c-9e3d6877cd19 path=/api/v1/disputes/dd823855-93b8-43ec-94c1-7eb2563a727a status=200
[req] x-message-id=0b4028a4-752a-4213-8db8-d15aaa732064 path=/api/v1/disputes/dd823855-93b8-43ec-94c1-7eb2563a727a status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
