# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.56s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ffa8e5d4-cc4f-41b0-ad3d-34283b5ee717 path=/auth/register status=200
[req] x-message-id=4f1182d8-78d0-4ce9-936c-fc3a8e9e085f path=/auth/register status=200
[req] x-request-id=b8da7698-3497-4b14-8572-86780e16fc15 path=/api/v1/itineraries status=200
[req] x-message-id=123995a7-a0a3-4ee7-86a8-1e5913039f19 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=85603d18-bb71-485f-b8dc-ead499884e03 order_id=99ec7b27-6d50-4d27-933b-b20e803d4f6e
[req] x-request-id=672e3513-811e-4bc1-9a0c-5f327f9efc6a path=/api/v1/orders/99ec7b27-6d50-4d27-933b-b20e803d4f6e/confirm-final-plan status=200
[req] x-message-id=a364e592-9a07-45b6-a95a-c613451b8dfe path=/api/v1/orders/99ec7b27-6d50-4d27-933b-b20e803d4f6e/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
