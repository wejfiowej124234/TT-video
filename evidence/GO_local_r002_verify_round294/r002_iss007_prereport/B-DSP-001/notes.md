# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3d260153-51ed-4e76-9c24-6a7b3de59f32 path=/auth/register status=200
[req] x-message-id=21df85e4-2412-46f7-9341-51bbd4c035a8 path=/auth/register status=200
[req] x-request-id=d2fafd2d-d8d8-45d5-96cf-3e81c377aff7 path=/auth/register status=200
[req] x-message-id=fdd2c88b-fa79-4824-a91d-b38297264d53 path=/auth/register status=200
[req] x-request-id=260b2524-6dbd-44dd-bfe0-e171329d226c path=/api/v1/guides status=200
[req] x-message-id=03bc9c1c-c9b8-4225-a32f-c547155f9fd4 path=/api/v1/guides status=200
[req] x-request-id=777fcc33-8117-451a-b795-39c99a285212 path=/api/v1/guides/977acb18-5aae-4ffd-bd16-0d1e05ca905c/stake status=200
[req] x-message-id=89885b52-3fda-4cc3-acfd-23d25f50f87d path=/api/v1/guides/977acb18-5aae-4ffd-bd16-0d1e05ca905c/stake status=200
[req] x-request-id=6293d364-8a11-4131-895d-279fb6abd6bd path=/api/v1/orders status=200
[req] x-message-id=554a961c-3b80-4654-8f26-ec1fa4dea28d path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=6845a52f-ae41-4762-a7eb-dedcbdbf6983 order_id=0505cd16-dcbe-4f55-b4f7-3a4fea7ec632
[req] x-request-id=10bc5e94-e1fc-42ce-a284-b4afc1634114 path=/api/v1/orders/0505cd16-dcbe-4f55-b4f7-3a4fea7ec632/accept status=200
[req] x-message-id=505610cd-5ec1-4004-ac44-40881d7c5b6d path=/api/v1/orders/0505cd16-dcbe-4f55-b4f7-3a4fea7ec632/accept status=200
[req] x-request-id=15b61b23-cbff-415f-82fd-d2e9c8a92ed9 path=/api/v1/orders/0505cd16-dcbe-4f55-b4f7-3a4fea7ec632/mock-pay status=200
[req] x-message-id=330be7f2-38c5-4321-9604-26be22a54434 path=/api/v1/orders/0505cd16-dcbe-4f55-b4f7-3a4fea7ec632/mock-pay status=200
[req] x-request-id=1e3c041a-b08a-4a37-94ea-78eaa0d7d941 path=/api/v1/orders/0505cd16-dcbe-4f55-b4f7-3a4fea7ec632 status=200
[req] x-message-id=b5caea63-41d7-468b-b075-3c355ae1bb86 path=/api/v1/orders/0505cd16-dcbe-4f55-b4f7-3a4fea7ec632 status=200
[req] x-request-id=8b841ec7-992f-4812-84d6-243bd74c4609 path=/api/v1/orders/0505cd16-dcbe-4f55-b4f7-3a4fea7ec632/dispute status=200
[req] x-message-id=ce2405e4-29bd-47ce-a0fe-04433a98b7f1 path=/api/v1/orders/0505cd16-dcbe-4f55-b4f7-3a4fea7ec632/dispute status=200
[req] x-request-id=5782610e-6cd7-433b-aa3e-eff553e09e61 path=/api/v1/disputes status=200
[req] x-message-id=85bd05d9-2d99-49f0-8b16-1cf5f1ec9846 path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
