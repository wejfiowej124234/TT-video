# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.02s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=12483e3a-cd45-4d16-a5d5-090750e7e3ad path=/auth/register status=200
[req] x-message-id=78693b51-a91b-45d1-a763-6afac02d4e85 path=/auth/register status=200
[req] x-request-id=add9ff63-80a8-447f-942d-e2789c2fef2a path=/auth/register status=200
[req] x-message-id=572b52ad-8764-4a28-bd29-727da8c5b3ee path=/auth/register status=200
[req] x-request-id=d422db34-26aa-49b4-a56c-2a167b2b867a path=/api/v1/guides status=200
[req] x-message-id=72ccc04a-1a71-48e0-9ed8-008617760e89 path=/api/v1/guides status=200
[req] x-request-id=ce3b7767-58e0-4ff4-a2da-b8af18f0c095 path=/api/v1/guides/4239e645-fa32-4fee-aae3-2b09061b49f6/stake status=200
[req] x-message-id=75a25543-c975-4e26-91c2-455666a6d4ce path=/api/v1/guides/4239e645-fa32-4fee-aae3-2b09061b49f6/stake status=200
[req] x-request-id=3c947562-dae3-4a6e-ad84-3465d6eb9770 path=/api/v1/orders status=200
[req] x-message-id=f1913090-80b9-4907-aa2c-510f8d716d20 path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=ce3fd32d-9bab-4d0b-80f7-03c561d05cf8 order_id=3f24113b-055f-4638-bef0-a9e03be7bd26
[req] x-request-id=3900cc40-ae82-469d-928f-390a3a00faf7 path=/api/v1/orders/3f24113b-055f-4638-bef0-a9e03be7bd26/itinerary status=200
[req] x-message-id=099f1cb4-1385-431c-bc40-261109c06a38 path=/api/v1/orders/3f24113b-055f-4638-bef0-a9e03be7bd26/itinerary status=200
[req] x-request-id=8b4ff98e-4dfc-45bf-850e-e7c2097f1fa5 path=/api/v1/orders/3f24113b-055f-4638-bef0-a9e03be7bd26 status=200
[req] x-message-id=e5b799c9-bf16-4872-b778-c035579d8eca path=/api/v1/orders/3f24113b-055f-4638-bef0-a9e03be7bd26 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
