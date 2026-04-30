# D-COM-001C

`cargo test -p traveltrust-api matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.32s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=37bd7f2d-86fd-45f1-9b69-87e940ef9967 path=/api/v1/community/posts status=200
[req] x-message-id=d6e4479e-3e65-449a-a38b-75aa43888dc7 path=/api/v1/community/posts status=200
[req] x-request-id=07f2b14c-db84-49ed-bd1b-6640582b1d7a path=/api/v1/community/feed status=200
[req] x-message-id=53b6ed21-0a02-4100-ba8a-eaf48469ce7a path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · POST tagged post then GET feed?tag includes same post id
