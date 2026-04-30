# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.57s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ce2c9c63-6c71-4182-a315-24a7a679d3cd path=/auth/register status=200
[req] x-message-id=37fee6f0-299b-4444-8308-bb913f58cd0d path=/auth/register status=200
[req] x-request-id=b50725d5-7247-4fc8-bf2f-aba5dd6895d8 path=/api/v1/itineraries status=200
[req] x-message-id=b33b830e-416b-4a69-9bac-40b01d8ac8a0 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=2685d4d0-0a4f-465b-bd26-d70b61f54758 order_id=85757f22-7777-4c9d-8035-442707365033
[req] x-request-id=ace546c2-76a1-4564-9488-fd3440fa6132 path=/api/v1/orders/85757f22-7777-4c9d-8035-442707365033/itinerary status=200
[req] x-message-id=4a498c7b-e783-4659-aad1-493498cd05f1 path=/api/v1/orders/85757f22-7777-4c9d-8035-442707365033/itinerary status=200
[req] x-request-id=80413004-9518-4dea-9f0a-36674f8d5c8e path=/api/v1/orders/85757f22-7777-4c9d-8035-442707365033 status=200
[req] x-message-id=c89b54bb-f698-4c66-9a66-f85445fef337 path=/api/v1/orders/85757f22-7777-4c9d-8035-442707365033 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
