# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=df4ce7a6-f119-4741-a445-636c1ef37b77 path=/api/v1/community/posts status=200
[req] x-message-id=cb94f60a-13b5-427d-97a4-09c9b19e5f22 path=/api/v1/community/posts status=200
[req] x-request-id=dbfb2a1b-2b34-480b-a53b-dde5056467f0 path=/api/v1/community/posts/7e698618-b02e-4f09-9f60-72272b205816 status=200
[req] x-message-id=c674f83f-9b45-451f-9ae2-611a358bd8de path=/api/v1/community/posts/7e698618-b02e-4f09-9f60-72272b205816 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
