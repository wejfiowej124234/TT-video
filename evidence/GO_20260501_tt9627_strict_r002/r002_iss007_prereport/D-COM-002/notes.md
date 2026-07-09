# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=b3b0fda2-a404-4719-a1fa-cd1da0c59154 path=/api/v1/community/posts status=200
[req] x-message-id=ff6500a9-2618-4496-a30b-67b1384ea2e7 path=/api/v1/community/posts status=200
[req] x-request-id=d0afe9c1-4b06-4bf1-bcc8-a6bb93658bc2 path=/api/v1/community/posts/6e72668b-af6c-4c8b-a9a8-bb6db1e5df53 status=200
[req] x-message-id=e970b592-cc34-4521-9e9d-9750906e830f path=/api/v1/community/posts/6e72668b-af6c-4c8b-a9a8-bb6db1e5df53 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
