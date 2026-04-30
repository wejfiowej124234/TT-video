# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=a5a57ae6-2d60-4332-b2c7-867e25cdbff0 path=/api/v1/community/posts status=200
[req] x-message-id=a8114352-cd3a-4a41-b333-9a3317901758 path=/api/v1/community/posts status=200
[req] x-request-id=d3061b44-ac88-4b4d-9255-e23cbe7d7a0b path=/api/v1/community/posts/d92a94e9-299d-49d9-949b-2a268c75a528 status=200
[req] x-message-id=86f485af-0734-4016-944e-47ffc9bd5569 path=/api/v1/community/posts/d92a94e9-299d-49d9-949b-2a268c75a528 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
