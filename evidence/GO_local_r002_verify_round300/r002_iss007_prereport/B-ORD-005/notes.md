# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.63s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=71a3faf5-8092-4ee4-967c-cb62891735d7 path=/auth/register status=200
[req] x-message-id=a2a536f2-0d2b-4189-b9df-6b6e111ec3f3 path=/auth/register status=200
[req] x-request-id=89cc96f8-de36-4e2a-befe-81cab253dd5f path=/api/v1/itineraries status=200
[req] x-message-id=5bb2f6fd-c912-4b24-b31a-d8c2ae781dc7 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=83972259-fc5b-4ee2-b78a-e08c7a41f930 order_id=c99a3c62-52c8-4802-ac38-a88ceec9169f
[req] x-request-id=3e7937c3-9906-4861-9be5-56b515575f52 path=/api/v1/orders/c99a3c62-52c8-4802-ac38-a88ceec9169f/confirm-final-plan status=200
[req] x-message-id=c782e3e8-e1d8-4d44-971b-3b1238a496fd path=/api/v1/orders/c99a3c62-52c8-4802-ac38-a88ceec9169f/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
