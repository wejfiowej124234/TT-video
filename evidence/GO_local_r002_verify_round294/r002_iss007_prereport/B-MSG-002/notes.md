# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=25f987b3-71ec-4759-a78b-34f05ac2507f path=/api/v1/orders/b158bbf8-2d36-4edf-b020-5912c1a15018/messages status=200
[req] x-message-id=f760fb8b-c0d9-4c74-8d12-9a2df9807576 path=/api/v1/orders/b158bbf8-2d36-4edf-b020-5912c1a15018/messages status=200
[req] x-request-id=d85f3852-0d34-44eb-bab9-c5b741e49d80 path=/api/v1/orders/b158bbf8-2d36-4edf-b020-5912c1a15018/messages status=200
[req] x-message-id=c4f42c5b-ee4f-4b7d-b51a-acbcfae5271c path=/api/v1/orders/b158bbf8-2d36-4edf-b020-5912c1a15018/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
