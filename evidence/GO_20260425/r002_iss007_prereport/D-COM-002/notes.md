# D-COM-002

`cargo test -p traveltrust-api matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=6b2597e8-ca1c-4b84-948e-324d9e6e1af3 path=/api/v1/community/posts status=200
[req] x-message-id=2aec9d65-10c9-4966-b19d-e477f4790606 path=/api/v1/community/posts status=200
[req] x-request-id=705ed45f-7bb6-45a7-bc2e-2f8e89206420 path=/api/v1/community/posts/ee4afe20-b4b0-4d3b-801f-0b24d60d7c93 status=200
[req] x-message-id=8616be3a-6f86-41e8-b174-b0782e592e8f path=/api/v1/community/posts/ee4afe20-b4b0-4d3b-801f-0b24d60d7c93 status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-015 · Bearer POST post then unauthenticated GET detail matches body
