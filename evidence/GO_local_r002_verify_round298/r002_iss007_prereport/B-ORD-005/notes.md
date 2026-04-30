# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.61s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=768300f6-29b9-45c1-a924-c158e82a6d5f path=/auth/register status=200
[req] x-message-id=c8c32f45-0b24-4886-8905-77bd5a00ee17 path=/auth/register status=200
[req] x-request-id=07babfa4-23af-4b0b-a93a-9b93afef0fe0 path=/api/v1/itineraries status=200
[req] x-message-id=489a4cca-9357-4141-b21f-794f461b6760 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=0d655351-aa5c-41bf-959f-cf8cd5627188 order_id=41115b3f-ed0d-421b-b792-ac29cb732ebc
[req] x-request-id=71ee1d73-5cea-42ca-8439-247707a8666c path=/api/v1/orders/41115b3f-ed0d-421b-b792-ac29cb732ebc/confirm-final-plan status=200
[req] x-message-id=7e9fb639-350e-436c-847d-627ac349a3b7 path=/api/v1/orders/41115b3f-ed0d-421b-b792-ac29cb732ebc/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
