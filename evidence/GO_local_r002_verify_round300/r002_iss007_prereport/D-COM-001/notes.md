# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.16s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=dba2cb19-f278-491e-8a07-55dc02981e43 path=/api/v1/community/posts status=200
[req] x-message-id=066cafee-2aba-4170-a697-2f41a27a3fc1 path=/api/v1/community/posts status=200
[req] x-request-id=cc8f7256-32f7-44dd-81ec-4471df64b2fe path=/api/v1/community/feed status=200
[req] x-message-id=41bd0955-7806-4a67-abb6-be523c3cfc9b path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
