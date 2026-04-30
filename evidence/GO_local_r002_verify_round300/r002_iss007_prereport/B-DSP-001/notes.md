# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=2904b85e-cb48-4363-9420-312c3a60b75f path=/auth/register status=200
[req] x-message-id=6b11f2a5-c39f-4437-bb57-0aba5d571a5d path=/auth/register status=200
[req] x-request-id=a71df21a-a0f2-4aa3-b442-9dc69bb91868 path=/auth/register status=200
[req] x-message-id=be723329-acc9-48ce-9249-d19bd84030c6 path=/auth/register status=200
[req] x-request-id=34624855-1348-4ceb-8eb7-d86ccbaf0a83 path=/api/v1/guides status=200
[req] x-message-id=ea865718-e123-4763-ad6c-4dddb1232ec5 path=/api/v1/guides status=200
[req] x-request-id=65d8d1e0-204a-4ef7-9d37-d47b7b081253 path=/api/v1/guides/fda9aa9b-af9f-4f39-8ab5-4394d73b0242/stake status=200
[req] x-message-id=1945d6f0-4541-43d2-9223-c6f3c33f2488 path=/api/v1/guides/fda9aa9b-af9f-4f39-8ab5-4394d73b0242/stake status=200
[req] x-request-id=e5d522ec-7a33-4e5b-98b1-2de65e7d7613 path=/api/v1/orders status=200
[req] x-message-id=ac7590b0-ee7f-4dd4-ac9f-a5a73e18238a path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=d308277e-d0cf-42a0-b034-c8e7e4c5b7c6 order_id=5126e7b3-50c3-4023-b1da-c6ed774ed766
[req] x-request-id=a8b4426d-c630-4670-b247-8bdbe78b27b0 path=/api/v1/orders/5126e7b3-50c3-4023-b1da-c6ed774ed766/accept status=200
[req] x-message-id=01c00f9a-6833-4ac2-970e-d3dc23fff97a path=/api/v1/orders/5126e7b3-50c3-4023-b1da-c6ed774ed766/accept status=200
[req] x-request-id=acc4d9e0-202f-49fe-a3af-b62163547eef path=/api/v1/orders/5126e7b3-50c3-4023-b1da-c6ed774ed766/mock-pay status=200
[req] x-message-id=7c9b3349-aac4-4bae-90f6-e9ce430122e3 path=/api/v1/orders/5126e7b3-50c3-4023-b1da-c6ed774ed766/mock-pay status=200
[req] x-request-id=7e2378ce-b727-4b9c-a47b-4e8976380f72 path=/api/v1/orders/5126e7b3-50c3-4023-b1da-c6ed774ed766 status=200
[req] x-message-id=8b7288ba-7ec0-4802-a5f3-0a6ade94ae14 path=/api/v1/orders/5126e7b3-50c3-4023-b1da-c6ed774ed766 status=200
[req] x-request-id=0f2988ec-8e1a-4300-88a6-61e3ec77d62d path=/api/v1/orders/5126e7b3-50c3-4023-b1da-c6ed774ed766/dispute status=200
[req] x-message-id=fcd3abb7-01a0-416c-97fb-637cf69d8d02 path=/api/v1/orders/5126e7b3-50c3-4023-b1da-c6ed774ed766/dispute status=200
[req] x-request-id=cc245b09-6504-4b64-bc62-2c32c50ec736 path=/api/v1/disputes status=200
[req] x-message-id=5e7dbdce-493a-4350-96be-2ac3033170dd path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
