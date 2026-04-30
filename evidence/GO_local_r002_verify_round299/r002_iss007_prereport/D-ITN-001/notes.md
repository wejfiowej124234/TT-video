# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=01c67665-5e12-4291-a974-37d55b0cd0af path=/auth/register status=200
[req] x-message-id=8e4128e6-4efe-42ec-a11e-b4092c2051c6 path=/auth/register status=200
[req] x-request-id=9a48411b-bee6-4c2f-af09-ff91ff1557db path=/api/v1/itineraries status=200
[req] x-message-id=75866307-3323-497f-8686-91e8aea640b2 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=400312a3-8315-4edd-bb15-ea622ae671fb order_id=8a355e87-8c16-4e38-ba96-a6e984fe3c92
[req] x-request-id=92f5ea30-c3f7-4189-a922-cee43bce45d8 path=/api/v1/orders/8a355e87-8c16-4e38-ba96-a6e984fe3c92/itinerary status=200
[req] x-message-id=03538ecf-213a-4b3d-af7a-dfd3c2b82bc4 path=/api/v1/orders/8a355e87-8c16-4e38-ba96-a6e984fe3c92/itinerary status=200
[req] x-request-id=ec3304a8-a7c6-4308-a212-6c92d595887d path=/api/v1/orders/8a355e87-8c16-4e38-ba96-a6e984fe3c92 status=200
[req] x-message-id=af9621ca-8647-4fbc-b9d4-71b33a46dd9d path=/api/v1/orders/8a355e87-8c16-4e38-ba96-a6e984fe3c92 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
