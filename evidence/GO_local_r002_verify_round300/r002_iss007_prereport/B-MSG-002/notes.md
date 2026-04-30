# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=428cb173-3f34-4780-9f3d-f317b57bc204 path=/api/v1/orders/237cc9f8-23c8-4bde-a2d4-a3fcbac43aa3/messages status=200
[req] x-message-id=20d699c6-31ac-4716-ae70-0d389761cff8 path=/api/v1/orders/237cc9f8-23c8-4bde-a2d4-a3fcbac43aa3/messages status=200
[req] x-request-id=3bac5e2b-4e7f-4cc2-af7d-ac987650b90e path=/api/v1/orders/237cc9f8-23c8-4bde-a2d4-a3fcbac43aa3/messages status=200
[req] x-message-id=0986c166-22cb-4565-8b70-b8b91769f27c path=/api/v1/orders/237cc9f8-23c8-4bde-a2d4-a3fcbac43aa3/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
