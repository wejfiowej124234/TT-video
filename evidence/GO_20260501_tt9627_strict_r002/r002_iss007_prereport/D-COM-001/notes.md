# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.21s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=e384d7e2-d39a-4de6-85dc-14b77d542194 path=/api/v1/community/posts status=200
[req] x-message-id=009e01fd-5cd9-4473-b54f-dd885a79e104 path=/api/v1/community/posts status=200
[req] x-request-id=2e0281f9-cdf1-4614-b721-18cd6597b7ea path=/api/v1/community/feed status=200
[req] x-message-id=d87735d7-cc1b-4b8b-84c6-f15ef5d1af68 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
