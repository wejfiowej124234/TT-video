# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3bdfd8cc-3952-4bb1-96d0-b593deb49a69 path=/api/v1/community/posts status=200
[req] x-message-id=2a9b1bf4-1940-4362-bdef-ad2ebeb0088d path=/api/v1/community/posts status=200
[req] x-request-id=ca0eccdd-53f1-4d20-8571-bb4df45155ed path=/api/v1/community/feed status=200
[req] x-message-id=ab308dfe-3db7-4d45-aa54-9199f6a1968b path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
