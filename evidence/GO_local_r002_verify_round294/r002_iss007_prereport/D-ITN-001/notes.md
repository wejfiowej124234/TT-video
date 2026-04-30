# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=04a6aea1-9273-4409-9c1f-183395e44865 path=/auth/register status=200
[req] x-message-id=0dbb72af-36ee-4bb7-b344-bf6e42e434ba path=/auth/register status=200
[req] x-request-id=74c0710f-f168-45ee-be3d-ec0c8e18fb16 path=/api/v1/itineraries status=200
[req] x-message-id=d5595ee6-d5db-4d84-b39d-6d8dc2d55fda path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=6c263170-73ae-4aa4-ba85-e378a74bd7a0 order_id=f16b2a66-5c04-4144-ba30-0c49a11edc5d
[req] x-request-id=a3f8aea4-ef3f-467f-b4f6-09c6fdabf5fe path=/api/v1/orders/f16b2a66-5c04-4144-ba30-0c49a11edc5d/itinerary status=200
[req] x-message-id=a517f2ec-a7d3-4a7d-80ca-cca73af0c462 path=/api/v1/orders/f16b2a66-5c04-4144-ba30-0c49a11edc5d/itinerary status=200
[req] x-request-id=0d31feb2-c868-4969-bb58-066fa65d39bb path=/api/v1/orders/f16b2a66-5c04-4144-ba30-0c49a11edc5d status=200
[req] x-message-id=8ef1f8cb-ee7a-4f40-afe1-4cf331e4910a path=/api/v1/orders/f16b2a66-5c04-4144-ba30-0c49a11edc5d status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
