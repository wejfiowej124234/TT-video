# B-MSG-002

`cargo test -p traveltrust-api matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg` exit=0

```

running 1 test
test routes::messages_db_api_tests::matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=56584b34-7ee5-4681-844d-4944d37f3e65 path=/api/v1/orders/5b87d91a-387b-4ad7-b3c1-2499b5493a22/messages status=200
[req] x-message-id=731605de-7f8b-49b7-a53c-5328650e9089 path=/api/v1/orders/5b87d91a-387b-4ad7-b3c1-2499b5493a22/messages status=200
[req] x-request-id=902eed81-0e99-4c61-96c2-d3deafa8253d path=/api/v1/orders/5b87d91a-387b-4ad7-b3c1-2499b5493a22/messages status=200
[req] x-message-id=40928b4f-2a86-4b59-bd80-6e8bb51b98b0 path=/api/v1/orders/5b87d91a-387b-4ad7-b3c1-2499b5493a22/messages status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-026 · POST order message then GET lists content
