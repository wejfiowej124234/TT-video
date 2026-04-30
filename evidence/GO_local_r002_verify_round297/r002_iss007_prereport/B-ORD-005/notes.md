# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=8a333da0-5d8a-4b17-a501-345b418cc0a0 path=/auth/register status=200
[req] x-message-id=c340364a-424d-4cee-8819-d105cfa22b22 path=/auth/register status=200
[req] x-request-id=fba8b2a3-c945-4fe1-ac9a-0e1dab400c43 path=/api/v1/itineraries status=200
[req] x-message-id=05be7293-bed9-4654-9e05-dcefff2c9d4f path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=f17439cb-1cfe-48b6-990a-43d4b7d38cbe order_id=40cac381-2c44-4470-b731-29d2d40e7056
[req] x-request-id=66e164c4-038e-4514-b893-a5eef3705f60 path=/api/v1/orders/40cac381-2c44-4470-b731-29d2d40e7056/confirm-final-plan status=200
[req] x-message-id=bd3ccad1-403c-4495-9481-9465dab7f8b8 path=/api/v1/orders/40cac381-2c44-4470-b731-29d2d40e7056/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
