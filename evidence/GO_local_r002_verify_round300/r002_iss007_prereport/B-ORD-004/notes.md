# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.02s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=627e7341-3ec5-4909-90ee-1b1ca125f5f1 path=/auth/register status=200
[req] x-message-id=87349406-90fe-4f02-ba48-8a299f356df3 path=/auth/register status=200
[req] x-request-id=3e2b71c0-ae6a-43db-8391-b18d1b0460a0 path=/auth/register status=200
[req] x-message-id=23fdba8b-a727-48f2-a756-d354296488d8 path=/auth/register status=200
[req] x-request-id=1bc19519-1b16-4809-9c9d-e507c3b38a94 path=/api/v1/guides status=200
[req] x-message-id=846134d4-9de2-4841-837b-f3528221ea43 path=/api/v1/guides status=200
[req] x-request-id=2e1c58f2-b6a7-41dd-872c-f9462021a8cf path=/api/v1/guides/8db68d58-b468-4c4a-8b96-39f18311cd8e/stake status=200
[req] x-message-id=396ce542-c373-4b8a-8626-0cab9549e598 path=/api/v1/guides/8db68d58-b468-4c4a-8b96-39f18311cd8e/stake status=200
[req] x-request-id=c88d992f-fc9e-4151-ac70-a94461842195 path=/api/v1/orders status=200
[req] x-message-id=d896220b-6a3c-45c9-a88f-c23c7200bfee path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=4524e235-8903-4dc9-8618-c43720b9adc1 order_id=942b091d-8e63-47b1-910c-7fe02a6189c8
[req] x-request-id=b818040d-514e-404b-a5ee-1b479d0d9cab path=/api/v1/orders/942b091d-8e63-47b1-910c-7fe02a6189c8/itinerary status=200
[req] x-message-id=efa058bf-0160-4a5d-89fb-77c278e8a774 path=/api/v1/orders/942b091d-8e63-47b1-910c-7fe02a6189c8/itinerary status=200
[req] x-request-id=4f5d7fdc-8d70-4254-ac2b-c384bfdb3a4e path=/api/v1/orders/942b091d-8e63-47b1-910c-7fe02a6189c8 status=200
[req] x-message-id=b77ba937-c421-4b29-ac3b-98d407f189be path=/api/v1/orders/942b091d-8e63-47b1-910c-7fe02a6189c8 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
