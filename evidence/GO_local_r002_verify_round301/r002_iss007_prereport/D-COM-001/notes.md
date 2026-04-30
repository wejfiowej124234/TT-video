# D-COM-001

`cargo test -p traveltrust-api matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.17s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=de1f7f8f-adcf-4707-8347-2ed2ea8a190d path=/api/v1/community/posts status=200
[req] x-message-id=42f9a7fb-02e9-41f4-8674-c4c4aa1d7698 path=/api/v1/community/posts status=200
[req] x-request-id=7c2b67c8-e55b-4754-812a-b13e42841317 path=/api/v1/community/feed status=200
[req] x-message-id=31cc9b34-6435-4a9e-a333-43ef703e3608 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
