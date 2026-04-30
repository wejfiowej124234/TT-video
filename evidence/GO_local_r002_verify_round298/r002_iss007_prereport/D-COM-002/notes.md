# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ff8876da-6fb9-46e6-9b0c-8528209985bf path=/api/v1/community/posts status=200
[req] x-message-id=91073c5b-c633-4365-9f41-1f4c0253279c path=/api/v1/community/posts status=200
[req] x-request-id=7ffb2a04-c4a3-4c43-9072-6bcc2f0c0400 path=/api/v1/community/posts/16641340-6fd7-4f6c-90ab-0147c800f536 status=200
[req] x-message-id=e7c14b8e-b4f5-4a7c-bb54-476825365a59 path=/api/v1/community/posts/16641340-6fd7-4f6c-90ab-0147c800f536 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
