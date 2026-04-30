# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=afd7d621-709a-4845-8707-1d5f0aae6e2c path=/api/v1/orders/c235df75-b59d-4e72-86e4-2473e33b4be8/messages status=200
[req] x-message-id=b586e43b-b490-440b-b291-8115a976bfde path=/api/v1/orders/c235df75-b59d-4e72-86e4-2473e33b4be8/messages status=200
[req] x-request-id=01773ec3-5baa-4a10-b44f-e47d37a156e7 path=/api/v1/orders/c235df75-b59d-4e72-86e4-2473e33b4be8/messages status=200
[req] x-message-id=3dd8c98c-71ef-4639-909f-dfd9eb00c4a0 path=/api/v1/orders/c235df75-b59d-4e72-86e4-2473e33b4be8/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
