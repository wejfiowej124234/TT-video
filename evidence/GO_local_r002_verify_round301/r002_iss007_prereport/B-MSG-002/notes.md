# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ff04463e-41df-4ecc-9942-bf2d9ef7219d path=/api/v1/orders/07ab7753-1022-4a9d-9acb-57358629a837/messages status=200
[req] x-message-id=0367034b-e388-47cf-b8d2-509324d40f17 path=/api/v1/orders/07ab7753-1022-4a9d-9acb-57358629a837/messages status=200
[req] x-request-id=d72338ac-125d-46e4-a998-8eb61abf95bd path=/api/v1/orders/07ab7753-1022-4a9d-9acb-57358629a837/messages status=200
[req] x-message-id=b4d1b695-bd26-417a-99ba-37044ae18f54 path=/api/v1/orders/07ab7753-1022-4a9d-9acb-57358629a837/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
