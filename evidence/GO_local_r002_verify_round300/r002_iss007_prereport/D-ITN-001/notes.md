# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=286458d6-03fa-49cc-aac8-938ea794846a path=/auth/register status=200
[req] x-message-id=1e0d9207-4c8a-4884-a468-1751efb1a7c0 path=/auth/register status=200
[req] x-request-id=9efa227c-a636-4bd1-9d18-344bfd131e24 path=/api/v1/itineraries status=200
[req] x-message-id=d35f93a8-85d7-4bcd-bd5a-6481dbfb8af1 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=ac5a21fd-5fa1-4a7b-ad36-dc05d7200823 order_id=ec1d94ef-9f48-47cd-befa-fec527432107
[req] x-request-id=b4545afc-f904-451b-9711-452fe8a1c019 path=/api/v1/orders/ec1d94ef-9f48-47cd-befa-fec527432107/itinerary status=200
[req] x-message-id=1eca9fcd-ed0d-41f8-80a9-5ba524104618 path=/api/v1/orders/ec1d94ef-9f48-47cd-befa-fec527432107/itinerary status=200
[req] x-request-id=2a4e37c9-8340-4cf7-bde3-32c39cee896e path=/api/v1/orders/ec1d94ef-9f48-47cd-befa-fec527432107 status=200
[req] x-message-id=4e9a8a0d-21f2-4b4c-be34-f22b99a75ac5 path=/api/v1/orders/ec1d94ef-9f48-47cd-befa-fec527432107 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
