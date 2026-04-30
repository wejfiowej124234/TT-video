# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=a6495881-f2cf-41ca-9eea-df046365501e path=/auth/register status=200
[req] x-message-id=b590c8d7-3c56-4b1b-b089-34db01767f71 path=/auth/register status=200
[req] x-request-id=02917ebe-3191-41c6-9d34-f3660cd7bbec path=/auth/register status=200
[req] x-message-id=0f204a70-3272-485c-8c95-009f532c54fa path=/auth/register status=200
[req] x-request-id=c1941fdd-28d7-4a50-89fe-d06ada68fda9 path=/api/v1/guides status=200
[req] x-message-id=e1187cc2-29e2-4fd4-a2ce-766e87658f40 path=/api/v1/guides status=200
[req] x-request-id=e8e0cafa-ab09-42c3-9a76-1b44dd5ec242 path=/api/v1/guides/e482c97b-738f-4d4b-b666-8c7ff8fde5bf/stake status=200
[req] x-message-id=57f83742-f714-4180-8234-0809997f6419 path=/api/v1/guides/e482c97b-738f-4d4b-b666-8c7ff8fde5bf/stake status=200
[req] x-request-id=b1e01f41-5e2b-4325-997b-42b7ea11e828 path=/api/v1/orders status=200
[req] x-message-id=a405c393-aeb9-442d-9927-a0a98ecdb9df path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=ca8c292d-3c20-4e31-a3dc-5dda4c4b1467 order_id=72d017ef-e0df-4605-a46f-8d63c9c0ec24
[req] x-request-id=ac521178-625f-45bc-9b22-27a5b0d7c31c path=/api/v1/orders/72d017ef-e0df-4605-a46f-8d63c9c0ec24/itinerary status=200
[req] x-message-id=cd286c7e-9391-4703-8637-bb4e155f6ec5 path=/api/v1/orders/72d017ef-e0df-4605-a46f-8d63c9c0ec24/itinerary status=200
[req] x-request-id=4fe6220b-1d18-46c6-b201-f4a56fa85a6c path=/api/v1/orders/72d017ef-e0df-4605-a46f-8d63c9c0ec24 status=200
[req] x-message-id=4e254378-5c00-4b66-887d-d9f773291f62 path=/api/v1/orders/72d017ef-e0df-4605-a46f-8d63c9c0ec24 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
