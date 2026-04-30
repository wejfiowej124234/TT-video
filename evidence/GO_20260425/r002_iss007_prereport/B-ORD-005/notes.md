# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=e237ed64-1b7b-4c3f-b597-67267cad1fe9 path=/auth/register status=200
[req] x-message-id=655211d6-ef2e-45b7-b7ef-8f3a53c2b8b0 path=/auth/register status=200
[req] x-request-id=977f92d1-9675-490b-aaff-22f582aa328d path=/api/v1/itineraries status=200
[req] x-message-id=e019e282-d1c9-4f92-8d37-1a493107ee14 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=77652499-2c9e-4348-9443-16fce975d596 order_id=b10cff71-127a-4112-8237-0f8605ffdf6f
[req] x-request-id=17ac2596-559f-4318-b16d-a3e0cae163b7 path=/api/v1/orders/b10cff71-127a-4112-8237-0f8605ffdf6f/confirm-final-plan status=200
[req] x-message-id=09652edb-d2ea-44b5-9275-9a2d6468cae3 path=/api/v1/orders/b10cff71-127a-4112-8237-0f8605ffdf6f/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
