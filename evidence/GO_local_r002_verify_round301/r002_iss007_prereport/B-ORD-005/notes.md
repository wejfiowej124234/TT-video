# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.57s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=e9e2bc45-2660-4602-ae12-2adb9c7b7e8e path=/auth/register status=200
[req] x-message-id=46003f62-ce0b-4221-bac4-f2d5bcaeac02 path=/auth/register status=200
[req] x-request-id=ee9fc0b2-0379-4d15-8c11-e14cfb9285bb path=/api/v1/itineraries status=200
[req] x-message-id=c557a0e8-bd71-4791-89d1-1849dc4d0115 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=d61a1258-c4bd-4964-b4c0-90bbfd66f4f9 order_id=0d0a64d3-c5e6-4b25-8666-0eb36dbde7cc
[req] x-request-id=1e9b9165-92fe-48b9-8bd1-d2528399a6fc path=/api/v1/orders/0d0a64d3-c5e6-4b25-8666-0eb36dbde7cc/confirm-final-plan status=200
[req] x-message-id=c2667a63-7169-4014-84a3-8305fdc311c3 path=/api/v1/orders/0d0a64d3-c5e6-4b25-8666-0eb36dbde7cc/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
