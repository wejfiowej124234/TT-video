# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3da22490-f264-492b-983c-523873f9fb40 path=/auth/register status=200
[req] x-message-id=fc14bf72-7621-4fdd-a029-eec753be800a path=/auth/register status=200
[req] x-request-id=567df479-04da-496d-9b54-065edb1ebe28 path=/api/v1/itineraries status=200
[req] x-message-id=c45bc4dc-6e84-490e-8490-f057432c3043 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=d527b8ec-de7b-49a4-b6e1-b83f8a05afd7 order_id=5d137666-7778-4534-b2da-42628726a1b8
[req] x-request-id=2081341d-3372-4818-aabc-f66ef9f89797 path=/api/v1/orders/5d137666-7778-4534-b2da-42628726a1b8/itinerary status=200
[req] x-message-id=4e9b1d19-61d7-475d-a9b4-042f9d823ee3 path=/api/v1/orders/5d137666-7778-4534-b2da-42628726a1b8/itinerary status=200
[req] x-request-id=7251209f-28cf-4af9-8c4e-a7475aaaf945 path=/api/v1/orders/5d137666-7778-4534-b2da-42628726a1b8 status=200
[req] x-message-id=b76d1b45-2929-4fbc-94a8-decef39b11bd path=/api/v1/orders/5d137666-7778-4534-b2da-42628726a1b8 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
