# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=482dfdda-6bd5-4989-b143-7ffd4be74fae path=/auth/register status=200
[req] x-message-id=cb462da9-7765-44b1-93b6-3e6c7ef27c36 path=/auth/register status=200
[req] x-request-id=15aa6639-f602-4749-9618-798928552e83 path=/api/v1/itineraries status=200
[req] x-message-id=99997e02-cc5d-410e-8caa-7a13a33bc9a1 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=45ae6251-bf7c-47b8-9715-9e5ff6632a0a order_id=b2a525b4-f12f-432c-9f7c-14a51756ac6f
[req] x-request-id=367ec14f-7dd1-45c7-809f-dab2126281f8 path=/api/v1/orders/b2a525b4-f12f-432c-9f7c-14a51756ac6f/confirm-final-plan status=200
[req] x-message-id=f78ea80c-6f15-4f94-9c28-ce4e146cfc86 path=/api/v1/orders/b2a525b4-f12f-432c-9f7c-14a51756ac6f/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
