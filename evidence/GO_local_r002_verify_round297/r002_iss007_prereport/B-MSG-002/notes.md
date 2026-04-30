# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=f41b9219-d96b-4ce8-85bc-4df198e4cf21 path=/api/v1/orders/ccbe91c4-b7ce-4b9c-a22c-c64ee2f5dc80/messages status=200
[req] x-message-id=28f703b2-6d30-4f97-8633-e8b1b48044ed path=/api/v1/orders/ccbe91c4-b7ce-4b9c-a22c-c64ee2f5dc80/messages status=200
[req] x-request-id=1045293d-331e-4b02-be87-fef53c03aa38 path=/api/v1/orders/ccbe91c4-b7ce-4b9c-a22c-c64ee2f5dc80/messages status=200
[req] x-message-id=894e7b9f-d487-4123-8c1c-1503b2c49ec6 path=/api/v1/orders/ccbe91c4-b7ce-4b9c-a22c-c64ee2f5dc80/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
