# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.36s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=28cdf2c3-bd62-4935-ba6c-770eaa4f3df6 path=/api/v1/orders/5eb44f39-962e-4bbe-90da-0c223151c6b4/messages status=200
[req] x-message-id=aa526d87-7af2-4c27-ba47-1637216c666e path=/api/v1/orders/5eb44f39-962e-4bbe-90da-0c223151c6b4/messages status=200
[req] x-request-id=091f327f-f6fb-455e-b4a6-fc21e0f6afea path=/api/v1/orders/5eb44f39-962e-4bbe-90da-0c223151c6b4/messages status=200
[req] x-message-id=c4cf1803-3df4-4ae1-a3ad-4190162b3bfc path=/api/v1/orders/5eb44f39-962e-4bbe-90da-0c223151c6b4/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
