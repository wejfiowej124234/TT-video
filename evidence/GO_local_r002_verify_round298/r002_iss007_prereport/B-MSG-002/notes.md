# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=5f39dd46-9c55-4d5d-8f5e-67ed62286658 path=/api/v1/orders/d9e7e4d6-bed5-46d4-934c-237a29930577/messages status=200
[req] x-message-id=d07edbd0-5cba-4f0e-a5ae-6b52b25be9db path=/api/v1/orders/d9e7e4d6-bed5-46d4-934c-237a29930577/messages status=200
[req] x-request-id=9e189fab-433c-4c75-95e2-d84679fa817d path=/api/v1/orders/d9e7e4d6-bed5-46d4-934c-237a29930577/messages status=200
[req] x-message-id=8c9fadc4-151a-4ee3-8a98-a36786b21a53 path=/api/v1/orders/d9e7e4d6-bed5-46d4-934c-237a29930577/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
