# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=023a1877-33df-4c0e-9281-9fec4600dfe9 path=/api/v1/community/posts status=200
[req] x-message-id=7fbe89d4-2534-4b7d-8531-78537507d327 path=/api/v1/community/posts status=200
[req] x-request-id=1a673e9b-11d7-4441-bc85-1887f2ab455f path=/api/v1/community/posts/ac336482-1b01-4bfa-bd1f-288b03d00110 status=200
[req] x-message-id=b1001a5d-8547-44ef-8471-f26b9db52733 path=/api/v1/community/posts/ac336482-1b01-4bfa-bd1f-288b03d00110 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
