# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=1490b4f4-311b-4089-bad6-f2486f2f514b path=/api/v1/orders/f6d3e06b-3011-4c78-9e0c-77c956299edc/messages status=200
[req] x-message-id=ed9083f2-8f51-419b-adc9-0921077c795a path=/api/v1/orders/f6d3e06b-3011-4c78-9e0c-77c956299edc/messages status=200
[req] x-request-id=126e07fb-6917-4b66-a911-f647b07540c2 path=/api/v1/orders/f6d3e06b-3011-4c78-9e0c-77c956299edc/messages status=200
[req] x-message-id=11eaf24f-de5f-433c-8c16-03127fb3c62f path=/api/v1/orders/f6d3e06b-3011-4c78-9e0c-77c956299edc/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
