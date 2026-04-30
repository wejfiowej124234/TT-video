# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.57s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=95b3f541-8e37-40f1-82cf-0b97d3856f7e path=/auth/register status=200
[req] x-message-id=3da48b2a-3bc0-4124-a63b-4ec4e497c580 path=/auth/register status=200
[req] x-request-id=c519c280-fa32-4e65-a4c2-86173360c094 path=/api/v1/itineraries status=200
[req] x-message-id=3cfabbf3-3d5d-44c6-b8d4-75625d1f02d1 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=d78e9dbc-f615-4cce-9f80-f447d44b9625 order_id=dbb1c51f-5c9a-4dfc-bf00-8a9ecc320ba5
[req] x-request-id=cefdcc58-f898-4de0-a824-ea2829349c20 path=/api/v1/orders/dbb1c51f-5c9a-4dfc-bf00-8a9ecc320ba5/confirm-final-plan status=200
[req] x-message-id=ee5c1bc3-cdde-4da9-8dc0-7dd4c37cccbc path=/api/v1/orders/dbb1c51f-5c9a-4dfc-bf00-8a9ecc320ba5/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
