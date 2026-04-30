# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.04s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=2010dcbb-c6bb-4184-bb46-3ecfc878229a path=/auth/register status=200
[req] x-message-id=e9ffd095-a884-441a-8baf-9c5582bdbb62 path=/auth/register status=200
[req] x-request-id=ee075394-e746-4b09-8625-e0855d87135f path=/auth/register status=200
[req] x-message-id=05e47e59-5428-448f-b1c1-854cdc29cb45 path=/auth/register status=200
[req] x-request-id=da39cf9f-6755-41a5-9fc0-c391a6408a7c path=/api/v1/guides status=200
[req] x-message-id=6ba9e36a-3ae3-4968-ad23-d37df4f95f2c path=/api/v1/guides status=200
[req] x-request-id=e1342f02-2f0a-48ee-bc01-ac7dfa37963e path=/api/v1/guides/d3b8516a-4dd4-4ee5-99cc-a70f007a105d/stake status=200
[req] x-message-id=b2efd1fd-a389-432f-b2c5-d7f25606981d path=/api/v1/guides/d3b8516a-4dd4-4ee5-99cc-a70f007a105d/stake status=200
[req] x-request-id=de17f6b0-5d8d-4d25-8d68-be5d3f6552a6 path=/api/v1/orders status=200
[req] x-message-id=9815b2d4-abb6-4e7a-96e8-18e552111cac path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=c4464461-3921-4e71-8cda-2bf846c1f570 order_id=7f2e5ac0-1c66-4244-b6cf-accde932ea96
[req] x-request-id=aa0e0e5c-9500-4b2e-8cec-c7c43c0ecc77 path=/api/v1/orders/7f2e5ac0-1c66-4244-b6cf-accde932ea96/itinerary status=200
[req] x-message-id=7b9ed67f-2711-42da-9a64-7af76abcb8c3 path=/api/v1/orders/7f2e5ac0-1c66-4244-b6cf-accde932ea96/itinerary status=200
[req] x-request-id=36030354-ec50-496f-a220-90283e9d7380 path=/api/v1/orders/7f2e5ac0-1c66-4244-b6cf-accde932ea96 status=200
[req] x-message-id=dc46aa37-5164-4b6d-9b48-3579a2e37514 path=/api/v1/orders/7f2e5ac0-1c66-4244-b6cf-accde932ea96 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
