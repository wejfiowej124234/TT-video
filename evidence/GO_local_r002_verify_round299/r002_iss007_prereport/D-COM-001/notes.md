# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ffaa54c6-9c84-4234-ae21-ed2e58fc8c70 path=/api/v1/community/posts status=200
[req] x-message-id=9e6a2d4d-7270-4db2-9a63-291305944881 path=/api/v1/community/posts status=200
[req] x-request-id=697f1bcd-691c-4032-a73a-453a0d76a112 path=/api/v1/community/feed status=200
[req] x-message-id=79332aae-b080-48bb-8a5a-a27b956ec662 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
