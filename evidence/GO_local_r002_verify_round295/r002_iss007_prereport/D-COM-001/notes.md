# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.40s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=df25973b-28a7-43f3-b3db-19cd2f4b31e0 path=/api/v1/community/posts status=200
[req] x-message-id=77f21ae5-ee67-4eb7-ad79-3e125ab368f4 path=/api/v1/community/posts status=200
[req] x-request-id=d20eac35-b54e-44a3-b623-949b5afacfbf path=/api/v1/community/feed status=200
[req] x-message-id=949d0505-ad44-4f5b-bced-3ebaadd159f0 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
