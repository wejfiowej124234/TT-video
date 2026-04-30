# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.57s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=047a676e-11a7-4be6-916e-056acb738966 path=/auth/register status=200
[req] x-message-id=70827047-e577-4cf7-8246-ab790cd6f5c1 path=/auth/register status=200
[req] x-request-id=84058386-88f5-4896-b396-f221b0e7b3d1 path=/api/v1/itineraries status=200
[req] x-message-id=1c42bf95-afb5-4326-b663-67651e4892b5 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=d382e74f-0d43-4e5b-9b09-777ee4fe2b05 order_id=ad7e60d6-80a5-485d-8317-19008bc008f4
[req] x-request-id=31921aeb-a2ff-4dc1-9c94-4924ea7db5e5 path=/api/v1/orders/ad7e60d6-80a5-485d-8317-19008bc008f4/itinerary status=200
[req] x-message-id=99ade51b-5c76-4918-956c-bac4989ff136 path=/api/v1/orders/ad7e60d6-80a5-485d-8317-19008bc008f4/itinerary status=200
[req] x-request-id=f2f21ef7-c01b-4581-ad9f-ac2bd9e5bf91 path=/api/v1/orders/ad7e60d6-80a5-485d-8317-19008bc008f4 status=200
[req] x-message-id=83a05825-5074-4a6a-a43d-545c8d041332 path=/api/v1/orders/ad7e60d6-80a5-485d-8317-19008bc008f4 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
