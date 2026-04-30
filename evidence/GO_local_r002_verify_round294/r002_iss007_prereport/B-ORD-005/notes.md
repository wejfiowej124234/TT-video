# B-ORD-005

`cargo test -p traveltrust-api matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=c95bf591-36ff-4f8c-a8bb-138089597bc7 path=/auth/register status=200
[req] x-message-id=62782ad3-5ab7-44a2-b221-f0f4044eed75 path=/auth/register status=200
[req] x-request-id=fca7d940-b6d7-4754-9f92-9bb5d85648b6 path=/api/v1/itineraries status=200
[req] x-message-id=d74ec345-de13-4f88-b464-3b2b1a359282 path=/api/v1/itineraries status=200
audit_key_write op=confirm_final_plan request_id=- user_id=17ca1166-7f68-4d26-b4a3-184bd4c2c61b order_id=4f9be974-a049-4539-aea8-343c0b91d2de
[req] x-request-id=baf2d263-b044-4044-bdcd-d1df2e1d8c12 path=/api/v1/orders/4f9be974-a049-4539-aea8-343c0b91d2de/confirm-final-plan status=200
[req] x-message-id=9d5e0c9f-de3d-42a6-97fa-c88e7b1470f6 path=/api/v1/orders/4f9be974-a049-4539-aea8-343c0b91d2de/confirm-final-plan status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-013 · POST …/confirm-final-plan returns snapshot_hash
