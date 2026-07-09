# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.60s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=8c81651d-a604-42a6-81bb-db65bb50466d path=/auth/register status=200
[req] x-message-id=c9ac9e53-e383-4f98-8f52-2eabc416cf61 path=/auth/register status=200
[req] x-request-id=effc0f3e-8fb7-4783-abaf-14660ee766df path=/api/v1/itineraries status=200
[req] x-message-id=77c9a2f2-6988-4f0b-924e-b52d42b16cdc path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=a9c1ebe1-826b-412a-9870-258b588f4265 order_id=5ddccc42-502b-414c-ba02-23ca7ef0a7c2
[req] x-request-id=7788f557-f388-4b7f-ad93-22c906d3f14c path=/api/v1/orders/5ddccc42-502b-414c-ba02-23ca7ef0a7c2/confirm-final-plan status=200
[req] x-message-id=9c1af0f2-2d76-4645-8363-e0da6a4fa881 path=/api/v1/orders/5ddccc42-502b-414c-ba02-23ca7ef0a7c2/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
