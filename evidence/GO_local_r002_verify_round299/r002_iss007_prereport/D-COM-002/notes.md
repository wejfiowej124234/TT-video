# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3b4f623e-ac78-40ad-b9f6-4cb08b83887d path=/api/v1/community/posts status=200
[req] x-message-id=4e13da6c-ed8e-4e1f-9bbb-3e2f55e572ed path=/api/v1/community/posts status=200
[req] x-request-id=5b34a96c-b126-46bc-8358-fd51c00ba75a path=/api/v1/community/posts/ae372836-fbff-4676-b05d-b43631aa9f50 status=200
[req] x-message-id=b1c13faa-e028-4242-a955-3b2b40630a6b path=/api/v1/community/posts/ae372836-fbff-4676-b05d-b43631aa9f50 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
