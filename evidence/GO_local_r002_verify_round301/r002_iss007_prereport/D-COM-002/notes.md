# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.32s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=7825fadf-8e80-4cad-9dae-23d57d664dff path=/api/v1/community/posts status=200
[req] x-message-id=d75d78cf-55e4-4ebf-9f38-42cb828de074 path=/api/v1/community/posts status=200
[req] x-request-id=d1675232-a635-4a5c-935e-76fc1541f87e path=/api/v1/community/posts/68751a12-7ac5-41bc-932f-f1be5c585517 status=200
[req] x-message-id=04def620-b388-44da-9962-c417f0247679 path=/api/v1/community/posts/68751a12-7ac5-41bc-932f-f1be5c585517 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
