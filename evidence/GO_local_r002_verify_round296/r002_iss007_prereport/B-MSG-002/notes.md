# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.16s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=f7828856-281e-4ed2-a962-7a15db86bbc9 path=/api/v1/orders/9c0cee93-ef18-4fe2-a6ae-475a9f209032/messages status=200
[req] x-message-id=801f3675-2d2c-47f9-af4d-55a95cde437b path=/api/v1/orders/9c0cee93-ef18-4fe2-a6ae-475a9f209032/messages status=200
[req] x-request-id=8ae190ae-969f-4a10-9367-88e63f5462dd path=/api/v1/orders/9c0cee93-ef18-4fe2-a6ae-475a9f209032/messages status=200
[req] x-message-id=03163741-9ed5-41d3-b961-58b542eb07c7 path=/api/v1/orders/9c0cee93-ef18-4fe2-a6ae-475a9f209032/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
