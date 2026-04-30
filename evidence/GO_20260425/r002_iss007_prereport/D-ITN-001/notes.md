# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.72s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=216690bc-9d5d-4522-bba7-63cd98ae029c path=/auth/register status=200
[req] x-message-id=dfee8891-5465-41bc-b308-d21f672d749a path=/auth/register status=200
[req] x-request-id=016130bc-2832-4cd8-8a87-5645e3987706 path=/api/v1/itineraries status=200
[req] x-message-id=7bbaba6f-bbef-4e21-917c-d9d1cd3e60d1 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=f2a31b39-78a9-4bf6-993d-08975d74b232 order_id=8c4da7eb-16bb-43f1-89b6-e6de5146be13
[req] x-request-id=1ec20a2b-ce13-47a7-8d65-d7db0a90f7f2 path=/api/v1/orders/8c4da7eb-16bb-43f1-89b6-e6de5146be13/itinerary status=200
[req] x-message-id=8c740d71-a827-4775-8ae2-b89277cfaea0 path=/api/v1/orders/8c4da7eb-16bb-43f1-89b6-e6de5146be13/itinerary status=200
[req] x-request-id=f290d9c5-d21b-4192-b4da-229ed7367134 path=/api/v1/orders/8c4da7eb-16bb-43f1-89b6-e6de5146be13 status=200
[req] x-message-id=6cba6c48-d100-41c2-af23-d063e12f123f path=/api/v1/orders/8c4da7eb-16bb-43f1-89b6-e6de5146be13 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
