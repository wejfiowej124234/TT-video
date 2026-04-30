# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ba4725f9-f52f-4885-9cab-780134ad0f36 path=/api/v1/community/posts status=200
[req] x-message-id=ee913edd-60bd-49d2-8366-27ba13474863 path=/api/v1/community/posts status=200
[req] x-request-id=e5151a36-11cd-4da8-8dc8-ea80e72d1882 path=/api/v1/community/feed status=200
[req] x-message-id=254808ac-be03-4fc6-938d-7a907bf7e037 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
