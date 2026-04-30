# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.16s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.35s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=1254f9e4-bf3f-47a5-abe4-fcda0520b594 path=/api/v1/community/posts status=200
[req] x-message-id=0cf874d7-040a-4169-9da1-12daa6b074d4 path=/api/v1/community/posts status=200
[req] x-request-id=9ca2402e-210f-4f30-b02a-6473a2dded70 path=/api/v1/community/posts/35fdd241-edb0-47a9-a87a-dfbb5260e43c status=200
[req] x-message-id=134ce6e3-38df-4b61-a617-3e8c77a9c872 path=/api/v1/community/posts/35fdd241-edb0-47a9-a87a-dfbb5260e43c status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
