# D-COM-001C

`cargo test -p traveltrust-api matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.16s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b38900b3-cb14-4aa4-9c9a-ff3834624ef1 path=/api/v1/community/posts status=200
[req] x-message-id=d89700bf-3c6d-486e-9de4-207a122af40c path=/api/v1/community/posts status=200
[req] x-request-id=2735ef42-f2b0-4fa3-9a22-ccab1a6bcf18 path=/api/v1/community/feed status=200
[req] x-message-id=2a56ac2d-eff1-4c72-8424-a37bba1c7b4e path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · POST tagged post then GET feed?tag includes same post id
