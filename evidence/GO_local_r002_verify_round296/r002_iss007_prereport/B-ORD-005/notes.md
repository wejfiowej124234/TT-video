# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=79565da1-6350-4863-b4b7-ca14633f84b5 path=/auth/register status=200
[req] x-message-id=873f971a-1331-4da9-b56a-e2270703ba26 path=/auth/register status=200
[req] x-request-id=229236aa-e3f5-4880-af69-72b2ff75e112 path=/api/v1/itineraries status=200
[req] x-message-id=1f2b3902-8765-45ff-990e-04b07a0dc2a9 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=a51fa00e-3b06-4271-b51e-6d6c45f2a940 order_id=3f166820-b676-442e-a923-e1475b6c515b
[req] x-request-id=05b0931a-6b07-47da-9407-8e7645b1cb78 path=/api/v1/orders/3f166820-b676-442e-a923-e1475b6c515b/confirm-final-plan status=200
[req] x-message-id=cfe0f9e7-5b89-4f10-b54c-822a5a6f463b path=/api/v1/orders/3f166820-b676-442e-a923-e1475b6c515b/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
