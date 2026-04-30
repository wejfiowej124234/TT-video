# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=0ce7cc72-a564-4ad3-83dd-613a80285d22 path=/api/v1/community/posts status=200
[req] x-message-id=f46d6804-62d1-441e-bd2b-62e3ba1dd466 path=/api/v1/community/posts status=200
[req] x-request-id=b2248800-dbf2-4e80-adb7-01216ed33027 path=/api/v1/community/feed status=200
[req] x-message-id=baa54b0c-7245-42f9-a3b6-b883f2dbaf3a path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
