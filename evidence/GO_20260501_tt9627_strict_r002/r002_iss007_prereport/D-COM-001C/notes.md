# D-COM-001C

`cargo test -p traveltrust-api matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=7a102c84-da54-4253-9817-046c6c44fbb1 path=/api/v1/community/posts status=200
[req] x-message-id=668016e1-80e4-432e-99aa-2b08edef7af9 path=/api/v1/community/posts status=200
[req] x-request-id=5bcec5de-9dfe-4377-adf5-e7c0a94d401c path=/api/v1/community/feed status=200
[req] x-message-id=8104086c-9ec9-4c1c-8a51-8c6c0fa28836 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · POST tagged post then GET feed?tag includes same post id
