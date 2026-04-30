# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=d0cdeddb-069c-4c26-8d03-99011dc29c44 path=/api/v1/community/posts status=200
[req] x-message-id=136d8510-9e6a-434d-a579-facb7a472a50 path=/api/v1/community/posts status=200
[req] x-request-id=734e378b-8382-4b60-b3ef-16da2597c2a6 path=/api/v1/community/posts/48d03147-8233-4bec-9dc8-a316d8f4be75 status=200
[req] x-message-id=7c830767-3edf-4569-ad30-93f79af2fc96 path=/api/v1/community/posts/48d03147-8233-4bec-9dc8-a316d8f4be75 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
