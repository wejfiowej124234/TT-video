# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.63s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=8fde6b06-d945-46f0-99f6-5ee02d32871e path=/auth/register status=200
[req] x-message-id=7b6a6f37-66f3-4d2d-a53a-6aef62c56611 path=/auth/register status=200
[req] x-request-id=d614251e-4dd6-41d0-8bba-032f0db62449 path=/auth/register status=200
[req] x-message-id=da70da3d-b627-4785-a9d6-2a27c0dd1910 path=/auth/register status=200
[req] x-request-id=e69b2280-e6d6-48c2-9d6c-2503ec69b23a path=/api/v1/guides status=200
[req] x-message-id=9cbc8fca-4704-445f-972c-de77fd4c3362 path=/api/v1/guides status=200
[req] x-request-id=c0fa04eb-33f3-4fa7-a791-faec2ce43817 path=/api/v1/guides/ed07c3e2-8776-4b3e-97b6-d7ad4f588fc8/stake status=200
[req] x-message-id=00fbcf4b-fbb7-4c15-977a-67fe970a5894 path=/api/v1/guides/ed07c3e2-8776-4b3e-97b6-d7ad4f588fc8/stake status=200
[req] x-request-id=f77dd67f-1d52-48ea-b6ad-ec7eec9f0d60 path=/api/v1/orders status=200
[req] x-message-id=1cfdc802-2208-4b61-9a2e-2a06b7fdffa8 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=430abefe-5c49-4730-83f7-a51d6e6aebf6 order_id=99ec676c-e059-4b3c-aa9a-533235b80251
[req] x-request-id=4bc09d8c-ef24-4a64-93c8-c63a1454b713 path=/api/v1/orders/99ec676c-e059-4b3c-aa9a-533235b80251/accept status=200
[req] x-message-id=b49bd9ce-9d8b-4fdf-8733-702e37ed0523 path=/api/v1/orders/99ec676c-e059-4b3c-aa9a-533235b80251/accept status=200
[req] x-request-id=b1acbd72-5e6b-4f1f-9d88-cb5871cb6ab9 path=/api/v1/orders/99ec676c-e059-4b3c-aa9a-533235b80251/mock-pay status=200
[req] x-message-id=3088346b-b1e7-43a2-b8a4-2dee1c4749ed path=/api/v1/orders/99ec676c-e059-4b3c-aa9a-533235b80251/mock-pay status=200
[req] x-request-id=1b225ffe-45fb-4a24-a39e-b1c4f6aee62d path=/api/v1/orders/99ec676c-e059-4b3c-aa9a-533235b80251 status=200
[req] x-message-id=d2f8a46d-3aad-4421-a689-c54041af62cd path=/api/v1/orders/99ec676c-e059-4b3c-aa9a-533235b80251 status=200
[req] x-request-id=85c4ab33-fc01-4f29-a7a4-959286cef56f path=/api/v1/orders/99ec676c-e059-4b3c-aa9a-533235b80251/dispute status=200
[req] x-message-id=f7d83caa-cad2-4e8e-adaa-9d564343f923 path=/api/v1/orders/99ec676c-e059-4b3c-aa9a-533235b80251/dispute status=200
[req] x-request-id=d7697577-7f8e-411b-850e-bf46c5263344 path=/auth/register status=200
[req] x-message-id=2facf61c-2264-4edc-9972-e98a1c5012e7 path=/auth/register status=200
[req] x-request-id=3f50a4b4-2f9a-4c58-9b21-ed6f8bcd722b path=/api/v1/disputes/5a5a9feb-51eb-45ab-b48a-6714d53d0658/resolve status=200
[req] x-message-id=f0536925-60ef-4111-9259-2c6dd4faaf83 path=/api/v1/disputes/5a5a9feb-51eb-45ab-b48a-6714d53d0658/resolve status=200
[req] x-request-id=2598fbe4-b44f-4d16-b097-51dfef981fd5 path=/api/v1/disputes/5a5a9feb-51eb-45ab-b48a-6714d53d0658 status=200
[req] x-message-id=cf80cd08-8a90-46bb-b763-10ff73573b65 path=/api/v1/disputes/5a5a9feb-51eb-45ab-b48a-6714d53d0658 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
