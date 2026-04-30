# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.39s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=893505e1-03bf-476e-9da0-a2a1a654e341 path=/auth/register status=200
[req] x-message-id=5e4f3310-1282-4425-946b-d0ede2fd4aea path=/auth/register status=200
[req] x-request-id=d5658a1c-bf06-42e7-b8e5-83cb3d1d3cd9 path=/api/v1/itineraries status=200
[req] x-message-id=42136725-4323-4f55-8b57-e9baa1bdd4a7 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=0b02a3ca-aef2-4d6a-8668-c8ec64e62366 order_id=b2c21c25-66a9-4985-8771-61724f57ba66
[req] x-request-id=6c18b7bf-ac3b-4364-8e9e-82b5fd8db982 path=/api/v1/orders/b2c21c25-66a9-4985-8771-61724f57ba66/itinerary status=200
[req] x-message-id=198fc435-4394-443a-b09b-f4bb2332fe6d path=/api/v1/orders/b2c21c25-66a9-4985-8771-61724f57ba66/itinerary status=200
[req] x-request-id=7b2743d5-0863-4364-8e46-2ef05ca70c7f path=/api/v1/orders/b2c21c25-66a9-4985-8771-61724f57ba66 status=200
[req] x-message-id=fcf8b202-944d-476e-9418-8f6250ed02a7 path=/api/v1/orders/b2c21c25-66a9-4985-8771-61724f57ba66 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
