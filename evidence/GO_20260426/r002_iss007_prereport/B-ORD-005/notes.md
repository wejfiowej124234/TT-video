# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.39s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=370cd134-8303-4afa-962b-939ed6aef9cc path=/auth/register status=200
[req] x-message-id=37bf51b4-9dd3-4392-878d-c99d2e3ad9c2 path=/auth/register status=200
[req] x-request-id=998fe92d-0116-4460-8ae5-e15bd9b54701 path=/api/v1/itineraries status=200
[req] x-message-id=3e704b39-7d93-48bf-a1bf-fc393bff31c8 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=725876e0-be37-4fa5-a9e9-3df11cf899d2 order_id=af885ff7-bca3-4fa8-86d9-549d778e90b6
[req] x-request-id=de5b500b-0e79-488a-999f-0c569baa96f7 path=/api/v1/orders/af885ff7-bca3-4fa8-86d9-549d778e90b6/confirm-final-plan status=200
[req] x-message-id=daae5352-dc5a-43a7-bd8e-54ed6d1cad95 path=/api/v1/orders/af885ff7-bca3-4fa8-86d9-549d778e90b6/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
