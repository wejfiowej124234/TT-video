# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=79d43712-502a-45e3-a5f8-bb41b82e1485 path=/api/v1/community/posts status=200
[req] x-message-id=39cf30a8-5c20-448d-b9bb-69220e61b881 path=/api/v1/community/posts status=200
[req] x-request-id=3719ac16-a255-472d-8b36-5712d4d00ff7 path=/api/v1/community/posts/390480a2-259d-4cd9-9976-e3c88d8352c2 status=200
[req] x-message-id=7871a215-0ec1-4bd2-b354-0904bf650495 path=/api/v1/community/posts/390480a2-259d-4cd9-9976-e3c88d8352c2 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
