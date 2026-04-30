# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.56s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=238058cb-7d30-4cae-b77c-4160f332a7a0 path=/auth/register status=200
[req] x-message-id=1f64fa45-2e9f-4908-9ec8-e2138cdedd25 path=/auth/register status=200
[req] x-request-id=3d5aac51-3040-4686-8f64-e51aba2a558f path=/auth/register status=200
[req] x-message-id=694d8082-0fdf-4fb0-86f6-4554c92f2629 path=/auth/register status=200
[req] x-request-id=ad3b6134-00c0-46b1-b234-faa0978a5fe2 path=/api/v1/guides status=200
[req] x-message-id=abe459aa-de40-4c64-b5aa-4753e9207a66 path=/api/v1/guides status=200
[req] x-request-id=f6a2ec3b-78f1-4fc1-abc8-c0031dd073b4 path=/api/v1/guides/133dd2dc-8b26-41cc-b06e-4f246c634dac/stake status=200
[req] x-message-id=8d5d6ac0-9229-473e-8d9e-db0504aafaf8 path=/api/v1/guides/133dd2dc-8b26-41cc-b06e-4f246c634dac/stake status=200
[req] x-request-id=e7a61e3f-e7d6-4a6f-8177-de431027407c path=/api/v1/orders status=200
[req] x-message-id=ff6e4886-bb31-41af-9e59-d333099fe66f path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=843d6eec-953d-4365-8861-eadd86011d49 order_id=88b5ec37-4341-41b3-9831-fdfc24e4347d
[req] x-request-id=ed9757e1-bac5-42d6-b9bb-418a283e41bf path=/api/v1/orders/88b5ec37-4341-41b3-9831-fdfc24e4347d/accept status=200
[req] x-message-id=dabae320-97e5-487e-8c9c-890df8eb43b9 path=/api/v1/orders/88b5ec37-4341-41b3-9831-fdfc24e4347d/accept status=200
[req] x-request-id=aa5efa76-451c-4026-994d-e6555b06db5c path=/api/v1/orders/88b5ec37-4341-41b3-9831-fdfc24e4347d/mock-pay status=200
[req] x-message-id=a9a989af-de62-47da-8a4e-854d8dbf2a01 path=/api/v1/orders/88b5ec37-4341-41b3-9831-fdfc24e4347d/mock-pay status=200
[req] x-request-id=3b5bca71-377c-4d2d-946c-7543cdc17bf3 path=/api/v1/orders/88b5ec37-4341-41b3-9831-fdfc24e4347d status=200
[req] x-message-id=6aae3192-0a41-499f-8988-94023f31864e path=/api/v1/orders/88b5ec37-4341-41b3-9831-fdfc24e4347d status=200
[req] x-request-id=7a2e2fd7-2806-4512-b8cb-1ca30ea1fb61 path=/api/v1/orders/88b5ec37-4341-41b3-9831-fdfc24e4347d/dispute status=200
[req] x-message-id=e16edcc1-efc2-4284-bba1-10fdd55d9c59 path=/api/v1/orders/88b5ec37-4341-41b3-9831-fdfc24e4347d/dispute status=200
[req] x-request-id=e1415ce7-ec7d-4073-ba92-98ed0acd1b19 path=/auth/register status=200
[req] x-message-id=5c380839-db80-4a36-b545-e28663b8590c path=/auth/register status=200
[req] x-request-id=1028ed80-ccbf-4abf-b410-ed2f7ba4299e path=/api/v1/disputes/8dd4ad79-c6d1-4801-a09a-d98f88eb1efa/resolve status=200
[req] x-message-id=263d44cf-41bc-4d13-a2d1-0a8e61da9b69 path=/api/v1/disputes/8dd4ad79-c6d1-4801-a09a-d98f88eb1efa/resolve status=200
[req] x-request-id=e7c88497-27e7-42a9-8806-8580c22c1ce9 path=/api/v1/disputes/8dd4ad79-c6d1-4801-a09a-d98f88eb1efa status=200
[req] x-message-id=2113d68c-545c-414e-8d40-67de88051145 path=/api/v1/disputes/8dd4ad79-c6d1-4801-a09a-d98f88eb1efa status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
