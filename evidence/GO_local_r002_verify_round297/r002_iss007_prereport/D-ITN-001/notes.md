# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=6c541661-495f-44f2-87cc-e8be9f6635a2 path=/auth/register status=200
[req] x-message-id=02634cf2-52df-4c76-b575-7e713e2030a5 path=/auth/register status=200
[req] x-request-id=27659961-4138-4483-819f-a21041ad0b7c path=/api/v1/itineraries status=200
[req] x-message-id=a14c0501-2b26-4b4d-8092-71a5ed304c01 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=dafdec92-bb7d-4e1b-a67d-39e1ab3c25d8 order_id=85776157-530e-48fb-b5f5-0edf315b0e88
[req] x-request-id=f89a29f5-9467-454c-9195-7b99829c7d26 path=/api/v1/orders/85776157-530e-48fb-b5f5-0edf315b0e88/itinerary status=200
[req] x-message-id=5dde8c21-c94b-44d9-bfce-30a52cffd3b6 path=/api/v1/orders/85776157-530e-48fb-b5f5-0edf315b0e88/itinerary status=200
[req] x-request-id=f8c4533a-aa5f-40c5-90df-ba3f2e9dc5ee path=/api/v1/orders/85776157-530e-48fb-b5f5-0edf315b0e88 status=200
[req] x-message-id=477ff3b3-2bc5-483c-88c5-db04c1af99f8 path=/api/v1/orders/85776157-530e-48fb-b5f5-0edf315b0e88 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
