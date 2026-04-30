# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b466ecac-0ca0-488f-b2b2-e71c38a9b27b path=/api/v1/orders/02f7858f-001b-4624-a374-9cd69c15b9a1/messages status=200
[req] x-message-id=557f22c7-f5a6-43e9-a6b2-2a7113ed1984 path=/api/v1/orders/02f7858f-001b-4624-a374-9cd69c15b9a1/messages status=200
[req] x-request-id=b23daf3f-828b-411c-902b-3d05ccecbf22 path=/api/v1/orders/02f7858f-001b-4624-a374-9cd69c15b9a1/messages status=200
[req] x-message-id=44bcee2d-3769-4596-8cc3-57d66c3c7f0f path=/api/v1/orders/02f7858f-001b-4624-a374-9cd69c15b9a1/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
