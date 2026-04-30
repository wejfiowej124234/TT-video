# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ec54f4d0-4195-4259-b121-296784ca2a5d path=/api/v1/orders/bf821c9d-2bbd-41d5-95bd-587387592d99/messages status=200
[req] x-message-id=1e9ad98e-11c9-4008-93ce-1a39851f4006 path=/api/v1/orders/bf821c9d-2bbd-41d5-95bd-587387592d99/messages status=200
[req] x-request-id=d9af291f-7bf8-42c1-89c2-dd20f8e58516 path=/api/v1/orders/bf821c9d-2bbd-41d5-95bd-587387592d99/messages status=200
[req] x-message-id=375b9240-3d0f-45ec-9f84-d9b4bb5a76e3 path=/api/v1/orders/bf821c9d-2bbd-41d5-95bd-587387592d99/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
