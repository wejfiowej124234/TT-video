# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=09035952-0835-46fe-922e-afda8cc2d731 path=/api/v1/community/posts status=200
[req] x-message-id=46209b26-f2ad-4a16-9332-7d4d28c41ec6 path=/api/v1/community/posts status=200
[req] x-request-id=ba0d85d8-63b3-4dc4-9fa9-f488adde2f04 path=/api/v1/community/feed status=200
[req] x-message-id=198505a7-bec3-48b7-9c8b-97423689c93a path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
