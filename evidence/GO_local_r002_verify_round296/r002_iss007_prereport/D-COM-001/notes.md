# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=dd9b0607-d1ac-4e56-893d-8c7bf8b35a40 path=/api/v1/community/posts status=200
[req] x-message-id=d4370d11-b932-41bd-bbf4-c6e33ae4d8d8 path=/api/v1/community/posts status=200
[req] x-request-id=f0331b01-39f3-40f6-afd7-d297634d6b20 path=/api/v1/community/feed status=200
[req] x-message-id=3f46356c-a4bb-4dd5-9b8d-e7881967a326 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
